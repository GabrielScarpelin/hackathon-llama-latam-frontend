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
app = FastAPI(title="Content and Image Generator API")

# Modelos Pydantic
class ContentGenerationRequest(BaseModel):
    topic: str
    user_id: str

class ImageGenerationRequest(BaseModel):
    collection_id: str
    text_en: str

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

async def generate_content(topic: str, user_id: str):
    """Gera o conteúdo (palavras e frases) e salva no Firestore, retornando todo o conteúdo gerado."""
    logger.info(f"Iniciando geração de conteúdo para o tema: {topic}")
    
    try:
        # Verifica se o usuário existe
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Usuário não encontrado: {user_id}"
            )
            
        # Cria nova coleção para o usuário
        collections_ref = user_ref.collection('collections').document()
        
        collection_data = {
            "title": f"Coleção de {topic}",
            "created_at": datetime.now(),
            "topic": topic
        }
        collections_ref.set(collection_data)
        collection_id = collections_ref.id
        
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

        # Extrai e processa as palavras
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
        sentences_json = extract_json(str(sentences_result))

        # Prepara as listas para armazenar todo o conteúdo
        words_content = []
        sentences_content = []
        
        # Salva palavras no Firestore e adiciona à lista de conteúdo
        images_ref = collections_ref.collection('images')
        
        for pt, en in zip(words_pt, words_en):
            doc_ref = images_ref.document()
            word_data = {
                "tipo": "palavra",
                "texto_pt": pt,
                "texto_en": en,
                "created_at": datetime.now()
            }
            doc_ref.set(word_data)
            words_content.append({
                "id": doc_ref.id,
                **word_data
            })

        # Salva frases no Firestore e adiciona à lista de conteúdo
        frases_pt = sentences_json.get("frases_pt", [])[:5] if sentences_json else []
        frases_en = sentences_json.get("frases_en", [])[:5] if sentences_json else []
        
        for pt, en in zip(frases_pt, frases_en):
            doc_ref = images_ref.document()
            sentence_data = {
                "tipo": "frase",
                "texto_pt": pt,
                "texto_en": en,
                "created_at": datetime.now()
            }
            doc_ref.set(sentence_data)
            sentences_content.append({
                "id": doc_ref.id,
                **sentence_data
            })

        # Prepara a resposta completa
        response_data = {
            "collection_id": collection_id,
            "title": collection_data["title"],
            "topic": topic,
            "created_at": collection_data["created_at"],
            "words": words_content,
            "sentences": sentences_content
        }

        return response_data
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Erro durante o processo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/content")
async def generate_content_endpoint(request: ContentGenerationRequest):
    """
    Endpoint para gerar conteúdo (palavras e frases) e retornar todo o conteúdo gerado.
    """
    try:
        result = await generate_content(request.topic, request.user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/image")
async def generate_image_endpoint(request: ImageGenerationRequest):
    """
    Endpoint para gerar uma única imagem usando collection_id e texto em inglês.
    """
    try:
        # Busca todas as coleções de todos os usuários
        users_ref = db.collection('users')
        all_users = users_ref.stream()
        
        collection_ref = None
        # Procura a coleção específica em todos os usuários
        for user in all_users:
            possible_collection = users_ref.document(user.id).collection('collections').document(request.collection_id)
            if possible_collection.get().exists:
                collection_ref = possible_collection
                break
                
        if not collection_ref:
            raise HTTPException(
                status_code=404,
                detail=f"Coleção não encontrada: {request.collection_id}"
            )
            
        images_ref = collection_ref.collection('images')
        query = images_ref.where('texto_en', '==', request.text_en).limit(1)
        docs = query.get()
        
        doc_ref = None
        doc_data = None
        
        for doc in docs:
            doc_ref = doc.reference
            doc_data = doc.to_dict()
            break
            
        if not doc_ref:
            raise HTTPException(
                status_code=404,
                detail=f"Texto não encontrado na coleção: {request.text_en}"
            )
            
        # Verifica se já tem URL
        if doc_data.get('url'):
            return {
                "success": True,
                "url": doc_data['url'],
                "message": "Imagem já existe para este texto",
                "data": doc_data
            }
        
        # Gera a nova imagem
        generator = ImageGenerator()
        async with aiohttp.ClientSession() as session:
            url = await generator.generate_single_image(session, request.text_en)
            
            if url:
                # Atualiza o documento com a URL
                doc_ref.update({
                    "url": url,
                    "updated_at": datetime.now()
                })
                
                doc_data['url'] = url
                doc_data['updated_at'] = datetime.now()
                
                return {
                    "success": True,
                    "url": url,
                    "message": "Imagem gerada e documento atualizado com sucesso",
                    "data": doc_data
                }
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Não foi possível gerar a imagem"
                )
                
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Erro ao gerar imagem: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)