import json
from crewai import Agent, Task, Crew, LLM
import os

# Configuração do modelo LLM
llm = LLM(
    model="sambanova/Meta-Llama-3.1-8B-Instruct",
    base_url="https://api.sambanova.ai/v1/",
    api_key=os.environ.get('SAMBANOVA_API_KEY'),
    temperature=0.5,
    max_tokens=1000,
    top_p=0.9
)

# Configura o agente que irá gerar a introdução do Luisinho
def create_luisinho_agent():
    return Agent(
        role="Luisinho, o professor amigável",
        goal="Gerar introduções curtas e educativas em três partes",
        backstory="Luisinho é um professor amigável que guia crianças no aprendizado usando palavras, frases e jogos educativos.",
        llm=llm,
        verbose=True
    )

# Função principal para gerar as introduções
def generate_luisinho_intros_json(topic):
    agent = create_luisinho_agent()

    # Tarefa para gerar as introduções
    task = Task(
        description=f"""
        Você é o Luisinho, um professor amigável. Crie três introduções educativas baseadas no tema "{topic}". 

        1. Primeira introdução: Apresente o tema e diga que vamos aprender palavras.
        2. Segunda introdução: Diga que vamos formar frases com as palavras.
        3. Terceira introdução: Explique que vamos jogar um jogo da memória.

        Escreva tudo no seguinte formato JSON:
        {{
            "introducao_palavras": "Texto curto para introduzir as palavras",
            "introducao_frase": "Texto curto para introduzir as frases",
            "introducao_jogo": "Texto curto para introduzir o jogo da memória"
        }}
        """,
        expected_output="JSON com as introduções.",
        agent=agent
    )

    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True
    )

    # Executa a tarefa
    result = crew.kickoff()

    # Retorna as introduções geradas como JSON
    try:
        result_json = json.loads(str(result))  # Garante que o resultado seja interpretado como JSON
        return result_json
    except json.JSONDecodeError:
        print("Erro ao interpretar o resultado como JSON. Resultado bruto:", result)
        return None

if __name__ == "__main__":
    tema = "Cômodos da Casa"  # Alterar o tema conforme necessário

    # Gera as introduções do Luisinho no formato JSON
    intros_json = generate_luisinho_intros_json(tema)

    # Exibe o resultado gerado
    print(json.dumps(intros_json, ensure_ascii=False, indent=2))
