from crewai import Agent, Task, Crew, LLM
import os
from dotenv import load_dotenv

load_dotenv()  # Carrega as variáveis de ambiente do arquivo .env

# Configure the LLM
llm = LLM(
    model="sambanova/Meta-Llama-3.1-8B-Instruct",
    base_url="https://api.sambanova.ai/v1/",
    api_key=os.environ.get('SAMBANOVA_API_KEY'),
    temperature=0.5,
    max_tokens=1000,
    top_p=0.9
)

# Define the agent
def roadmap_agent():
    return Agent(
        role="Analista de estratégia de estudos",
        goal="Desenvolver um plano/guia de estudos para o aprendizado de Libras, ele deve ser otimizado e personalizado de acordo com o perfil do usuário.",
        backstory="Especialista em planejamento educacional com vasta experiência em personalização de currículos.",
        llm=llm,
        verbose=True
    )

# Function to generate a study roadmap
def generate_student_roadmap(user_info):
    agent = roadmap_agent()

    task = Task(
        description=f"Desenvolver um plano de estudos alinhado com o perfil do usuário, bem dividido entre fases e etapas de marcado por tempo. Informações sobre o usuário: {user_info}",
        expected_output="Um cronograma segmentado em marcos e etapas a serem concluídas pelo usuário, mantendo seu aprendizado dinâmico e otimizado.",
        agent=agent
    )

    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True
    )

    # Execute the tasks
    result = crew.kickoff()

    return result

# Function to generate a study roadmap
def generate_parent_roadmap(user_info):
    agent = roadmap_agent()

    task = Task(
        description=f"Desenvolver um plano de estudos alinhado com o perfil de algum relativo próximo do usuário, uma vez que ele está acessando a plataforma para mediar o aprendizado do filho. Informações sobre o relativo do usuário: {user_info}",
        expected_output="Um cronograma de estudos personalizado, alinhado com o perfil do usuário. Deve se iniciar por conteúdos de mais facíl aprendizado, respeitando o tempo disponível do usuário, e sua curva natural de aprendizado.",
        agent=agent
    )

    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True
    )

    # Execute the tasks
    result = crew.kickoff()

    return result

# Example user information
user_info = {
    "name": "John Doe",
    "experience_level": "beginner",
    "available_time": "2 hours per day"
}

# Generate the roadmap
result = generate_student_roadmap(user_info)

# Display the result
print("Study Roadmap Generated:")
print(result)
