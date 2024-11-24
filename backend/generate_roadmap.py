import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from generate_content import db
from typing import Dict, Any
from datetime import datetime
import os
from crewai import Agent, Task, Crew, LLM
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("generate_roadmap")

# Carregar variáveis de ambiente
load_dotenv()

# Inicializar FastAPI
app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar o LLM
llm = LLM(
    model="sambanova/Meta-Llama-3.1-8B-Instruct",
    base_url="https://api.sambanova.ai/v1/",
    api_key=os.environ.get("SAMBANOVA_API_KEY"),
    temperature=0.5,
    max_tokens=1000,
    top_p=0.9,
)

# Modelo de entrada para validação com Pydantic
class Interest(BaseModel):
    interest: str
    user_id: str

# Definir o agente
def roadmap_agent():
    return Agent(
        role="Criador de Tópicos de Estudos Infantis", 
        goal="""
        Criar tópicos de estudos personalizados para crianças baseado em áreas de interesse do usuário. No padrão:

        {
            "topics": [
                "Tópico 1",
                "Tópico 2",
                "Tópico 3",
                "Tópico 4",
                "Tópico 5",
                "Tópico 6"
            ]
        }
        
        """,
        backstory="Especialista em planejamento educacional infantil com vasta experiência em personalização de currículos.",
        llm=llm,
        verbose=True,
    )

async def save_roadmap_to_firestore(user_id: str, roadmap_type: str, roadmap_data: Dict[str, Any]):
    """
    Salva o roadmap gerado no Firestore para o usuário específico.
    """
    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        logger.info(f"Verificando existência do usuário: {user_id}")
        if not user_doc.exists:
            logger.error(f"Usuário não encontrado: {user_id}")
            raise HTTPException(status_code=404, detail=f"Usuário não encontrado: {user_id}")

        # Cria ou acessa a coleção de roadmaps
        roadmaps_ref = user_ref.collection("roadmaps").document()
        roadmap_data["roadmap_type"] = roadmap_type
        roadmap_data["created_at"] = datetime.now().isoformat()
        logger.info(f"Salvando dados: {roadmap_data}")

        roadmaps_ref.set(roadmap_data)

        logger.info(f"Roadmap salvo com sucesso para o usuário {user_id} com ID {roadmaps_ref.id}")
        return {"roadmap_id": roadmaps_ref.id, **roadmap_data}

    except Exception as e:
        logger.exception("Erro ao salvar roadmap no Firestore")
        raise HTTPException(status_code=500, detail=f"Erro ao salvar o roadmap no Firestore: {str(e)}")

def extract_task_output_as_json(crew_output: Any) -> Dict[str, Any]:
    """
    Extrai o output bruto do primeiro task em um CrewOutput e o converte para JSON.
    """
    # Converte o resultado para um dicionário
    try:
        result_dict = crew_output.to_dict()
    except AttributeError as e:
        raise ValueError(f"Erro ao converter CrewOutput para dicionário: {str(e)}")

    # Log do resultado completo para depuração
    logger.info(f"Resultado do CrewOutput: {json.dumps(result_dict, indent=2)}")

    # Verifica se 'tasks_output' está presente e contém dados
    if 'tasks_output' not in result_dict or not result_dict['tasks_output']:
        raise ValueError(f"A chave 'tasks_output' está ausente ou vazia. Resultado: {json.dumps(result_dict, indent=2)}")

    # Extrai o primeiro task
    task_output = result_dict['tasks_output'][0]

    # Verifica se 'raw' está presente no task
    if 'raw' not in task_output or not task_output['raw']:
        raise ValueError(f"A chave 'raw' está ausente ou vazia no primeiro task. Task: {json.dumps(task_output, indent=2)}")

    # Tenta parsear o conteúdo 'raw' como JSON
    try:
        result_json = json.loads(task_output['raw'])
    except json.JSONDecodeError:
        raise ValueError("O conteúdo 'raw' não pôde ser convertido para JSON.")

    return result_json

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

