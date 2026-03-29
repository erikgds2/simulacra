import os
import uuid
import pytest

os.environ.setdefault("ENVIRONMENT", "test")


def test_graph_endpoint_returns_ticks(client, finished_simulation):
    """Endpoint /graph deve retornar lista de ticks."""
    sim_id = finished_simulation
    resp = client.get(f"/simulation/{sim_id}/graph")
    assert resp.status_code == 200
    data = resp.json()
    assert "ticks" in data
    assert isinstance(data["ticks"], list)
    assert len(data["ticks"]) > 0


def test_graph_tick_structure(client, finished_simulation):
    """Cada tick deve ter campos tick, S, E, I, R."""
    sim_id = finished_simulation
    resp = client.get(f"/simulation/{sim_id}/graph")
    data = resp.json()
    tick = data["ticks"][0]
    for field in ("tick", "S", "E", "I", "R"):
        assert field in tick, f"Campo '{field}' ausente no tick"


def test_graph_invalid_sim_returns_404(client):
    """ID inexistente deve retornar 404."""
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/simulation/{fake_id}/graph")
    assert resp.status_code == 404
