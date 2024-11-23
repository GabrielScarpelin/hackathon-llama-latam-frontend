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

def get_data(prompt):
    # Dados da requisição
    data = {
        "provider": "fal-ai",
        "model": "flux-pro/v1.1-ultra-raw",
        "prompt": prompt,
        "size": "256x256"
    }
    return data

def generate_image(prompt):
    try:
        response = requests.post(BASE_URL, headers=headers, json=get_data(prompt))
        response.raise_for_status()  # Lança exceção para códigos de erro HTTP
        
        # Valida a resposta da API
        response_data = response.json()
        if 'images' in response_data and len(response_data['images']) > 0:
            return response_data['images'][0]['url']  # Obtém a URL da primeira imagem
        else:
            print("Erro: Resposta inesperada da API:", response_data)
            return None
    except requests.exceptions.RequestException as e:
        print(f"Erro na requisição: {e}")
        return None


if __name__ == "__main__":
    if not API_TOKEN:
        print("Erro: API_TOKEN não encontrado nas variáveis de ambiente")
    else:
        prompt = input("Digite o prompt para a geração da imagem: ")  # Solicita o prompt ao usuário
        result = generate_image(prompt)
        if result:
            print("Imagem gerada com sucesso! Acesse a URL abaixo para visualizá-la:")
            print(result)
        else:
            print("Falha ao gerar a imagem.")
