import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app, raise_server_exceptions=False)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_security_headers():
    r = client.get("/health")
    assert r.headers.get("x-content-type-options") == "nosniff"
    assert r.headers.get("x-frame-options") == "DENY"


def test_simulation_seed_text_too_short():
    r = client.post("/simulation/start", json={"seed_text": "curto"})
    assert r.status_code == 422


def test_simulation_seed_text_too_long():
    r = client.post("/simulation/start", json={"seed_text": "x" * 5001})
    assert r.status_code == 422


def test_simulation_num_agents_too_high():
    r = client.post(
        "/simulation/start",
        json={"seed_text": "Texto de teste com tamanho suficiente", "num_agents": 9999},
    )
    assert r.status_code == 422


def test_simulation_num_agents_too_low():
    r = client.post(
        "/simulation/start",
        json={"seed_text": "Texto de teste com tamanho suficiente", "num_agents": 1},
    )
    assert r.status_code == 422


def test_simulation_xss_sanitization():
    payload = "<script>alert('xss')</script> Esta e uma noticia falsa sobre politica"
    r = client.post("/simulation/start", json={"seed_text": payload})
    assert r.status_code == 200
    sim_id = r.json()["simulation_id"]
    assert sim_id is not None


def test_simulation_not_found():
    r = client.get("/simulation/id-que-nao-existe/result")
    assert r.status_code == 404


def test_seeds_list():
    r = client.get("/seeds/")
    assert r.status_code == 200
    assert "seeds" in r.json()
    assert "total" in r.json()


def test_seeds_limit_exceeded():
    r = client.get("/seeds/?limit=999")
    assert r.status_code == 400
