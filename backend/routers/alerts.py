"""Router de configuração de alertas."""
import logging

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from agents.alert_manager import (
    disable_alert,
    get_alert_config,
    set_alert_config,
)

logger = logging.getLogger("simulacra.alerts")
router = APIRouter(prefix="/alerts", tags=["alerts"])
limiter = Limiter(key_func=get_remote_address)


class AlertConfigRequest(BaseModel):
    recipient_email: str
    threshold: int = 70


@router.post("/config")
@limiter.limit("10/minute")
def configure_alert(request: Request, body: AlertConfigRequest):
    """
    Configura o e-mail de alerta e o limiar de score de risco.
    Credenciais SMTP devem estar nas variáveis de ambiente do servidor.
    """
    try:
        set_alert_config(body.recipient_email, body.threshold)
        return {"status": "configured", "recipient_email": body.recipient_email, "threshold": body.threshold}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/config")
@limiter.limit("20/minute")
def get_config(request: Request):
    """Retorna a configuração atual de alertas (sem credenciais SMTP)."""
    return get_alert_config()


@router.delete("/config")
@limiter.limit("10/minute")
def delete_config(request: Request):
    """Desativa os alertas."""
    disable_alert()
    return {"status": "disabled"}
