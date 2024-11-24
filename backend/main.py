from fastapi import FastAPI
import uvicorn
from generate_introductions import app as introductions_app
from generate_roadmap import app as roadmap_app
from generate_content import app as content_app  # Importa o app de generate_content
from generate_chatbot import app as chatbot_app  # Importa o app de generate_chatbot
from fastapi.middleware.cors import CORSMiddleware

# Cria o app principal
app = FastAPI()

# Configure CORS
# Inclui os roteadores de todos os módulos
app.include_router(chatbot_app.router, prefix="/chatbot")
app.include_router(introductions_app.router, prefix="/introductions")
app.include_router(roadmap_app.router, prefix="/roadmaps")
app.include_router(content_app.router, prefix="/content")  # Adiciona o roteador de generate_content

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
