import logging

from agents.report_agent import generate_report
from database import get_report, get_report_by_simulation
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger("simulacra")
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/report", tags=["report"])


class GenerateReportRequest(BaseModel):
    simulation_id: str


@router.post("/generate")
@limiter.limit("5/minute")
def create_report(request: Request, body: GenerateReportRequest):
    """Gera (ou retorna do cache) o relatório de uma simulação concluída."""
    sim_id = body.simulation_id.strip()
    if not sim_id:
        raise HTTPException(status_code=400, detail="simulation_id é obrigatório.")

    # Cache check antes de chamar o agente
    cached = get_report_by_simulation(sim_id)
    if cached:
        logger.info(f"Relatório cacheado retornado para simulação {sim_id}")
        return {**cached, "cached": True}

    try:
        report = generate_report(sim_id)
        logger.info(f"Relatório gerado para simulação {sim_id} (cached={report['cached']})")
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao gerar relatório para {sim_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao gerar relatório.")


@router.get("/by-simulation/{sim_id}")
def get_report_by_sim(sim_id: str):
    """Retorna o relatório de uma simulação, se já gerado."""
    report = get_report_by_simulation(sim_id)
    if not report:
        raise HTTPException(
            status_code=404, detail="Relatório não encontrado para esta simulação."
        )
    return {**report, "cached": True}


@router.get("/{report_id}")
def get_report_by_id(report_id: str):
    """Retorna um relatório pelo seu ID."""
    report = get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Relatório não encontrado.")
    return {**report, "cached": True}


@router.get("/{report_id}/export/md")
@limiter.limit("10/minute")
async def export_report_md(request: Request, report_id: str):
    """Export report as Markdown file download."""
    from database import get_report
    from fastapi.responses import Response
    report = get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
    filename = f"simulacra_report_{report_id[:8]}.md"
    return Response(
        content=report["markdown"].encode("utf-8"),
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
