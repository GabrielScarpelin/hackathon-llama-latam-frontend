import os
import json
import asyncio
import aiohttp
import logging
from typing import Dict, List, Tuple, Optional
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from aiosqlite import connect as aio_connect
from crewai import Agent, Task, Crew, LLM

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)     
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()
API_TOKEN = os.getenv('API_TOKEN')
BASE_URL = "https://api.aimlapi.com/images/generations"

# Configurações
MAX_CONCURRENT_REQUESTS = 5
BATCH_SIZE = 10
REQUEST_TIMEOUT = 30

# Configuração do modelo LLM
llm = LLM(
    model="sambanova/Meta-Llama-3.1-8B-Instruct",
    base_url="https://api.sambanova.ai/v1/",
    api_key=os.environ.get('SAMBANOVA_API_KEY'),
    temperature=0.5,
    max_tokens=1000,
    top_p=0.9
)

class ImageGenerator:
    def __init__(self, db_path: str = "imagens.db"):
        self.db_path = db_path
        self.headers = {
            "Authorization": f"Bearer {API_TOKEN}",
            "Content-Type": "application/json"
        }
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
        # Prompt padrão para estilo infantil
        self.base_prompt = "Create a cute, simple 2D cartoon with bright colors, rounded shapes and minimal details, showing: "
    def format_prompt(self, prompt: str) -> str:
        """Combina o prompt base com o prompt específico"""
        return f"{self.base_prompt} {prompt}. Make it simple and easily recognizable for children."

    @asynccontextmanager
    async def get_db_connection(self):
        """Gerenciador de contexto assíncrono para conexão com o banco"""
        db = await aio_connect(self.db_path)
        try:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS imagens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tipo TEXT,
                    texto_pt TEXT,
                    texto_en TEXT,
                    url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.commit()
            yield db
        finally:
            await db.close()

    async def generate_single_image(self, session: aiohttp.ClientSession, prompt: str) -> Optional[str]:
        """Gera uma única imagem de forma assíncrona usando texto em inglês"""
        async with self.semaphore:
            formatted_prompt = self.format_prompt(prompt)
            data = {
                "provider": "fal-ai",
                "model": "flux-pro/v1.1-ultra-raw",
                "prompt": formatted_prompt,
                "size": "256x256"
            }

            try:
                async with session.post(BASE_URL, headers=self.headers, json=data, timeout=REQUEST_TIMEOUT) as response:
                    if response.status == 429:
                        await asyncio.sleep(1)
                        return await self.generate_single_image(session, prompt)
                    
                    response.raise_for_status()
                    result = await response.json()

                    if "images" in result and result["images"]:
                        return result["images"][0].get("url")
                    
                    logger.warning(f"Nenhuma URL encontrada para '{prompt}'")
                    return None

            except Exception as e:
                logger.error(f"Erro ao gerar imagem para '{prompt}': {e}")
                return None

    async def save_batch_to_db(self, db, batch: List[Tuple[str, str, str, str]]):
        """Salva um lote de dados no banco de forma assíncrona"""
        try:
            await db.executemany(
                "INSERT INTO imagens (tipo, texto_pt, texto_en, url) VALUES (?, ?, ?, ?)",
                batch
            )
            await db.commit()
        except Exception as e:
            logger.error(f"Erro ao salvar lote no banco: {e}")
            raise

    async def process_items(self, session: aiohttp.ClientSession, items: List[Tuple[str, str]], tipo: str) -> List[Tuple[str, str, str]]:
        """Processa uma lista de items (palavras ou frases) em português e inglês"""
        tasks = [self.generate_single_image(session, item[1]) for item in items]  # Usa versão em inglês
        urls = await asyncio.gather(*tasks)
        return [(item[0], item[1], url) for item, url in zip(items, urls) if url]

    async def generate_images(self, data: Dict[str, List[Tuple[str, str]]]):
        """Função principal para gerar imagens de forma assíncrona"""
        async with aiohttp.ClientSession() as session, self.get_db_connection() as db:
            palavras_task = self.process_items(session, data["palavras"], "palavra")
            frases_task = self.process_items(session, data["frases"], "frase")
            
            palavras_results, frases_results = await asyncio.gather(
                palavras_task, 
                frases_task
            )

            all_data = (
                [("palavra", p[0], p[1], p[2]) for p in palavras_results] +  # pt, en, url
                [("frase", f[0], f[1], f[2]) for f in frases_results]
            )

            for i in range(0, len(all_data), BATCH_SIZE):
                batch = all_data[i:i + BATCH_SIZE]
                await self.save_batch_to_db(db, batch)

            logger.info(
                f"Processamento concluído: {len(palavras_results)} palavras e "
                f"{len(frases_results)} frases geradas"
            )

