from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.base import BaseHTTPMiddleware
import jwt
from typing import List
import logging

logger = logging.getLogger(__name__)

class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: FastAPI,
        secret_key: str = "9c1185a5c5e9fc54612808977ee8f548b2258d31",
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
            "/check/user"
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