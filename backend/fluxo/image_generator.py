import aiohttp
import asyncio
import sqlite3
from dotenv import load_dotenv
import os
from typing import Dict, List, Tuple, Optional
import logging
from contextlib import asynccontextmanager
from aiosqlite import connect as aio_connect
from concurrent.futures import ThreadPoolExecutor

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()
API_TOKEN = os.getenv('API_TOKEN')
BASE_URL = "https://api.aimlapi.com/images/generations"

# Configurações
MAX_CONCURRENT_REQUESTS = 5  # Limite de requisições concorrentes
BATCH_SIZE = 10  # Tamanho do lote para inserções no banco
REQUEST_TIMEOUT = 30  # Timeout em segundos

class ImageGenerator:
    def __init__(self, db_path: str = "imagens.db"):
        self.db_path = db_path
        self.headers = {
            "Authorization": f"Bearer {API_TOKEN}",
            "Content-Type": "application/json"
        }
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

    @asynccontextmanager
    async def get_db_connection(self):
        """Gerenciador de contexto assíncrono para conexão com o banco"""
        db = await aio_connect(self.db_path)
        try:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS imagens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tipo TEXT,
                    texto TEXT,
                    url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.commit()
            yield db
        finally:
            await db.close()

    async def generate_single_image(
        self, 
        session: aiohttp.ClientSession, 
        prompt: str
    ) -> Optional[str]:
        """Gera uma única imagem de forma assíncrona"""
        async with self.semaphore:  # Limita requisições concorrentes
            data = {
                "provider": "fal-ai",
                "model": "flux-pro/v1.1-ultra-raw",
                "prompt": prompt,
                "size": "256x256"
            }

            try:
                async with session.post(
                    BASE_URL, 
                    headers=self.headers, 
                    json=data, 
                    timeout=REQUEST_TIMEOUT
                ) as response:
                    if response.status == 429:  # Rate limit
                        await asyncio.sleep(1)  # Espera 1 segundo
                        return await self.generate_single_image(session, prompt)
                    
                    response.raise_for_status()
                    result = await response.json()

                    if "images" in result and result["images"]:
                        return result["images"][0].get("url")
                    
                    logger.warning(f"Nenhuma URL encontrada para '{prompt}'")
                    return None

            except Exception as e:
                logger.error(f"Erro ao gerar imagem para '{prompt}': {e}")
                return None

    async def save_batch_to_db(
        self, 
        db, 
        batch: List[Tuple[str, str, str]]
    ):
        """Salva um lote de dados no banco de forma assíncrona"""
        try:
            await db.executemany(
                "INSERT INTO imagens (tipo, texto, url) VALUES (?, ?, ?)",
                batch
            )
            await db.commit()
        except Exception as e:
            logger.error(f"Erro ao salvar lote no banco: {e}")
            raise

    async def process_items(
        self, 
        session: aiohttp.ClientSession,
        items: List[str], 
        tipo: str
    ) -> List[Tuple[str, str]]:
        """Processa uma lista de items (palavras ou frases)"""
        tasks = [
            self.generate_single_image(session, item) 
            for item in items
        ]
        urls = await asyncio.gather(*tasks)
        return [(item, url) for item, url in zip(items, urls) if url]

    async def generate_images(self, data: Dict[str, List[str]]):
        """Função principal para gerar imagens de forma assíncrona"""
        async with (
            aiohttp.ClientSession() as session,
            self.get_db_connection() as db
        ):
            # Processa palavras e frases em paralelo
            palavras_task = self.process_items(session, data["palavras"], "palavra")
            frases_task = self.process_items(session, data["frases"], "frase")
            
            palavras_results, frases_results = await asyncio.gather(
                palavras_task, 
                frases_task
            )

            # Prepara dados para inserção em lotes
            all_data = (
                [("palavra", p[0], p[1]) for p in palavras_results] +
                [("frase", f[0], f[1]) for f in frases_results]
            )

            # Insere em lotes
            for i in range(0, len(all_data), BATCH_SIZE):
                batch = all_data[i:i + BATCH_SIZE]
                await self.save_batch_to_db(db, batch)

            logger.info(
                f"Processamento concluído: {len(palavras_results)} palavras e "
                f"{len(frases_results)} frases geradas"
            )

def main():
    # Dados de exemplo
    data = {
        "palavras": ["gato", "cachorro", "pássaro"],
        "frases": ["um gato dormindo", "cachorro brincando no parque"]
    }
    
    # Executa o gerador de imagens
    generator = ImageGenerator()
    asyncio.run(generator.generate_images(data))

if __name__ == "__main__":
    main()