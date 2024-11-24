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
class Interest(BaseModel):
    interest: str

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

# Funções de geração
def generate_student_roadmap(user_info: Dict[str, Any]):
    agent = roadmap_agent()
    task = Task(
        description=f"Desenvolver uma sequencia de tópicos de estudo infantis baseado nas áreas de interesse: {user_info}",
        expected_output=
        """
        Uma lista de tópicos de estudo personalizados, alinhados com as áreas de interesse do usuário.
        Os tópicos devem ser baseados nos interesses do usuário e devem ser organizados de forma lógica e progressiva.
        Os tópicos devem ser formados duas palavras.
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
    return result

def generate_parent_roadmap(user_info: Dict[str, Any]):
    agent = roadmap_agent()
    task = Task(
        description=f"Desenvolver uma sequencia de tópicos de estudo baseado nas áreas de interesse: {user_info}",
        expected_output=
        """
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
    return result

# Endpoints da API
@app.post("/api/student-roadmap")
async def api_student_roadmap(user_info: Interest):
    try:
        result = generate_student_roadmap(user_info.dict())
        return {"success": True, "roadmap": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/parent-roadmap")
async def api_parent_roadmap(user_info: Interest):
    try:
        result = generate_parent_roadmap(user_info.dict())
        return {"success": True, "roadmap": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
