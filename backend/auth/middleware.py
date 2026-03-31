import logging
import os
from typing import Optional

import jwt
from fastapi import Header, HTTPException
from jwt import PyJWKClient

logger = logging.getLogger("simulacra")

_jwks_client: Optional[PyJWKClient] = None


def _get_supabase_url() -> Optional[str]:
    return os.getenv("SUPABASE_URL", "").strip() or None


def _get_jwks_client() -> Optional[PyJWKClient]:
    """Retorna (e cria se necessário) o cliente JWKS do Supabase."""
    global _jwks_client
    url = _get_supabase_url()
    if not url:
        return None
    if _jwks_client is None:
        jwks_uri = f"{url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_uri, cache_keys=True)
        logger.info(f"JWKS client inicializado: {jwks_uri}")
    return _jwks_client


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> Optional[dict]:
    """
    Dependência FastAPI: verifica JWT do Supabase via JWKS (ES256/RS256).

    - Se SUPABASE_URL não estiver configurado → auth desabilitada,
      retorna None (modo open source / desenvolvimento sem auth).
    - Se configurado e token ausente/inválido → 401.
    - Se válido → retorna {"user_id": str, "email": str}.
    """
    client = _get_jwks_client()
    if not client:
        return None  # Auth desabilitada

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Autenticação necessária. Faça login para gerar relatórios.",
        )

    token = authorization.split(" ", 1)[1]
    try:
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256", "HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Sessão expirada. Faça login novamente.",
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Token inválido: {e}")
        raise HTTPException(
            status_code=401,
            detail="Token de autenticação inválido.",
        )
    except Exception as e:
        logger.error(f"Erro ao verificar JWT: {e}")
        raise HTTPException(
            status_code=401,
            detail="Erro ao verificar autenticação.",
        )

    return {
        "user_id": payload.get("sub", ""),
        "email": payload.get("email", ""),
    }


def auth_enabled() -> bool:
    """Retorna True se auth estiver habilitada via env vars."""
    return _get_supabase_url() is not None
