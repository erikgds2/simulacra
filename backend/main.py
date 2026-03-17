import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("desinfolab")

app = FastAPI(
    title="DesinfoLab API",
    description="Motor de simulacao de propagacao de desinformacao no Brasil",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# from routers import simulation, report
# app.include_router(simulation.router, prefix="/simulate", tags=["Simulacao"])
# app.include_router(report.router, prefix="/report", tags=["Relatorio"])


@app.on_event("startup")
async def startup():
    logger.info("DesinfoLab API v%s iniciada", app.version)


@app.get("/health", tags=["Status"])
async def health():
    return {"status": "ok", "app": "DesinfoLab", "version": app.version}
