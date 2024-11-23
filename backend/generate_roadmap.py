from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Dict, Any
import os
from crewai import Agent, Task, Crew, LLM

# Carregar variáveis de ambiente
load_dotenv()

# Inicializar FastAPI
app = FastAPI()



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
class UserInfo(BaseModel):
    name: str
    experience_level: str
    available_time: str

# Definir o agente
def roadmap_agent():
    return Agent(
        role="Analista de estratégia de estudos",
        goal="Desenvolver um plano/guia de estudos para o aprendizado de Libras, ele deve ser otimizado e personalizado de acordo com o perfil do usuário.",
        backstory="Especialista em planejamento educacional com vasta experiência em personalização de currículos.",
        llm=llm,
        verbose=True,
    )

# Funções de geração
def generate_student_roadmap(user_info: Dict[str, Any]):
    agent = roadmap_agent()
    task = Task(
        description=f"Desenvolver um plano de estudos alinhado com o perfil do usuário, bem dividido entre fases e etapas de marcado por tempo. Informações sobre o usuário: {user_info}",
        expected_output="Um cronograma segmentado em marcos e etapas a serem concluídas pelo usuário, mantendo seu aprendizado dinâmico e otimizado.",
        agent=agent,
    )
    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    result = crew.kickoff()
    return result

def generate_parent_roadmap(user_info: Dict[str, Any]):
    agent = roadmap_agent()
    task = Task(
        description=f"Desenvolver um plano de estudos alinhado com o perfil de algum relativo próximo do usuário, uma vez que ele está acessando a plataforma para mediar o aprendizado do filho. Informações sobre o relativo do usuário: {user_info}",
        expected_output="Um cronograma de estudos personalizado, alinhado com o perfil do usuário. Deve se iniciar por conteúdos de mais facíl aprendizado, respeitando o tempo disponível do usuário, e sua curva natural de aprendizado.",
        agent=agent,
    )
    crew = Crew(agents=[agent], tasks=[task], verbose=True)
    result = crew.kickoff()
    return result

# Endpoints da API
@app.post("/api/student-roadmap")
async def api_student_roadmap(user_info: UserInfo):
    try:
        result = generate_student_roadmap(user_info.dict())
        return {"success": True, "roadmap": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/parent-roadmap")
async def api_parent_roadmap(user_info: UserInfo):
    try:
        result = generate_parent_roadmap(user_info.dict())
        return {"success": True, "roadmap": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
