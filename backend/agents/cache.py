"""
Cache in-memory com TTL para respostas de leitura do backend.
Sem dependências externas — usa apenas stdlib.
"""
import time
from typing import Any, Optional

_store: dict[str, tuple[Any, float]] = {}
DEFAULT_TTL = 30  # segundos


def cache_get(key: str) -> Optional[Any]:
    """Retorna valor do cache se ainda válido, ou None se expirado/ausente."""
    entry = _store.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if time.monotonic() > expires_at:
        _store.pop(key, None)
        return None
    return value


def cache_set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
    """Armazena valor no cache com TTL em segundos."""
    _store[key] = (value, time.monotonic() + ttl)


def cache_invalidate(prefix: str) -> None:
    """Remove todas as entradas cujas chaves começam com prefix."""
    keys = [k for k in list(_store.keys()) if k.startswith(prefix)]
    for k in keys:
        _store.pop(k, None)


def cache_stats() -> dict:
    """Retorna estatísticas do cache (útil para /health)."""
    now = time.monotonic()
    valid = sum(1 for _, (_, exp) in _store.items() if exp > now)
    return {"total_entries": len(_store), "valid_entries": valid}
