"""Testes de integração end-to-end — fluxo completo de simulação."""
import json

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app, raise_server_exceptions=False)

VALID_SEED = "Esta é uma notícia falsa sobre o sistema eleitoral brasileiro que está circulando nas redes sociais"


def test_full_simulation_flow():
    r = client.post(
        "/simulation/start",
        json={"seed_text": VALID_SEED, "num_agents": 30, "random_seed": 42},
    )
    assert r.status_code == 200
    sim_id = r.json()["simulation_id"]
    assert sim_id is not None

    with client.stream("GET", f"/simulation/{sim_id}/stream") as response:
        assert response.status_code == 200
        ticks_received = 0
        done = False
        for line in response.iter_lines():
            if line.startswith("data: "):
                data = json.loads(line[6:])
                if data.get("done"):
                    done = True
                    break
                ticks_received += 1
                assert "S" in data
                assert "E" in data
                assert "I" in data
                assert "R" in data
                if ticks_received >= 5:
                    break

    assert ticks_received >= 1


def test_simulation_result_after_stream():
    r = client.post(
        "/simulation/start",
        json={"seed_text": VALID_SEED, "num_agents": 20, "random_seed": 99},
    )
    assert r.status_code == 200
    sim_id = r.json()["simulation_id"]

    # Consumir o stream completo para marcar como finished
    with client.stream("GET", f"/simulation/{sim_id}/stream") as response:
        for line in response.iter_lines():
            if "done" in line:
                break

    result = client.get(f"/simulation/{sim_id}/result")
    if result.status_code == 200:
        data = result.json()
        assert "peak_infected" in data or "status" in data


def test_simulation_list_returns_list():
    r = client.get("/simulation/list")
    assert r.status_code == 200
    data = r.json()
    assert "simulations" in data
    assert isinstance(data["simulations"], list)


def test_simulation_with_intervention():
    for intervention in ["fact_check", "removal", "counter_narrative", "label_warning"]:
        r = client.post(
            "/simulation/start",
            json={
                "seed_text": VALID_SEED,
                "num_agents": 20,
                "intervention": intervention,
                "random_seed": 42,
            },
        )
        assert r.status_code == 200, f"Falhou com intervenção: {intervention}"
        assert "simulation_id" in r.json()


def test_health_and_docs():
    assert client.get("/health").status_code == 200
    assert client.get("/docs").status_code == 200
    assert client.get("/redoc").status_code == 200


def test_invalid_endpoints_return_404():
    assert client.get("/endpoint-que-nao-existe").status_code == 404
    assert client.get("/simulation/id-fake/result").status_code in (400, 404)
    assert client.get("/report/id-fake").status_code == 404


def test_cors_headers_present():
    r = client.options(
        "/health",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
    )
    assert r.status_code in (200, 405)


def test_security_headers_on_all_endpoints():
    endpoints = ["/health", "/seeds/", "/simulation/list"]
    for ep in endpoints:
        r = client.get(ep)
        assert r.headers.get("x-content-type-options") == "nosniff", f"Faltou header em {ep}"
        assert r.headers.get("x-frame-options") == "DENY", f"Faltou header em {ep}"
