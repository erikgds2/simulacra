import logging
import os
from typing import Optional

from auth.disposable_emails import is_disposable_email
from auth.middleware import auth_enabled, get_current_user
from database import get_user_daily_usage
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from utils import get_client_ip

logger = logging.getLogger("simulacra")
limiter = Limiter(key_func=get_client_ip)

router = APIRouter(prefix="/auth", tags=["auth"])

_DAILY_LIMITS = {"standard": 2, "advanced": 1}


@router.get("/validate-email")
@limiter.limit("20/minute")
def validate_email(
    request: Request,
    email: str = Query(..., description="E-mail a validar"),
):
    """
    Verifica se um e-mail pertence a um provedor descartável/temporário.
    Retorna {"valid": false} para descartáveis — sem detalhar o motivo
    (evita enumeração de domínios bloqueados).
    """
    email = email.strip().lower()
    if not email or "@" not in email:
        return {"valid": False}

    if is_disposable_email(email):
        return {"valid": False, "reason": "disposable"}

    return {"valid": True}


@router.get("/status")
async def auth_status(user: Optional[dict] = Depends(get_current_user)):
    """
    Retorna o status de autenticação e o uso diário do usuário logado.
    Se auth estiver desabilitada (modo open source), informa isso.
    """
    if not auth_enabled():
        return {
            "auth_enabled": False,
            "authenticated": False,
            "limits": None,
        }

    if not user:
        return {
            "auth_enabled": True,
            "authenticated": False,
            "limits": None,
        }

    usage = get_user_daily_usage(user["user_id"])
    return {
        "auth_enabled": True,
        "authenticated": True,
        "user": {"email": user["email"]},
        "usage": usage,
        "limits": _DAILY_LIMITS,
    }
