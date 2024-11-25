from fastapi import FastAPI, Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import os
import jwt
from dotenv import load_dotenv
from typing import List
import logging

logger = logging.getLogger(__name__)

load_dotenv()

class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: FastAPI,
        secret_key: str = os.environ.get("SECRET_KEY_JWT"),
        algorithm: str = "HS256",
        exclude_paths: List[str] = None
    ):
        super().__init__(app)
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.exclude_paths = exclude_paths or [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/users/register",
            "/check/user",
            "/api/parent-roadmap"
        ]

    async def dispatch(self, request: Request, call_next):
        # Verifica se o path atual está na lista de exclusões
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        try:
            # Extrai o token do header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                raise HTTPException(
                    status_code=401,
                    detail="No authorization token provided"
                )

            # Verifica se o header está no formato correto
            scheme, token = auth_header.split()
            if scheme.lower() != 'bearer':
                raise HTTPException(
                    status_code=401,
                    detail="Invalid authentication scheme"
                )

            try:
                # Decodifica e valida o token
                payload = jwt.decode(
                    token,
                    self.secret_key,
                    algorithms=[self.algorithm]
                )
                
                # Adiciona o payload do token ao request state para uso posterior
                request.state.user = payload
                
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=401,
                    detail="Token has expired"
                )
            except jwt.InvalidTokenError:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid token"
                )

            # Continua com a request se a autenticação foi bem sucedida
            response = await call_next(request)
            return response

        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error during authentication"}
            )
        
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
from generate_introductions import app as introductions_app
from generate_roadmap import app as roadmap_app
from generate_content import app as content_app
from generate_chatbot import app as chatbot_app
from fastapi.middleware.cors import CORSMiddleware

# Cria o app principal
app = FastAPI()

# Configuração do middleware de autenticação
app.add_middleware(
    AuthMiddleware,
    exclude_paths=[
        "/docs",
        "/redoc",
        "/openapi.json",
        "/content/users/register",
        "/content/check/user",
        "/roadmaps/api/parent-roadmap"
        # Adicione aqui outros caminhos que não precisam de autenticação
    ]
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclui os roteadores de todos os módulos
app.include_router(chatbot_app.router, prefix="/chatbot")
app.include_router(introductions_app.router, prefix="/introductions")
app.include_router(roadmap_app.router, prefix="/roadmaps")
app.include_router(content_app.router, prefix="/content")

# Helper para criar tokens JWT (pode ser útil em suas rotas de login)
def create_jwt_token(user_id: str) -> str:
    from datetime import datetime, timedelta
    import jwt
    
    payload = {
        'sub': user_id,
        'exp': datetime.utcnow() + timedelta(days=1),
        'iat': datetime.utcnow()
    }
    
    return jwt.encode(
        payload,
        os.environ.get("SECRET_KEY_JWT"),
        algorithm="HS256"
    )

# Exemplo de endpoint protegido que pode acessar os dados do usuário
@app.get("/protected-example")
async def protected_example(request: Request):
    # Dados do usuário estão disponíveis em request.state.user
    return {"user_data": request.state.user}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)