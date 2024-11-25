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
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware

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

class UserRegistration(BaseModel):
    name: str
    email: EmailStr
    image_url: str
    age: int
    experience_level: str  # beginner, intermediated, advanced
    interesting: str
    learning_time: int  # 10, 20, 30, 40, 50, +60

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    image_url: str
    age: int
    experience_level: str
    interesting: str
    learning_time: int
    created_at: datetime
    roadmap_level: int

class ContentGenerationRequest(BaseModel):
    topic: str
    user_id: str

class ImageGenerationRequest(BaseModel):
    collection_id: str
    text_en: str

class UserCheckRequest(BaseModel):
    email: str

class UpdateRoadmapRequest(BaseModel):
    roadmap_level: int

class RoadMapResponse(BaseModel):
    id: str
    roadmap_level: int

@app.post("/users/register", response_model=UserResponse)
async def register_user(user: UserRegistration):
    """
    Registra um novo usuário no sistema com campos adicionais.
    """
    try:
        # Validação do experience_level
        valid_experience_levels = ["beginner", "intermediated", "advanced"]
        if user.experience_level.lower() not in valid_experience_levels:
            raise HTTPException(
                status_code=400,
                detail="Nível de experiência deve ser: beginner, intermediated ou advanced"
            )
        
        # Validação do learning_time
        valid_learning_times = [10, 20, 30, 40, 50, 60]
        if user.learning_time not in valid_learning_times and user.learning_time <= 60:
            raise HTTPException(
                status_code=400,
                detail="Tempo de aprendizado deve ser: 10, 20, 30, 40, 50 ou 60 (para +60)"
            )
        
        # Verifica se já existe um usuário com o mesmo email
        users_ref = db.collection('users')
        existing_users = users_ref.where('email', '==', user.email).get()
        
        if len(list(existing_users)) > 0:
            raise HTTPException(
                status_code=400,
                detail="Um usuário com este email já existe"
            )
        
        # Cria novo documento de usuário
        new_user_ref = users_ref.document()
        user_data = {
            "name": user.name,
            "email": user.email,
            "image_url": user.image_url,
            "age": user.age,
            "experience_level": user.experience_level.lower(),
            "interesting": user.interesting,
            "learning_time": user.learning_time,
            "created_at": datetime.now(),
            "roadmap_level": 0

        }
        
        new_user_ref.set(user_data)
        
        return {
            "id": new_user_ref.id,
            **user_data
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Erro ao registrar usuário: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Modelo para o corpo da requisição
class UpdateRoadmapRequest(BaseModel):
    roadmap_level: int

@app.put("/users/{user_id}/update-roadmap", response_model=RoadMapResponse)
async def update_user_roadmap(user_id: str, request: UpdateRoadmapRequest):
    """
    Atualiza o nível do roadmap de um usuário existente.
    """
    try:
        # Validação do roadmap_level
        if request.roadmap_level < 0:
            raise HTTPException(
                status_code=400,
                detail="O roadmap_level deve ser um número inteiro maior ou igual a 0"
            )

        # Referência ao documento do usuário
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado"
            )

        # Atualizar o roadmap_level
        user_ref.update({"roadmap_level": request.roadmap_level})

        # Obter os dados atualizados do usuário
        updated_user_doc = user_ref.get()
        updated_user_data = updated_user_doc.to_dict()

        return {
            "id": user_id,
            **updated_user_data
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Erro ao atualizar roadmap_level do usuário {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """
    Obtém informações de um usuário específico.
    """
    try:
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado"
            )
        
        return {
            "id": user_id,
            **user_doc.to_dict()
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Erro ao buscar usuário: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        - Purple and simple background with minimal details
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
        
        # Verifica se já existe uma coleção com o mesmo tópico para este usuário
        collections_ref = user_ref.collection('collections')
        existing_collections = collections_ref.where('topic', '==', topic.lower().strip()).get()
        
        # Se encontrar uma coleção existente, retorna ela
        for collection in existing_collections:
            collection_data = collection.to_dict()
            
            # Busca as palavras e frases da coleção existente
            images_ref = collections_ref.document(collection.id).collection('images')
            images_docs = images_ref.stream()
            
            words_content = []
            sentences_content = []
            
            for doc in images_docs:
                doc_data = doc.to_dict()
                if doc_data['tipo'] == 'palavra':
                    words_content.append({
                        "id": doc.id,
                        **doc_data
                    })
                elif doc_data['tipo'] == 'frase':
                    sentences_content.append({
                        "id": doc.id,
                        **doc_data
                    })
            
            return {
                "collection_id": collection.id,
                "title": collection_data["title"],
                "topic": collection_data["topic"],
                "created_at": collection_data["created_at"],
                "words": words_content,
                "sentences": sentences_content,
                "is_existing": True
            }
        
            
        # Cria nova coleção para o usuário
        collections_ref = user_ref.collection('collections').document()
        
        collection_data = {
            "title": f"Coleção de {topic}",
            "created_at": datetime.now(),
            "topic": topic.lower().strip()
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
            Gere EXATAMENTE um JSON com até 5 frases expositivas e visuais, que seja fácil de entender a partir da visualização de uma imagem gerada com essa frase, usando estas palavras em português e inglês. Essa frase deve ser obrigatóriamente composta por no máximo 5 palavras, considerando artigos.
            Palavras PT: {', '.join(words_pt)}
            Palavras EN: {', '.join(words_en)}
            As frases devem ser simples, evite abstrações e descrição de cenários não visuais, e ajudar as crianças a imaginar o que está sendo descrito. Garanta que sempre tenha um verbo na frase diferente de é.
            EX: cachorro correndo, escrevendo com um lapis, pulando corda, passear com cachorro. 
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

@app.post("/check/user")
async def check_user_exists(request: UserCheckRequest):
    """
    Endpoint para verificar se um usuário existe baseado no email.
    Retorna true se o usuário existe, false caso contrário.
    """
    try:
        # Busca usuários onde o email corresponde
        users_ref = db.collection('users')
        query = users_ref.where('email', '==', request.email).limit(1)
        docs = query.get()
        
        # Se encontrou algum documento, o usuário existe
        exists = len(list(docs)) > 0
        
        return {
            "exists": exists,
            "email": request.email,
            "id": docs[0].id if exists else None
        }
        
    except Exception as e:
        logger.error(f"Erro ao verificar usuário: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao verificar usuário: {str(e)}"
        )

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
@app.get("/collection/{user_id}/{collection_id}")
async def get_collection_with_subcollections(user_id: str, collection_id: str):
    """
    Rota para obter uma coleção específica por ID, associada a um usuário, incluindo subcoleções formatadas.
    """
    try:
        # Referência ao documento da coleção específica
        user_ref = db.collection('users').document(user_id)
        collection_ref = user_ref.collection('collections').document(collection_id)
        collection_doc = collection_ref.get()

        if not collection_doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Coleção {collection_id} não encontrada para o usuário {user_id}"
            )

        # Dados do documento principal
        collection_data = collection_doc.to_dict()

        # Estrutura final para subcoleções organizadas
        words = []
        sentences = []

        # Buscar subcoleções do documento
        subcollections = collection_ref.collections()
        for subcollection in subcollections:
            subcollection_docs = subcollection.stream()

            # Classificar itens nas subcoleções
            for doc in subcollection_docs:
                doc_data = {"id": doc.id, **doc.to_dict()}
                if doc_data.get("tipo") == "palavra":
                    words.append(doc_data)
                elif doc_data.get("tipo") == "frase":
                    sentences.append(doc_data)

        # Retornar dados do documento principal com palavras e frases categorizadas
        return {
            "collection_id": collection_id,
            **collection_data,
            "words": words,
            "sentences": sentences,
        }

    except Exception as e:
        logger.error(f"Erro ao buscar coleção {collection_id} para o usuário {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/collections/user/{user_id}")
async def get_user_collections(user_id: str):
    """
    Rota para obter todas as coleções de um usuário.
    """
    try:
        # Acesse a subcoleção "collections" do usuário
        user_ref = db.collection('users').document(user_id)
        collections_ref = user_ref.collection('collections')
        collections = collections_ref.stream()

        # Extrai os dados de cada documento na coleção
        collections_data = []
        for collection in collections:
            collections_data.append({"collection_id": collection.id, **collection.to_dict()})

        return {"user_id": user_id, "collections": collections_data}

    except Exception as e:
        logger.error(f"Erro ao buscar coleções para o usuário {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}/roadmap-level")
async def get_user_roadmap_level(user_id: str):
    """
    Obtém o nível do roadmap de um usuário específico.
    """
    try:
        # Referência ao documento do usuário
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado"
            )
        
        user_data = user_doc.to_dict()
        roadmap_level = user_data.get('roadmap_level', 0)  # Retorna 0 se não existir
        
        return {
            "user_id": user_id,
            "roadmap_level": roadmap_level
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Erro ao buscar roadmap level do usuário: {e}")
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)