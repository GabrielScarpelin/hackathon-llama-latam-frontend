import os
from langchain_openai import ChatOpenAI

api_key = os.environ.get("SAMBANOVA_API_KEY")

llm = ChatOpenAI(
    base_url="https://api.sambanova.ai/v1/",  
    api_key=api_key,
    model="Meta-Llama-3.1-70B-Instruct",
)

response = llm.invoke('Quem é voce?')
print(response.content)