import requests
import os
from dotenv import load_dotenv  # Para gerenciar variáveis de ambiente

# Carrega variáveis de ambiente
load_dotenv()

# Configurações
API_TOKEN = os.getenv('API_TOKEN')  # Armazene sua chave em um arquivo .env
BASE_URL = "https://api.aimlapi.com/images/generations"

# Cabeçalhos
headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

# Dados da requisição
data = {
    "provider": "fal-ai",
    "model": "flux-pro/v1.1-ultra-raw",
    "prompt": "uma praia",
    "size": "256x256"
}

def generate_image():
    try:
        response = requests.post(BASE_URL, headers=headers, json=data)
        response.raise_for_status()  # Lança exceção para códigos de erro HTTP
        
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro na requisição: {e}")
        return None

if __name__ == "__main__":
    if not API_TOKEN:
        print("Erro: API_TOKEN não encontrado nas variáveis de ambiente")
    else:
        result = generate_image()
        if result:
            print("Imagem gerada com sucesso:", result)