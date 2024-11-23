import os
import json
import asyncio
from crewai import Agent, Task, Crew, LLM
from image_generator import ImageGenerator  # Renomeamos o arquivo anterior para image_generator.py
# Configuração do modelo LLM
llm = LLM(
    model="sambanova/Meta-Llama-3.1-8B-Instruct",
    base_url="https://api.sambanova.ai/v1/",
    api_key=os.environ.get('SAMBANOVA_API_KEY'),
    temperature=0.5,
    max_tokens=1000,
    top_p=0.9
)

def create_agents():
    word_list_agent = Agent(
        role="Gerador de Lista de Palavras",
        goal="Gerar uma lista de palavras relacionadas a um tema",
        backstory="Especialista que gera listas de palavras relacionadas a um tema específico",
        llm=llm,
        verbose=True
    )

    sentence_agent = Agent(
        role="Gerador de Frases",
        goal="Criar frases expositivas com elementos visuais usando as palavras fornecidas",
        backstory="Especialista em criar frases descritivas e visuais para ajudar no aprendizado de crianças",
        llm=llm,
        verbose=True
    )

    return word_list_agent, sentence_agent

def extract_json(text):
    try:
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            json_str = text[start_idx:end_idx + 1]
            return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON: {e}")
    return None

def format_results(word_list_results, sentence_results):
    word_list_json = extract_json(str(word_list_results))
    sentences_json = extract_json(str(sentence_results))
    
    result = {
        "palavras": word_list_json.get("palavras", []) if word_list_json else [],
        "frases": sentences_json.get("frases", [])[:5] if sentences_json else []
    }
    
    return result

async def generate_content_and_images(topic):
    """Função principal que gera conteúdo e imagens de forma assíncrona"""
    word_list_agent, sentence_agent = create_agents()

    # Task para lista de palavras
    word_list_task = Task(
        description=f"""
        Gere EXATAMENTE um JSON com uma lista de até 5 palavras relacionadas ao tema: {topic}
        Use este formato:

        {{
            "palavras": ["palavra1", "palavra2", "palavra3"]
        }}

        IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.
        """,
        expected_output="JSON com lista de palavras",
        agent=word_list_agent
    )

    crew_words = Crew(
        agents=[word_list_agent],
        tasks=[word_list_task],
        verbose=True
    )
    word_list_result = crew_words.kickoff()

    word_list_json = extract_json(str(word_list_result))
    words = word_list_json.get("palavras", [])[:5] if word_list_json else []

    if not words:
        raise ValueError("Nenhuma lista de palavras foi gerada.")

    # Task para frases
    sentence_task = Task(
        description=f"""
        Gere EXATAMENTE um JSON com até 5 frases expositivas e visuais usando estas palavras: {', '.join(words)}.
        As frases devem ser simples e ajudar as crianças a imaginar o que está sendo descrito. AS FRASES DEVEM TER NO MAXIMO 3 PALAVRAS.
        Ex: geladeira vermelha, cachorro correndo
        Use este formato: 

        {{
            "frases": [
                "Frase exemplo com palavra1",
                "Frase exemplo com palavra2",
                "Frase exemplo com palavra3"
            ]
        }}

        IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.
        """,
        expected_output="JSON com frases descritivas",
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
    
    # Gera as imagens de forma assíncrona
    print("Iniciando geração de imagens...")
    generator = ImageGenerator()
    await generator.generate_images(generated_data)
    
    return generated_data

async def main():
    topic = "Animais"  # Alterar o tema conforme necessário
    try:
        generated_data = await generate_content_and_images(topic)
        print("Processo completo!")
        print("Dados gerados:", generated_data)
    except Exception as e:
        print(f"Erro durante o processo: {e}")

if __name__ == "__main__":
    asyncio.run(main())