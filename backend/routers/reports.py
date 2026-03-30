import logging
from typing import Optional

from agents.report_agent import generate_report
from auth.middleware import auth_enabled, get_current_user
from database import (
    check_and_increment_daily_limit,
    get_report,
    get_report_by_simulation,
)
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from utils import get_client_ip

logger = logging.getLogger("simulacra")
limiter = Limiter(key_func=get_client_ip)

router = APIRouter(prefix="/report", tags=["report"])

_LIMIT_STANDARD = 2   # relatórios simples por dia por usuário
_LIMIT_ADVANCED = 1   # relatórios avançados por dia por usuário


class GenerateReportRequest(BaseModel):
    simulation_id: str


def _check_daily_limit(user: Optional[dict], report_type: str, limit: int) -> None:
    """Verifica o limite diário se auth estiver habilitada e usuário logado."""
    if not auth_enabled() or user is None:
        return  # Sem auth → sem limite por usuário

    allowed, reset_in = check_and_increment_daily_limit(
        user["user_id"], report_type, limit
    )
    if not allowed:
        hours = reset_in // 3600
        minutes = (reset_in % 3600) // 60
        reset_msg = f"{hours}h {minutes}min" if hours else f"{minutes}min"
        raise HTTPException(
            status_code=429,
            detail={
                "message": f"Limite diário de relatórios {'simples' if report_type == 'standard' else 'avançados'} atingido ({limit}/dia).",
                "reset_in": reset_msg,
                "reset_in_seconds": reset_in,
            },
        )


@router.post("/generate")
@limiter.limit("5/minute")
def create_report(
    request: Request,
    body: GenerateReportRequest,
    user: Optional[dict] = Depends(get_current_user),
):
    """Gera (ou retorna do cache) o relatório de uma simulação concluída."""
    sim_id = body.simulation_id.strip()
    if not sim_id:
        raise HTTPException(status_code=400, detail="simulation_id é obrigatório.")

    # Cache check antes de consumir o limite diário
    cached = get_report_by_simulation(sim_id)
    if cached:
        logger.info(f"Relatório cacheado retornado para simulação {sim_id}")
        return {**cached, "cached": True}

    # Só conta no limite quando gera de fato (cache miss)
    _check_daily_limit(user, "standard", _LIMIT_STANDARD)

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
@limiter.limit("20/minute")
def get_report_by_sim(request: Request, sim_id: str):
    """Retorna o relatório de uma simulação, se já gerado."""
    report = get_report_by_simulation(sim_id)
    if not report:
        raise HTTPException(
            status_code=404, detail="Relatório não encontrado para esta simulação."
        )
    return {**report, "cached": True}


@router.get("/{report_id}")
@limiter.limit("20/minute")
def get_report_by_id(request: Request, report_id: str):
    """Retorna um relatório pelo seu ID."""
    report = get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Relatório não encontrado.")
    return {**report, "cached": True}


@router.post("/generate/advanced")
@limiter.limit("2/minute")
def create_advanced_report(
    request: Request,
    body: GenerateReportRequest,
    user: Optional[dict] = Depends(get_current_user),
):
    """Gera relatório avançado com Claude Sonnet + web_search (rate: 2/min)."""
    import os
    if os.getenv("ENVIRONMENT") == "test":
        raise HTTPException(status_code=503, detail="Agente avançado desabilitado em ambiente de teste.")

    sim_id = body.simulation_id.strip()
    if not sim_id:
        raise HTTPException(status_code=400, detail="simulation_id é obrigatório.")

    # Limite diário ANTES de qualquer cache — avançado consome Claude Sonnet
    _check_daily_limit(user, "advanced", _LIMIT_ADVANCED)

    try:
        from agents.report_agent import generate_report_advanced
        report = generate_report_advanced(sim_id)
        logger.info(f"Relatório avançado gerado para simulação {sim_id}")
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao gerar relatório avançado para {sim_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao gerar relatório avançado.")


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
