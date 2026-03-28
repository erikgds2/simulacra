import asyncio
import functools
import json
import uuid
from typing import AsyncGenerator, Literal, Optional

import bleach
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address

from agents.simulation_engine import SimulationEngine
from database import (
    count_simulations,
    finish_simulation,
    get_simulation,
    get_simulation_ticks,
    list_simulations,
    save_simulation,
    save_tick,
)

router = APIRouter(prefix="/simulation", tags=["simulation"])
limiter = Limiter(key_func=get_remote_address)

import re as _re
_UUID_RE = _re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)

def _validate_sim_id(sim_id: str) -> None:
    """Rejeita IDs que não são UUIDs válidos antes de acessar o banco."""
    if not _UUID_RE.match(sim_id.lower()):
        raise HTTPException(status_code=400, detail="ID de simulação inválido.")

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
async def list_all(limit: int = 20, offset: int = 0):
    from agents.cache import cache_get, cache_set
    cache_key = f"sim_list:{limit}:{offset}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached
    sims = list_simulations(limit=limit, offset=offset)
    total = count_simulations()
    result = {"simulations": sims, "total": total, "limit": limit, "offset": offset}
    cache_set(cache_key, result, ttl=15)
    from fastapi.responses import JSONResponse
    response = JSONResponse(content=result)
    response.headers["Cache-Control"] = "public, max-age=15"
    return response


@router.get("/{sim_id}/stream")
@limiter.limit("20/minute")
async def stream_simulation(request: Request, sim_id: str):
    _validate_sim_id(sim_id)
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

            # Dispara alerta se score ultrapassa threshold configurado
            try:
                from agents.alert_manager import send_alert_email
                from agents.risk_scorer import calculate_risk_score
                _total_raw = first["S"] + first["E"] + first["I"] + first["R"]
                _peak = max(ticks_data, key=lambda t: t["I"])
                _reach = round(((_total_raw - ticks_data[-1]["S"]) / _total_raw), 3)
                _risk = calculate_risk_score(
                    num_agents=len(engine.graph.nodes) if hasattr(engine, 'graph') else 200,
                    peak_infected=_peak["I"],
                    time_to_peak=_peak["tick"],
                    total_reach=_reach,
                    total_ticks=len(ticks_data),
                    intervention=engine.intervention if hasattr(engine, 'intervention') else None,
                )
                _sim_meta = get_simulation(sim_id)
                _seed_text = _sim_meta.get("seed_text", "") if _sim_meta else ""
                import asyncio as _asyncio
                loop = _asyncio.get_event_loop()
                loop.run_in_executor(
                    None,
                    lambda: send_alert_email(sim_id, _seed_text, _risk["score"], _risk["label"])
                )
            except Exception as _ae:
                import logging as _logging
                _logging.getLogger("simulacra.alerts").warning(f"Erro no alerta: {_ae}")

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
    _validate_sim_id(sim_id)
    from agents.cache import cache_get, cache_set
    cache_key = f"sim_result:{sim_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

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

    result = {**sim, "risk": risk}
    cache_set(cache_key, result, ttl=60)
    return result


@router.get("/{sim_id}/graph")
async def get_graph(sim_id: str):
    _validate_sim_id(sim_id)
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


@router.get("/{sim_id}/export")
async def export_ticks(sim_id: str, format: str = "csv"):
    """Export simulation ticks as CSV or JSON file download."""
    _validate_sim_id(sim_id)
    if format not in ("csv", "json"):
        raise HTTPException(status_code=400, detail="Formato inválido. Use 'csv' ou 'json'.")
    sim = get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")
    ticks = get_simulation_ticks(sim_id)
    if not ticks:
        raise HTTPException(status_code=400, detail="Sem dados de ticks para exportar")

    if format == "json":
        import json as _json
        content = _json.dumps({
            "simulation_id": sim_id,
            "seed_text": sim.get("seed_text", ""),
            "num_agents": sim.get("num_agents"),
            "intervention": sim.get("intervention"),
            "region": sim.get("region"),
            "ticks": ticks,
        }, ensure_ascii=False, indent=2)
        return Response(
            content=content.encode("utf-8"),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="simulacra_{sim_id[:8]}_ticks.json"'},
        )
    else:
        # Default: CSV
        import io, csv as _csv
        buf = io.StringIO()
        writer = _csv.DictWriter(buf, fieldnames=["tick", "S", "E", "I", "R"])
        writer.writeheader()
        writer.writerows(ticks)
        return Response(
            content=buf.getvalue().encode("utf-8"),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="simulacra_{sim_id[:8]}_ticks.csv"'},
        )


