import feedparser
import httpx
from typing import List, Dict, Any


RSS_FEEDS = [
    "https://lupa.uol.com.br/feed/",
    "https://aosfatos.org/feed/",
]


async def collect_seeds(limit: int = 10) -> List[Dict[str, Any]]:
    """Coleta seeds de fact-checkers brasileiros via RSS."""
    results: List[Dict[str, Any]] = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for feed_url in RSS_FEEDS:
            try:
                response = await client.get(feed_url)
                response.raise_for_status()
                feed = feedparser.parse(response.text)
                source = feed.feed.get("title", feed_url)

                for entry in feed.entries[:limit]:
                    results.append({
                        "source": source,
                        "title": entry.get("title", ""),
                        "summary": entry.get("summary", ""),
                        "link": entry.get("link", ""),
                        "published": entry.get("published", ""),
                    })
            except Exception as exc:
                print(f"[data_collector] Erro ao buscar {feed_url}: {exc}")

    return results[:limit]
