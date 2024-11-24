from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import os
import logging
import requests
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Configuração de Logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente do .env
load_dotenv()

# Configuração da API
SAMBANOVA_API_KEY = os.getenv("SAMBANOVA_API_KEY")
BASE_URL = "https://api.sambanova.ai/v1/"
MODEL = "Meta-Llama-3.1-70B-Instruct"

if not SAMBANOVA_API_KEY:
    logger.error("SAMBANOVA_API_KEY não está configurada!")
    raise ValueError("SAMBANOVA_API_KEY environment variable is not set")

# Configuração do FastAPI
app = FastAPI(title="Chatbot API - Ensino de Libras")

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Classe para estrutura de mensagens
class ChatMessage(BaseModel):
    content: str  # Conteúdo da mensagem


# Classe para requisição
class ChatRequest(BaseModel):
    messages: List[ChatMessage]  # Histórico de mensagens


# Classe para resposta
class ChatResponse(BaseModel):
    response: str  # Resposta do chatbot


def get_llm_response(history: List[dict], temperature=0.5, max_tokens=200, top_p=0.9):
    """
    Envia uma requisição para a API SambaNova com o histórico e retorna a resposta.
    """
    headers = {
        "Authorization": f"Bearer {SAMBANOVA_API_KEY}",
        "Content-Type": "application/json",
    }

    data = {
        "model": MODEL,
        "messages": history,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": top_p,
    }

    try:
        logger.debug("Enviando requisição para API SambaNova...")
        response = requests.post(f"{BASE_URL}chat/completions", headers=headers, json=data)
        response.raise_for_status()
        response_json = response.json()
        return response_json["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        logger.error(f"Erro na requisição: {str(e)}")
        if hasattr(e, "response") and e.response is not None:
            logger.error(f"Response Status: {e.response.status_code}")
            logger.error(f"Response Text: {e.response.text}")
        raise HTTPException(status_code=500, detail=f"Erro na comunicação com API SambaNova: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Endpoint para processar mensagens do chatbot.
    """
    try:
        # Adicionar o pre_prompt ao início do histórico
        pre_prompt = {
            "role": "user",
            "content": """
            Você é Cris, um assistente virtual de Libras. 
            Em nenhum momento você deve fazer a descrição dos sinais de mão. Apenas escreva as palavras.
            Lembre-se de que sua função é ensinar Libras, você deve ser direto e curto. 
            Todas as suas respostas devem ser focadas no ensino de Libras.
            """
        }

        # Construir o histórico com o pre_prompt
        history = [pre_prompt] + [{"role": "user", "content": msg.content} for msg in request.messages]

        # Obter resposta do modelo
        response = get_llm_response(history)
        return ChatResponse(response=response)
    except Exception as e:
        logger.error(f"Erro ao processar requisição: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
