import os
import json
import asyncio
import aiohttp
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from dotenv import load_dotenv
from firebase_admin import credentials, initialize_app, firestore
from crewai import Agent, Task, Crew, LLM
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

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

# Inicialização do Firebase
cred = credentials.Certificate('credentials.json')
firebase_app = initialize_app(cred)
db = firestore.client()

# Configuração do modelo LLM
llm = LLM(
    model="sambanova/Meta-Llama-3.1-8B-Instruct",
    base_url="https://api.sambanova.ai/v1/",
    api_key=os.environ.get('SAMBANOVA_API_KEY'),
    temperature=0.5,
    max_tokens=1000,
    top_p=0.9
)

# Inicialização do FastAPI
app = FastAPI(title="Image Generator API")

# Modelo Pydantic para a requisição
class GenerationRequest(BaseModel):
    topic: str
    user_id: str

# Classe para Gerar Imagens
class ImageGenerator:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {API_TOKEN}",
            "Content-Type": "application/json"
        }
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    
    def format_prompt(self, prompt: str) -> str:
        """Formata o prompt base."""
        base_prompt = """
        Create a cheerful, child-friendly illustration with the following characteristics:
        - Cute and simple cartoon style
        - Vibrant and bright colors
        - Soft edges and rounded shapes
        - Clean and clear composition
        - Safe and appropriate for young children
        - Simple background with minimal details
        - 2D style with minimal shading
        
        The illustration should show: """
        return f"{base_prompt} {prompt}. Make it simple and easily recognizable for children."

    async def generate_single_image(self, session: aiohttp.ClientSession, prompt: str) -> Optional[str]:
        """Gera uma única imagem a partir do prompt."""
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
                    if response.status == 429:  # Rate limit
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

    async def process_items(self, session: aiohttp.ClientSession, items: List[Tuple[str, str]], tipo: str) -> List[Dict[str, str]]:
        """Processa uma lista de itens (palavras ou frases) para gerar imagens."""
        tasks = [self.generate_single_image(session, item[1]) for item in items]
        urls = await asyncio.gather(*tasks)
        return [
            {"tipo": tipo, "texto_pt": item[0], "texto_en": item[1], "url": url}
            for item, url in zip(items, urls) if url
        ]

    async def save_images_to_collection(self, user_id: str, collection_id: str, images: List[Dict[str, str]]):
        """Salva as imagens na coleção do usuário no Firestore."""
        try:
            collection_ref = db.collection('users').document(user_id).collection('collections').document(collection_id)
            images_ref = collection_ref.collection('images')

            batch_write = db.batch()
            for image in images:
                doc_ref = images_ref.document()
                image['created_at'] = datetime.now()
                batch_write.set(doc_ref, image)
            
            await asyncio.to_thread(batch_write.commit)
            logger.info(f"{len(images)} imagens salvas na coleção '{collection_id}' do usuário '{user_id}'.")
        except Exception as e:
            logger.error(f"Erro ao salvar imagens na coleção: {e}")
            raise

    async def generate_images_for_collection(self, user_id: str, collection_id: str, data: Dict[str, List[Tuple[str, str]]]):
        """Gera imagens para uma coleção específica e salva no Firestore."""
        async with aiohttp.ClientSession() as session:
            palavras_task = self.process_items(session, data["palavras"], "palavra")
            frases_task = self.process_items(session, data["frases"], "frase")
            
            palavras_results, frases_results = await asyncio.gather(palavras_task, frases_task)

            all_images = palavras_results + frases_results

            # Salva no Firestore
            await self.save_images_to_collection(user_id, collection_id, all_images)

            logger.info(
                f"Processamento concluído: {len(palavras_results)} palavras e {len(frases_results)} frases geradas."
            )
            
            return all_images

async def create_collection(user_id: str, collection_title: str) -> str:
    """Cria uma nova coleção para um usuário no Firestore."""
    try:
        collection_ref = db.collection('users').document(user_id).collection('collections').document()
        collection_data = {
            "title": collection_title,
            "created_at": datetime.now()
        }
        collection_ref.set(collection_data)
        logger.info(f"Coleção '{collection_title}' criada com ID: {collection_ref.id}")
        return collection_ref.id
    except Exception as e:
        logger.error(f"Erro ao criar coleção: {e}")
        raise

def create_agents():
    """Cria agentes para geração de palavras e frases."""
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
    """Extrai JSON de uma string."""
    try:
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            return json.loads(text[start_idx:end_idx + 1])
    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON: {e}")
    return None

def format_results(word_list_results, sentence_results):
    """Formata os resultados em um formato padronizado."""
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

async def generate_content_and_images(topic: str, user_id: str):
    """Função principal que gera conteúdo e imagens de forma assíncrona."""
    logger.info(f"Iniciando geração de conteúdo para o tema: {topic}")
    
    try:
        # Cria uma coleção para o usuário
        collection_id = await create_collection(user_id, f"Coleção de {topic}")
        
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

        # Gera as imagens e salva na coleção
        logger.info("Iniciando geração de imagens...")
        generator = ImageGenerator()
        images = await generator.generate_images_for_collection(user_id, collection_id, generated_data)
        
        return {
            "collection_id": collection_id,
            "images": images,
            "words": generated_data["palavras"],
            "sentences": generated_data["frases"]
        }
        
    except Exception as e:
        logger.error(f"Erro durante o processo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_images(request: GenerationRequest):
    """
    Endpoint para gerar imagens baseadas em um tópico para um usuário específico.
    
    Args:
        request: GenerationRequest contendo topic e user_id
        
    Returns:
        Dict contendo collection_id, imagens geradas, palavras e frases
    """
    try:
        result = await generate_content_and_images(request.topic, request.user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)