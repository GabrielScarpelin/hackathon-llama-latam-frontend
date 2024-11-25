from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Literal
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title="Libras Teaching API")



load_dotenv()

# LLM Configuration
SAMBANOVA_API_KEY = os.environ.get('SAMBANOVA_API_KEY')
BASE_URL = "https://api.sambanova.ai/v1/"
MODEL = "Meta-Llama-3.1-70B-Instruct"

if not SAMBANOVA_API_KEY:
    logger.error("SAMBANOVA_API_KEY não está configurada!")
    raise ValueError("SAMBANOVA_API_KEY environment variable is not set")


class IntroductionRequest(BaseModel):
    tema: str
    fase: Literal["palavras", "frases", "jogos"]


class IntroductionResponse(BaseModel):
    introducao: str


def get_llm_response(prompt: str) -> str:
    """
    Get response from SambaNova LLM API with detailed error logging
    """
    headers = {
        "Authorization": f"Bearer {SAMBANOVA_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5,
        "max_tokens": 1000,
        "top_p": 0.9
    }

    try:
        logger.debug("Enviando requisição para API SambaNova...")
        response = requests.post(f"{BASE_URL}chat/completions", headers=headers, json=data)
        response.raise_for_status()
        response_json = response.json()
        return response_json["choices"][0]["message"]["content"]

    except requests.exceptions.RequestException as e:
        logger.error(f"Erro na requisição: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response Status: {e.response.status_code}")
            logger.error(f"Response Text: {e.response.text}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro na comunicação com API SambaNova: {str(e)}"
        )


def generate_introduction(tema: str, fase: str) -> str:
    """
    Generate an introduction using LLM based on the theme and phase.
    """
    prompts = {
        "palavras": f"""
        Você é Cris, um instrutor de Libras amigável e entusiasmado.
        Gere uma introdução curta (2-3 frases) para ensinar sobre: {tema}, 
        onde você vai ensinar palavras/sinais básicos relacionados a este tema.
        A introdução deve ser acolhedora e motivadora. Seu interlocutor é uma criança. Convide-o a aprender essas novas palavras
        """,
        "frases": f"""
        Você é Cris, um professor de Libras amigável e entusiasmado.
        Gere uma introdução curta (2-3 frases) para a parte da aula onde os alunos
        aprenderão a formar frases usando as palavras/sinais de {tema} que acabaram de aprender.
        A introdução deve ser encorajadora e mostrar progressão no aprendizado. Seu interlocutor é uma criança. Convide-o a aprender essas frases
        """,
        "jogos": f"""
        Você é Cris, um professor de Libras amigável e entusiasmado.
        Gere uma introdução curta (2-3 frases) para a parte da aula onde os alunos
        praticarão os sinais de {tema} através de um jogo da memória.
        A introdução deve ser divertida e empolgante. Seu interlocutor é uma criança. Convide-o para aprender jogando
        """
    }

    prompt = prompts.get(fase)
    if not prompt:
        raise HTTPException(status_code=400, detail="Fase não reconhecida")

    logger.info(f"Gerando introdução para tema: {tema}, fase: {fase}")
    return get_llm_response(prompt)


@app.post("/generate-introduction", response_model=IntroductionResponse)
async def create_introduction(request: IntroductionRequest):
    """
    Generate an introduction based on the theme and phase using LLM.
    """
    try:
        introducao = generate_introduction(request.tema, request.fase)
        return IntroductionResponse(introducao=introducao)
    except Exception as e:
        logger.error(f"Erro ao processar requisição: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    logger.info(f"API Key configurada: {SAMBANOVA_API_KEY[:5]}...")
    logger.info(f"Base URL: {BASE_URL}")
    logger.info(f"Modelo: {MODEL}")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
