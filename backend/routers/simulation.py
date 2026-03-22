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
from database import (
    finish_simulation,
    get_simulation,
    get_simulation_ticks,
    list_simulations,
    save_simulation,
    save_tick,
)

router = APIRouter(prefix="/simulation", tags=["simulation"])
limiter = Limiter(key_func=get_remote_address)

_engines: dict = {}


class StartRequest(BaseModel):
    seed_text: str
    seed_id: Optional[str] = None
    num_agents: int = 200
    intervention: Optional[Literal["fact_check", "removal", "counter_narrative", "label_warning"]] = None
    random_seed: int = 42
    region: Optional[Literal["SP", "NE", "SUL", "CO", "N", "RJ"]] = None

    @field_validator("seed_text")
    @classmethod
    def sanitize_seed_text(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("seed_text deve ter pelo menos 10 caracteres")
        if len(v) > 5000:
            raise ValueError("seed_text nao pode ultrapassar 5000 caracteres")
        return bleach.clean(v, tags=[], strip=True)

    @field_validator("num_agents")
    @classmethod
    def validate_num_agents(cls, v: int) -> int:
        if v < 10:
            raise ValueError("num_agents minimo e 10")
        if v > 1000:
            raise ValueError("num_agents maximo e 1000")
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
        region=req.region,
    )
    _engines[sim_id] = engine
    save_simulation(sim_id, req.model_dump())
    return {"simulation_id": sim_id, "status": "ready"}


@router.get("/list")
async def list_all(limit: int = 20):
    return {"simulations": list_simulations(limit=limit)}


@router.get("/{sim_id}/stream")
@limiter.limit("20/minute")
async def stream_simulation(request: Request, sim_id: str):
    sim = get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulacao nao encontrada")

    engine = _engines.get(sim_id)
    if not engine:
        ticks = get_simulation_ticks(sim_id)
        if ticks:
            async def replay():
                for tick in ticks:
                    yield f"data: {json.dumps(tick)}\n\n"
                    await asyncio.sleep(0.05)
                yield 'data: {"done": true}\n\n'
            return StreamingResponse(
                replay(), media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
            )
        raise HTTPException(status_code=400, detail="Simulacao nao iniciada")

    async def event_generator() -> AsyncGenerator[str, None]:
        ticks_data = []
        try:
            for tick_data in engine.run_ticks():
                save_tick(sim_id, tick_data)
                ticks_data.append(tick_data)
                yield f"data: {json.dumps(tick_data)}\n\n"
                await asyncio.sleep(0.15)

            if ticks_data:
                peak = max(ticks_data, key=lambda t: t["I"])
                first = ticks_data[0]
                total = first["S"] + first["E"] + first["I"] + first["R"]
                finish_simulation(sim_id, {
                    "peak_infected": peak["I"],
                    "time_to_peak": peak["tick"],
                    "total_reach": round((total - ticks_data[-1]["S"]) / total, 3),
                    "total_ticks": len(ticks_data),
                })

            _engines.pop(sim_id, None)
            yield 'data: {"done": true}\n\n'
        except Exception as e:
            yield f'data: {{"error": "{str(e)}"}}\n\n'

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{sim_id}/result")
async def get_result(sim_id: str):
    sim = get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")
    if sim["status"] != "finished":
        raise HTTPException(status_code=400, detail="Simulação ainda não concluída")

    from agents.risk_scorer import calculate_risk_score, risk_label_description
    risk = calculate_risk_score(
        num_agents=sim["num_agents"],
        peak_infected=sim["peak_infected"] or 0,
        time_to_peak=sim["time_to_peak"] or 1,
        total_reach=sim["total_reach"] or 0.0,
        total_ticks=sim["total_ticks"] or 1,
        intervention=sim["intervention"],
    )
    risk["description"] = risk_label_description(risk["label"])

    return {**sim, "risk": risk}


@router.get("/{sim_id}/graph")
async def get_graph(sim_id: str):
    sim = get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulacao nao encontrada")
    ticks = get_simulation_ticks(sim_id)
    if not ticks:
        raise HTTPException(status_code=400, detail="Sem dados de ticks")
    return {
        "simulation_id": sim_id,
        "final_tick": ticks[-1],
        "ticks": ticks,
    }


class CompareRequest(BaseModel):
    seed_text: str
    num_agents: int = 200
    random_seed: int = 42
    region: Optional[Literal["SP", "NE", "SUL", "CO", "N", "RJ"]] = None

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
        if v > 500:
            raise ValueError("num_agents máximo é 500 no modo comparação")
        return v


@router.post("/compare")
@limiter.limit("5/minute")
async def compare_interventions(request: Request, req: CompareRequest):
    """
    Roda a mesma simulação com todas as intervenções em paralelo
    e retorna métricas comparativas + scores de risco.
    Ideal para dashboards de tomada de decisão.
    """
    from agents.risk_scorer import calculate_risk_score, risk_label_description

    interventions = [None, "fact_check", "removal", "counter_narrative", "label_warning"]
    labels = {
        None: "Sem intervenção",
        "fact_check": "Fact-check",
        "removal": "Remoção",
        "counter_narrative": "Contra-narrativa",
        "label_warning": "Aviso de rótulo",
    }

    results = []

    for intervention in interventions:
        engine = SimulationEngine(
            num_agents=req.num_agents,
            intervention=intervention,
            random_seed=req.random_seed,
            region=req.region,
        )
        ticks = list(engine.run_ticks())
        if not ticks:
            continue

        peak = max(ticks, key=lambda t: t["I"])
        first = ticks[0]
        total = first["S"] + first["E"] + first["I"] + first["R"]
        total_reach = round((total - ticks[-1]["S"]) / total, 3)

        risk = calculate_risk_score(
            num_agents=req.num_agents,
            peak_infected=peak["I"],
            time_to_peak=peak["tick"],
            total_reach=total_reach,
            total_ticks=len(ticks),
            intervention=intervention,
        )
        risk["description"] = risk_label_description(risk["label"])

        results.append({
            "intervention": intervention,
            "label": labels[intervention],
            "peak_infected": peak["I"],
            "peak_pct": round(peak["I"] / req.num_agents * 100, 1),
            "time_to_peak": peak["tick"],
            "total_reach_pct": round(total_reach * 100, 1),
            "total_ticks": len(ticks),
            "risk": risk,
            "ticks": ticks,
        })

    results.sort(key=lambda r: r["risk"]["score"])

    return {
        "seed_text": req.seed_text[:100] + ("..." if len(req.seed_text) > 100 else ""),
        "num_agents": req.num_agents,
        "random_seed": req.random_seed,
        "region": req.region,
        "best_intervention": results[0]["label"] if results else None,
        "worst_intervention": results[-1]["label"] if results else None,
        "results": results,
    }
