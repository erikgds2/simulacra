import os

from fastapi import Request


def get_client_ip(request: Request) -> str:
    """
    Retorna o IP real do cliente, protegido contra falsificação de
    X-Forwarded-For por clientes não-confiáveis.

    Em produção (Render), o proxy da Render injeta o IP real em
    X-Forwarded-For de forma confiável antes de repassar a requisição.
    Em dev, usa diretamente request.client.host (sem proxy).
    """
    env = os.getenv("ENVIRONMENT", "development")
    if env == "production":
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            first_ip = forwarded.split(",")[0].strip()
            if first_ip:
                return first_ip
    return request.client.host if request.client else "unknown"
