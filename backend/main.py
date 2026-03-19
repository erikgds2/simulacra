import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("desinfolab")

REQUIRED_ENV_VARS = ["ANTHROPIC_API_KEY"]


def check_env() -> None:
    missing = [v for v in REQUIRED_ENV_VARS if not os.getenv(v, "").strip()]
    if missing:
        raise RuntimeError(f"Variáveis de ambiente ausentes: {', '.join(missing)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    check_env()
    logger.info("DesinfoLab iniciado — variáveis de ambiente OK")
    yield
    logger.info("DesinfoLab encerrado")


limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(
    title="DesinfoLab API",
    version="0.3.0",
    description="Simulador de propagação de desinformação no Brasil",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path} — {request.client.host}")
    response = await call_next(request)
    logger.info(f"→ {response.status_code}")
    return response


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.get("/health", tags=["infra"])
async def health():
    return {
        "status": "ok",
        "app": "DesinfoLab",
        "version": "0.3.0",
    }


from routers.simulation import router as simulation_router
from routers.seeds import router as seeds_router

app.include_router(simulation_router)
app.include_router(seeds_router)
