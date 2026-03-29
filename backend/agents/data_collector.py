import bleach
import feedparser
import httpx
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

RSS_FEEDS = {
    "Agencia Lupa": "https://lupa.uol.com.br/feed/",
    "Aos Fatos": "https://aosfatos.org/feed/",
}

TIMEOUT_SEGUNDOS = 15.0
MAX_SEEDS_POR_FONTE = 10


def _sanitize_text(text: str) -> str:
    """Strip all HTML tags from RSS feed content using bleach."""
    return bleach.clean(text, tags=[], strip=True).strip()


async def collect_seeds(limit: int = 10) -> List[Dict[str, Any]]:
    """Coleta seeds de fact-checkers brasileiros via RSS.

    Args:
        limit: numero maximo de seeds a retornar no total.

    Returns:
        Lista de dicts com {source, title, summary, link, published}.
    """
    results: List[Dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=TIMEOUT_SEGUNDOS) as client:
        for source_name, feed_url in RSS_FEEDS.items():
            try:
                logger.info("[data_collector] buscando feed: %s", source_name)
                response = await client.get(feed_url)
                response.raise_for_status()
                feed = feedparser.parse(response.text)

                if not feed.entries:
                    logger.warning("[data_collector] feed vazio: %s", source_name)
                    continue

                for entry in feed.entries[:MAX_SEEDS_POR_FONTE]:
                    # Fix 12: Sanitize all text from RSS feed with bleach
                    results.append({
                        "source": source_name,
                        "title": _sanitize_text(entry.get("title", "")),
                        "summary": _sanitize_text(entry.get("summary", "")),
                        "link": entry.get("link", ""),
                        "published": entry.get("published", ""),
                    })

                logger.info("[data_collector] %d seeds coletadas de %s", len(feed.entries[:MAX_SEEDS_POR_FONTE]), source_name)

            except httpx.TimeoutException:
                logger.error("[data_collector] timeout ao buscar %s", feed_url)
            except httpx.HTTPStatusError as e:
                logger.error("[data_collector] HTTP %d ao buscar %s", e.response.status_code, feed_url)
            except Exception as exc:
                logger.error("[data_collector] erro inesperado em %s: %s", feed_url, exc)

    logger.info("[data_collector] total coletado: %d seeds", len(results))
    return results[:limit]