@router.get("/compare-view")
@limiter.limit("10/minute")
async def compare_two_simulations(request: Request, sim_a: str, sim_b: str):
    """Retorna dados de duas simulações para exibição lado a lado."""
    _validate_sim_id(sim_a)
    _validate_sim_id(sim_b)
    sim_a_data = get_simulation(sim_a)
    sim_b_data = get_simulation(sim_b)

    if not sim_a_data:
        raise HTTPException(status_code=404, detail=f"Simulação A não encontrada")
    if not sim_b_data:
        raise HTTPException(status_code=404, detail=f"Simulação B não encontrada")

    ticks_a = get_simulation_ticks(sim_a)
    ticks_b = get_simulation_ticks(sim_b)

    from agents.risk_scorer import calculate_risk_score

    def _risk(sim, ticks):
        if not ticks or sim.get("status") != "finished":
            return None
        return calculate_risk_score(
            num_agents=sim["num_agents"],
            peak_infected=sim.get("peak_infected") or 0,
            time_to_peak=sim.get("time_to_peak") or 1,
            total_reach=sim.get("total_reach") or 0.0,
            total_ticks=sim.get("total_ticks") or 1,
            intervention=sim.get("intervention"),
        )

    return {
        "sim_a": {**sim_a_data, "ticks": ticks_a, "risk": _risk(sim_a_data, ticks_a)},
        "sim_b": {**sim_b_data, "ticks": ticks_b, "risk": _risk(sim_b_data, ticks_b)},
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


class MultiSeedRequest(BaseModel):
    seeds: list[str]
    num_agents: int = 150
    intervention: Optional[Literal["fact_check", "removal", "counter_narrative", "label_warning"]] = None
    random_seed: int = 42
    region: Optional[Literal["SP", "NE", "SUL", "CO", "N", "RJ"]] = None

    @field_validator("seeds")
    @classmethod
    def validate_seeds(cls, v: list[str]) -> list[str]:
        if len(v) < 2:
            raise ValueError("seeds deve ter pelo menos 2 itens")
        if len(v) > 5:
            raise ValueError("seeds nao pode ter mais de 5 itens")
        cleaned = []
        for s in v:
            s = s.strip()
            if len(s) < 10:
                raise ValueError("cada seed deve ter pelo menos 10 caracteres")
            if len(s) > 1000:
                raise ValueError("cada seed nao pode ultrapassar 1000 caracteres")
            cleaned.append(bleach.clean(s, tags=[], strip=True))
        return cleaned

    @field_validator("num_agents")
    @classmethod
    def validate_num_agents(cls, v: int) -> int:
        if v < 10:
            raise ValueError("num_agents minimo e 10")
        if v > 300:
            raise ValueError("num_agents maximo e 300 no modo multi-seed")
        return v


def _run_seed_simulation(
    seed_text: str,
    seed_index: int,
    num_agents: int,
    intervention,
    random_seed: int,
    region,
) -> dict:
    """Executa uma única simulação para um seed — chamado em thread pool."""
    from agents.risk_scorer import calculate_risk_score, risk_label_description

    engine = SimulationEngine(
        num_agents=num_agents,
        intervention=intervention,
        random_seed=random_seed,
        region=region,
    )
    ticks = list(engine.run_ticks())
    if not ticks:
        return {
            "seed_text": seed_text[:120] + ("..." if len(seed_text) > 120 else ""),
            "seed_index": seed_index,
            "peak_infected": 0,
            "peak_pct": 0.0,
            "time_to_peak": 0,
            "total_reach_pct": 0.0,
            "total_ticks": 0,
            "risk": {"score": 0, "label": "Baixo", "color": "#34d399", "factors": {}},
        }

    peak = max(ticks, key=lambda t: t["I"])
    first = ticks[0]
    total = first["S"] + first["E"] + first["I"] + first["R"]
    total_reach = round((total - ticks[-1]["S"]) / total, 3)

    risk = calculate_risk_score(
        num_agents=num_agents,
        peak_infected=peak["I"],
        time_to_peak=peak["tick"],
        total_reach=total_reach,
        total_ticks=len(ticks),
        intervention=intervention,
    )
    risk["description"] = risk_label_description(risk["label"])

    return {
        "seed_text": seed_text[:120] + ("..." if len(seed_text) > 120 else ""),
        "seed_index": seed_index,
        "peak_infected": peak["I"],
        "peak_pct": round(peak["I"] / num_agents * 100, 1),
        "time_to_peak": peak["tick"],
        "total_reach_pct": round(total_reach * 100, 1),
        "total_ticks": len(ticks),
        "risk": risk,
    }


@router.post("/multi")
@limiter.limit("3/minute")
async def multi_seed_simulation(request: Request, req: MultiSeedRequest):
    """
    Roda a mesma configuração com múltiplas seeds em paralelo (thread pool).
    Retorna métricas e score de risco para cada seed.
    """
    loop = asyncio.get_event_loop()

    tasks = [
        loop.run_in_executor(
            None,
            functools.partial(
                _run_seed_simulation,
                seed_text=seed,
                seed_index=i,
                num_agents=req.num_agents,
                intervention=req.intervention,
                random_seed=req.random_seed,
                region=req.region,
            ),
        )
        for i, seed in enumerate(req.seeds)
    ]

    results = await asyncio.gather(*tasks)

    return {
        "num_agents": req.num_agents,
        "intervention": req.intervention,
        "region": req.region,
        "results": list(results),
    }


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
