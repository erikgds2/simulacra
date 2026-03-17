from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="MiroFish-BR API",
    description="Motor de simulacao de desinformacao no Brasil baseado em swarm intelligence",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# from routers import simulation, report
# app.include_router(simulation.router, prefix="/simulate", tags=["simulation"])
# app.include_router(report.router, prefix="/report", tags=["report"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
