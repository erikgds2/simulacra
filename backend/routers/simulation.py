import asyncio
import json
import uuid
from typing import AsyncGenerator, Literal, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents.simulation_engine import SimulationEngine

router = APIRouter(prefix="/simulation", tags=["simulation"])

_simulations: dict = {}


class StartRequest(BaseModel):
    seed_text: str
    num_agents: int = 200
    intervention: Optional[Literal["fact_check", "removal", "counter_narrative", "label_warning"]] = None
    random_seed: int = 42


@router.post("/start")
async def start_simulation(req: StartRequest):
    sim_id = str(uuid.uuid4())
    engine = SimulationEngine(
        num_agents=req.num_agents,
        intervention=req.intervention,
        random_seed=req.random_seed,
    )
    _simulations[sim_id] = {"engine": engine, "config": req.model_dump(), "ticks": []}
    return {"simulation_id": sim_id, "status": "ready"}


@router.get("/{sim_id}/stream")
async def stream_simulation(sim_id: str):
    if sim_id not in _simulations:
        return {"error": "simulation not found"}

    async def event_generator() -> AsyncGenerator[str, None]:
        sim = _simulations[sim_id]
        engine: SimulationEngine = sim["engine"]
        for tick_data in engine.run_ticks():
            sim["ticks"].append(tick_data)
            payload = json.dumps(tick_data)
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.15)
        yield 'data: {"done": true}\n\n'

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/{sim_id}/result")
async def get_result(sim_id: str):
    if sim_id not in _simulations:
        return {"error": "not found"}
    sim = _simulations[sim_id]
    ticks = sim["ticks"]
    if not ticks:
        return {"error": "simulation not started"}
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
