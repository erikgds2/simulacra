import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import bleach
import feedparser
import httpx
from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/seeds", tags=["seeds"])
limiter = Limiter(key_func=get_remote_address)

import os

_DATA_DIR = Path(os.getenv("DATA_DIR", str(Path(__file__).parent.parent / "data")))
SEEDS_DIR = _DATA_DIR / "seeds"
NORMALIZED_DIR = SEEDS_DIR / "normalized"
INDEX_FILE = SEEDS_DIR / "index.json"

NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)

RSS_SOURCES = [
    # Brasil
    {
        "id": "lupa",
        "name": "Agência Lupa",
        "url": "https://lupa.uol.com.br/feed/",
        "region": "brasil",
    },
    {
        "id": "aosfatos",
        "name": "Aos Fatos",
        "url": "https://aosfatos.org/noticias/feed/",
        "region": "brasil",
    },
    {
        "id": "g1fatooufake",
        "name": "G1 Fato ou Fake",
        "url": "https://g1.globo.com/rss/g1/fato-ou-fake/",
        "region": "brasil",
    },
    {
        "id": "boatos",
        "name": "Boatos.org",
        "url": "https://www.boatos.org/feed",
        "region": "brasil",
    },
    {
        "id": "efarsas",
        "name": "E-Farsas",
        "url": "https://www.e-farsas.com/feed",
        "region": "brasil",
    },
    # Internacional
    {
        "id": "fullfact",
        "name": "Full Fact (UK)",
        "url": "https://fullfact.org/feed/",
        "region": "internacional",
    },
    {
        "id": "snopes",
        "name": "Snopes",
        "url": "https://www.snopes.com/feed/",
        "region": "internacional",
    },
    {
        "id": "factcheckorg",
        "name": "FactCheck.org",
        "url": "https://www.factcheck.org/feed/",
        "region": "internacional",
    },
]


def _load_index() -> dict:
    if INDEX_FILE.exists():
        try:
            return json.loads(INDEX_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"seeds": [], "last_updated": None}


def _save_index(index: dict) -> None:
    INDEX_FILE.write_text(
        json.dumps(index, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _normalize_entry(entry: dict, source_id: str, source_name: str, region: str = "brasil") -> Optional[dict]:
    url = entry.get("link", "").strip()
    title = bleach.clean(entry.get("title", ""), tags=[], strip=True).strip()
    summary = bleach.clean(entry.get("summary", ""), tags=[], strip=True).strip()

    if not url or not title:
        return None

    content = f"{title}. {summary}"[:2000]

    return {
        "id": str(uuid.uuid4()),
        "source": source_id,
        "source_name": source_name,
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "title": title,
        "content": content,
        "url": url,
        "tags": ["desinformação", "fact-check"],
        "region_br": region,
    }


async def _fetch_rss(source: dict) -> list[dict]:
    results = []
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                source["url"],
                headers={"User-Agent": "Mozilla/5.0 (compatible; Simulacra/1.0; +https://github.com/erikgds2/simulacra)"},
            )
            resp.raise_for_status()
            feed = feedparser.parse(resp.text)
            for entry in feed.entries[:10]:
                normalized = _normalize_entry(
                    dict(entry), source["id"], source["name"], source.get("region", "brasil")
                )
                if normalized:
                    results.append(normalized)
    except Exception:
        pass
    return results


@router.post("/collect")
@limiter.limit("5/minute")
async def collect_seeds(request: Request):
    from database import save_seed_to_db, count_seeds
    index = _load_index()
    existing_urls = {s["url"] for s in index["seeds"]}
    new_seeds = []

    for source in RSS_SOURCES:
        entries = await _fetch_rss(source)
        for entry in entries:
            if entry["url"] not in existing_urls:
                file_path = NORMALIZED_DIR / f"{entry['id']}.json"
                file_path.write_text(
                    json.dumps(entry, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                save_seed_to_db(entry)
                new_seeds.append(entry)
                existing_urls.add(entry["url"])

    index["seeds"].extend(new_seeds)
    index["last_updated"] = datetime.now(timezone.utc).isoformat()
    _save_index(index)

    return {
        "collected": len(new_seeds),
        "total": len(index["seeds"]),
        "last_updated": index["last_updated"],
    }


@router.get("/db/list")
async def list_seeds_db(limit: int = 50, offset: int = 0):
    from database import list_seeds_from_db, count_seeds
    if limit > 100:
        raise HTTPException(status_code=400, detail="limit maximo e 100")
    return {
        "total": count_seeds(),
        "seeds": list_seeds_from_db(limit=limit, offset=offset),
    }


@router.get("/")
async def list_seeds(limit: int = 20, offset: int = 0):
    if limit > 100:
        raise HTTPException(status_code=400, detail="limit máximo é 100")
    index = _load_index()
    seeds = index["seeds"]
    return {
        "total": len(seeds),
        "seeds": seeds[offset: offset + limit],
    }


@router.get("/{seed_id}")
async def get_seed(seed_id: str):
    file_path = NORMALIZED_DIR / f"{seed_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Seed não encontrada")
    return json.loads(file_path.read_text(encoding="utf-8"))


@router.post("/translate", tags=["seeds"])
async def translate_seed(body: dict):
    """Traduz título e conteúdo de uma seed para PT-BR usando Claude API."""
    import os
    import anthropic
    title = body.get("title", "")
    content = body.get("content", "")
    if not title and not content:
        raise HTTPException(status_code=400, detail="title ou content obrigatório")

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    prompt = f"""Traduza o seguinte conteúdo jornalístico para português brasileiro de forma natural e fluida. Mantenha nomes próprios, siglas e termos técnicos. Retorne APENAS a tradução, sem comentários.

TÍTULO: {title}

CONTEÚDO: {content}

Responda no formato:
TÍTULO: [tradução do título]
CONTEÚDO: [tradução do conteúdo]"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text
    translated_title = title
    translated_content = content
    for line in text.split("\n"):
        if line.startswith("TÍTULO:"):
            translated_title = line.replace("TÍTULO:", "").strip()
        elif line.startswith("CONTEÚDO:"):
            translated_content = line.replace("CONTEÚDO:", "").strip()

    return {"title": translated_title, "content": translated_content}
