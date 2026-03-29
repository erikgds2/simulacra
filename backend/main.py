import logging
import os
import uuid
from contextlib import asynccontextmanager

from database import init_db
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("simulacra")

REQUIRED_ENV_VARS = ["ANTHROPIC_API_KEY"]

# Maximum request body size: 1 MB
_MAX_BODY_SIZE = 1 * 1024 * 1024  # 1 MB


def check_env() -> None:
    missing = [v for v in REQUIRED_ENV_VARS if not os.getenv(v, "").strip()]
    if missing:
        raise RuntimeError(f"Variáveis de ambiente ausentes: {', '.join(missing)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    env = os.getenv("ENVIRONMENT", "development")
    if env != "test":
        check_env()
    init_db()
    logger.info("Simulacra iniciado — banco inicializado")
    yield
    logger.info("Simulacra encerrado")


limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

_env = os.getenv("ENVIRONMENT", "development")
app = FastAPI(
    title="Simulacra API",
    version="1.2.0",
    description="Motor de simulação de comportamento coletivo para o Brasil. Simule propagação de desinformação, teste intervenções e receba relatórios analíticos em português.",
    lifespan=lifespan,
    docs_url="/docs" if _env != "production" else None,
    redoc_url="/redoc" if _env != "production" else None,
    openapi_url="/openapi.json" if _env != "production" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Fix 4: CORS hardening — fallback to known frontend, never wildcard
_origins_env = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()]
if not ALLOWED_ORIGINS:
    ALLOWED_ORIGINS = ["https://erikgds2.github.io", "http://localhost:5173", "http://localhost:5174"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


# Fix 9: Request body size limit middleware (1 MB)
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > _MAX_BODY_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": "Requisição muito grande. Limite: 1 MB."},
        )
    return await call_next(request)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path} — {request.client.host}")
    response = await call_next(request)
    logger.info(f"→ {response.status_code}")
    return response


# Fix 1: Complete security headers middleware
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'none'; frame-ancestors 'none'"
    )
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Robots-Tag"] = "noindex, nofollow"
    # Fix: Add request ID for traceability
    response.headers["X-Request-Id"] = str(uuid.uuid4())
    # Cache-Control: no-store on sensitive endpoints
    path = request.url.path
    if path.startswith("/report") or path.startswith("/alerts"):
        response.headers["Cache-Control"] = "no-store"
    return response


# Fix 3: Global exception handler — no stack traces in responses
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor."},
    )


# Fix 10: /health with rate limit
@app.get("/health", tags=["infra"])
@limiter.limit("60/minute")
async def health(request: Request):
    from database import DB_PATH
    from agents.cache import cache_stats
    env = os.getenv("ENVIRONMENT", "development")
    response = {
        "status": "ok",
        "app": "Simulacra",
        "version": "1.2.0",
        "environment": env,
        "cache": cache_stats(),
    }
    # Only expose filesystem info in non-production environments
    if env != "production":
        response["db_path"] = str(DB_PATH)
        response["db_exists"] = DB_PATH.exists()
    return response


from routers.simulation import router as simulation_router
from routers.seeds import router as seeds_router
from routers.reports import router as reports_router
from routers.alerts import router as alerts_router

app.include_router(simulation_router)
app.include_router(seeds_router)
app.include_router(reports_router)
app.include_router(alerts_router)
