import os
import uuid
import pytest

os.environ.setdefault("ENVIRONMENT", "test")


def test_heatmap_returns_six_regions(client, finished_simulation):
    """Heatmap deve retornar exatamente 6 regiões brasileiras."""
    sim_id = finished_simulation
    resp = client.get(f"/simulation/{sim_id}/heatmap")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["regions"]) == 6
    codes = {r["code"] for r in data["regions"]}
    assert codes == {"SP", "NE", "SUL", "CO", "N", "RJ"}


def test_heatmap_ne_higher_than_sul(client, finished_simulation):
    """Nordeste deve ter score >= Sul (maior multiplicador)."""
    sim_id = finished_simulation
    resp = client.get(f"/simulation/{sim_id}/heatmap")
    data = resp.json()
    by_code = {r["code"]: r for r in data["regions"]}
    assert by_code["NE"]["score"] >= by_code["SUL"]["score"]


def test_heatmap_requires_finished_sim(client):
    """Simulação não concluída deve retornar 404 ou 400."""
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/simulation/{fake_id}/heatmap")
    assert resp.status_code in (400, 404)
