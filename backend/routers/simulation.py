import asyncio
import json
import uuid
from typing import AsyncGenerator, Literal, Optional

import bleach
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address

from agents.simulation_engine import SimulationEngine

router = APIRouter(prefix="/simulation", tags=["simulation"])
limiter = Limiter(key_func=get_remote_address)

_simulations: dict = {}


class StartRequest(BaseModel):
    seed_text: str
    num_agents: int = 200
    intervention: Optional[Literal["fact_check", "removal", "counter_narrative", "label_warning"]] = None
    random_seed: int = 42

    @field_validator("seed_text")
    @classmethod
    def sanitize_seed_text(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("seed_text deve ter pelo menos 10 caracteres")
        if len(v) > 5000:
            raise ValueError("seed_text não pode ultrapassar 5000 caracteres")
        return bleach.clean(v, tags=[], strip=True)

    @field_validator("num_agents")
    @classmethod
    def validate_num_agents(cls, v: int) -> int:
        if v < 10:
            raise ValueError("num_agents mínimo é 10")
        if v > 1000:
            raise ValueError("num_agents máximo é 1000")
        return v

    @field_validator("random_seed")
    @classmethod
    def validate_random_seed(cls, v: int) -> int:
        if v < 0 or v > 999999:
            raise ValueError("random_seed deve estar entre 0 e 999999")
        return v


@router.post("/start")
@limiter.limit("10/minute")
async def start_simulation(request: Request, req: StartRequest):
    sim_id = str(uuid.uuid4())
    engine = SimulationEngine(
        num_agents=req.num_agents,
        intervention=req.intervention,
        random_seed=req.random_seed,
    )
    _simulations[sim_id] = {
        "engine": engine,
        "config": req.model_dump(),
        "ticks": [],
        "seed_text": req.seed_text,
    }
    return {"simulation_id": sim_id, "status": "ready"}


@router.get("/{sim_id}/stream")
@limiter.limit("20/minute")
async def stream_simulation(request: Request, sim_id: str):
    if sim_id not in _simulations:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    async def event_generator() -> AsyncGenerator[str, None]:
        sim = _simulations[sim_id]
        engine: SimulationEngine = sim["engine"]
        try:
            for tick_data in engine.run_ticks():
                sim["ticks"].append(tick_data)
                payload = json.dumps(tick_data)
                yield f"data: {payload}\n\n"
                await asyncio.sleep(0.15)
            yield 'data: {"done": true}\n\n'
        except Exception as e:
            yield f'data: {{"error": "{str(e)}"}}\n\n'

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{sim_id}/result")
async def get_result(sim_id: str):
    if sim_id not in _simulations:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")
    sim = _simulations[sim_id]
    ticks = sim["ticks"]
    if not ticks:
        raise HTTPException(status_code=400, detail="Simulação ainda não iniciada")
    peak = max(ticks, key=lambda t: t["I"])
    first = ticks[0]
    total_agents = first["S"] + first["E"] + first["I"] + first["R"]
    return {
        "simulation_id": sim_id,
        "peak_infected": peak["I"],
        "time_to_peak": peak["tick"],
        "total_reach": round((total_agents - ticks[-1]["S"]) / total_agents, 3),
        "total_ticks": len(ticks),
    }
