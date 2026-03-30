"""Router de configuração de alertas."""
import logging
from typing import Optional

from auth.middleware import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from utils import get_client_ip

from agents.alert_manager import (
    disable_alert,
    get_alert_config,
    set_alert_config,
)

logger = logging.getLogger("simulacra.alerts")
router = APIRouter(prefix="/alerts", tags=["alerts"])
limiter = Limiter(key_func=get_client_ip)


class AlertConfigRequest(BaseModel):
    recipient_email: str
    threshold: int = 70


@router.post("/config")
@limiter.limit("10/minute")
def configure_alert(
    request: Request,
    body: AlertConfigRequest,
    user: Optional[dict] = Depends(get_current_user),
):
    """
    Configura o e-mail de alerta e o limiar de score de risco.
    Requer autenticação quando auth está habilitada.
    """
    try:
        set_alert_config(body.recipient_email, body.threshold)
        return {
            "status": "configured",
            "recipient_email": body.recipient_email,
            "threshold": body.threshold,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/config")
@limiter.limit("20/minute")
def get_config(
    request: Request,
    user: Optional[dict] = Depends(get_current_user),
):
    """Retorna a configuração atual de alertas (sem credenciais SMTP).
    Requer autenticação quando auth está habilitada.
    """
    config = get_alert_config()
    # Não retornar o e-mail do destinatário para não vazar informação
    return {
        "enabled": config.get("enabled", False),
        "threshold": config.get("threshold"),
    }


@router.delete("/config")
@limiter.limit("10/minute")
def delete_config(
    request: Request,
    user: Optional[dict] = Depends(get_current_user),
):
    """Desativa os alertas. Requer autenticação quando auth está habilitada."""
    disable_alert()
    return {"status": "disabled"}
