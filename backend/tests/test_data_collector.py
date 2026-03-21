"""Testes do Data Collector — endpoints /seeds/ e normalização RSS."""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app, raise_server_exceptions=False)


def test_seeds_list_returns_structure():
    r = client.get("/seeds/")
    assert r.status_code == 200
    data = r.json()
    assert "seeds" in data
    assert "total" in data
    assert isinstance(data["seeds"], list)
    assert isinstance(data["total"], int)


def test_seeds_list_pagination():
    r = client.get("/seeds/?limit=5&offset=0")
    assert r.status_code == 200
    data = r.json()
    assert len(data["seeds"]) <= 5


def test_seeds_limit_max():
    r = client.get("/seeds/?limit=101")
    assert r.status_code == 400


def test_seeds_db_list_returns_structure():
    r = client.get("/seeds/db/list")
    assert r.status_code == 200
    data = r.json()
    assert "seeds" in data
    assert "total" in data


def test_seed_not_found():
    r = client.get("/seeds/id-que-nao-existe-xyz")
    assert r.status_code == 404


def test_collect_seeds_mock():
    mock_entries = [
        {
            "id": "test-uuid-1",
            "source": "lupa",
            "source_name": "Agência Lupa",
            "collected_at": "2026-01-01T00:00:00+00:00",
            "title": "Fake news sobre política verificada",
            "content": "Fake news sobre política verificada. Conteúdo verificado pela Agência Lupa.",
            "url": "https://example.com/fake-news-test-unique-12345",
            "tags": ["desinformação"],
            "region_br": "nacional",
        }
    ]
    with patch("routers.seeds._fetch_rss", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_entries
        r = client.post("/seeds/collect")
        assert r.status_code == 200
        data = r.json()
        assert "collected" in data
        assert "total" in data
        assert isinstance(data["collected"], int)


def test_normalize_entry_removes_html():
    from routers.seeds import _normalize_entry
    entry = {
        "link": "https://example.com/test",
        "title": "<b>Título com HTML</b>",
        "summary": "<p>Resumo com <script>alert('xss')</script> tags</p>",
    }
    result = _normalize_entry(entry, "test", "Test Source")
    assert result is not None
    assert "<b>" not in result["title"]
    assert "<script>" not in result["content"]
    assert "Título com HTML" in result["title"]


def test_normalize_entry_missing_url_returns_none():
    from routers.seeds import _normalize_entry
    entry = {"link": "", "title": "Título válido", "summary": "Resumo"}
    result = _normalize_entry(entry, "test", "Test")
    assert result is None


def test_normalize_entry_missing_title_returns_none():
    from routers.seeds import _normalize_entry
    entry = {"link": "https://example.com", "title": "", "summary": "Resumo"}
    result = _normalize_entry(entry, "test", "Test")
    assert result is None


def test_normalize_entry_truncates_content():
    from routers.seeds import _normalize_entry
    entry = {
        "link": "https://example.com/long",
        "title": "Título",
        "summary": "x" * 3000,
    }
    result = _normalize_entry(entry, "test", "Test")
    assert result is not None
    assert len(result["content"]) <= 2000
