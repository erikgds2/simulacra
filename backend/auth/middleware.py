import os
from typing import Optional

import jwt
from fastapi import Header, HTTPException


def _get_jwt_secret() -> Optional[str]:
    return os.getenv("SUPABASE_JWT_SECRET", "").strip() or None


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> Optional[dict]:
    """
    Dependência FastAPI: verifica JWT do Supabase.

    - Se SUPABASE_JWT_SECRET não estiver configurado → auth desabilitada,
      retorna None (modo open source / desenvolvimento sem auth).
    - Se configurado e token ausente/inválido → 401.
    - Se válido → retorna {"user_id": str, "email": str}.
    """
    secret = _get_jwt_secret()
    if not secret:
        return None  # Auth desabilitada

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Autenticação necessária. Faça login para gerar relatórios.",
        )

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Sessão expirada. Faça login novamente.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token de autenticação inválido.",
        )

    return {
        "user_id": payload.get("sub", ""),
        "email": payload.get("email", ""),
    }


def auth_enabled() -> bool:
    """Retorna True se auth estiver habilitada via env vars."""
    return _get_jwt_secret() is not None