def generate_student_roadmap(user_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Gera uma sequência de tópicos de estudo infantis baseada nas áreas de interesse do usuário.
    Retorna um dicionário JSON válido.
"""
    agent = roadmap_agent()
    task = Task(
        description=f"Desenvolver uma sequência de tópicos de estudo infantis baseada nas áreas de interesse: {user_info}",
        expected_output="""APENAS lista de tópicos de estudo personalizados, alinhados com as áreas de interesse do usuário.
        Os tópicos devem ser baseados nos interesses do usuário e devem ser organizados de forma lógica e progressiva.
        Os tópicos devem ser formados por duas palavras.
        Seguir o formato:
        {
            "topics": [
                "Tópico 1",
                "Tópico 2",
                "Tópico 3",
                "Tópico 4",
                "Tópico 5",
                "Tópico 6"
            ]
        }
        """,
        agent=agent,
    )
    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    
    # Executa o Crew e coleta o resultado
    result = crew.kickoff()
    
    result_json = str(result)
    logger.info(f"Resultado do Crew: {extract_json(result_json)}")

    return extract_json(result_json)
        
def generate_parent_roadmap(user_info: Dict[str, Any]) -> Dict[str, Any]:
    agent = roadmap_agent()
    task = Task(
        description=f"Desenvolver uma sequência de tópicos de estudo baseada nas áreas de interesse: {user_info}",
        expected_output="""
        Uma lista de tópicos de estudo personalizados, alinhados com as áreas de interesse do relativo do usuário.
        Os tópicos devem ser baseados nos interesses do relativo e devem ser organizados de forma lógica e progressiva.
        Os tópicos devem ser formados por no máximo 2 palavras.
        Seguir o formato:

        {
            "topics": [
                "Tópico 1",
                "Tópico 2",
                "Tópico 3",
                "Tópico 4",
                "Tópico 5",
                "Tópico 6"
            ]
        }
        """,
        agent=agent,
    )
    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    result = crew.kickoff()

    result_json = str(result)
    logger.info(f"Resultado do Crew: {extract_json(result_json)}")

    return extract_json(result_json)

@app.post("/api/student-roadmap")
async def api_student_roadmap(user_info: Interest):
    try:
        roadmap_data = generate_student_roadmap(user_info.model_dump())  # Substituído por model_dump()
        saved_data = await save_roadmap_to_firestore(user_info.user_id, "student", roadmap_data)
        return {"success": True, "roadmap": saved_data}
        # return {"success": True, "roadmap": roadmap_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/parent-roadmap")
async def api_parent_roadmap(user_info: Interest):
    try:
        roadmap_data = generate_parent_roadmap(user_info.model_dump())  # Substituído por model_dump()
        saved_data = await save_roadmap_to_firestore(user_info.user_id, "parent", roadmap_data)
        return {"success": True, "roadmap": saved_data}
        # return {"success": True, "roadmap": roadmap_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
   
@app.get("/api/roadmaps/{user_id}")
async def get_roadmaps(user_id: str):
    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail=f"Usuário não encontrado: {user_id}")

        roadmaps_ref = user_ref.collection("roadmaps")
        roadmaps = roadmaps_ref.stream()
        
        # Extrai apenas os tópicos de cada roadmap
        topics = []
        for doc in roadmaps:
            roadmap = doc.to_dict()
            topics.extend(roadmap.get("topics", []))  # Adiciona os tópicos ao array

        return topics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    
    ##API para apagar roadmaps salvos
@app.delete("/api/roadmaps/{user_id}")
async def delete_roadmaps(user_id: str):
    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail=f"Usuário não encontrado: {user_id}")

        roadmaps_ref = user_ref.collection("roadmaps")
        roadmaps = roadmaps_ref.stream()
        for doc in roadmaps:
            doc.reference.delete()

        return {"success": True, "message": "Roadmaps apagados com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