def create_agents():
    word_list_agent = Agent(
        role="Gerador de Lista de Palavras Bilíngue",
        goal="Gerar uma lista de palavras relacionadas a um tema em português e inglês",
        backstory="Especialista que gera listas de palavras bilíngues relacionadas a um tema específico",
        llm=llm,
        verbose=True
    )

    sentence_agent = Agent(
        role="Gerador de Frases Bilíngue",
        goal="Criar frases expositivas com elementos visuais em português e inglês",
        backstory="Especialista em criar frases descritivas e visuais bilíngues para ajudar no aprendizado de crianças",
        llm=llm,
        verbose=True
    )

    return word_list_agent, sentence_agent

def extract_json(text):
    try:
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            json_str = text[start_idx:end_idx + 1]
            return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON: {e}")
    return None

def format_results(word_list_results, sentence_results):
    word_list_json = extract_json(str(word_list_results))
    sentences_json = extract_json(str(sentence_results))
    
    result = {
        "palavras": [(pt, en) for pt, en in zip(
            word_list_json.get("palavras_pt", []),
            word_list_json.get("palavras_en", [])
        )] if word_list_json else [],
        "frases": [(pt, en) for pt, en in zip(
            sentences_json.get("frases_pt", []),
            sentences_json.get("frases_en", [])
        )][:5] if sentences_json else []
    }
    
    return result

async def generate_content_and_images(topic):
    """Função principal que gera conteúdo bilíngue e imagens de forma assíncrona"""
    word_list_agent, sentence_agent = create_agents()

    # Task para lista de palavras
    word_list_task = Task(
        description=f"""
        Gere EXATAMENTE um JSON com uma lista de até 5 palavras relacionadas ao tema: {topic}, em português e inglês.
        Use este formato:

        {{
            "palavras_pt": ["palavra1_pt", "palavra2_pt", "palavra3_pt"],
            "palavras_en": ["word1_en", "word2_en", "word3_en"]
        }}

        IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.
        """,
        expected_output="JSON com lista de palavras em português e inglês",
        agent=word_list_agent
    )

    crew_words = Crew(
        agents=[word_list_agent],
        tasks=[word_list_task],
        verbose=True
    )
    word_list_result = crew_words.kickoff()

    word_list_json = extract_json(str(word_list_result))
    words_pt = word_list_json.get("palavras_pt", [])[:5] if word_list_json else []
    words_en = word_list_json.get("palavras_en", [])[:5] if word_list_json else []

    if not words_pt or not words_en:
        raise ValueError("Nenhuma lista de palavras foi gerada.")

    # Task para frases
    sentence_task = Task(
        description=f"""
        Gere EXATAMENTE um JSON com até 5 frases expositivas e visuais usando estas palavras em português e inglês.
        Palavras PT: {', '.join(words_pt)}
        Palavras EN: {', '.join(words_en)}
        As frases devem ser simples e ajudar as crianças a imaginar o que está sendo descrito. AS FRASES DEVEM TER NO MAXIMO 3 PALAVRAS.
        Use este formato: 

        {{
            "frases_pt": [
                "Frase exemplo em português",
                "Outra frase em português"
            ],
            "frases_en": [
                "Example phrase in English",
                "Another phrase in English"
            ]
        }}

        IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.
        """,
        expected_output="JSON com frases descritivas em português e inglês",
        agent=sentence_agent
    )

    crew_sentences = Crew(
        agents=[sentence_agent],
        tasks=[sentence_task],
        verbose=True
    )
    sentences_result = crew_sentences.kickoff()

    # Formata os resultados
    generated_data = format_results(word_list_result, sentences_result)
    
    # Gera as imagens de forma assíncrona usando o texto em inglês
    logger.info("Iniciando geração de imagens...")
    generator = ImageGenerator()
    await generator.generate_images(generated_data)
    
    return generated_data

async def main():
    topic = "Animais"  # Alterar o tema conforme necessário
    try:
        generated_data = await generate_content_and_images(topic)
        logger.info("Processo completo!")
        logger.info(f"Dados gerados: {generated_data}")
    except Exception as e:
        logger.error(f"Erro durante o processo: {e}")

if __name__ == "__main__":
    asyncio.run(main())