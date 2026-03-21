"""Testes do endpoint /report e do report_agent (sem chamar API real)."""
import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from database import (
    get_report_by_simulation,
    get_simulation,
    init_db,
    save_report,
    save_simulation,
    finish_simulation,
)
from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db(tmp_path, monkeypatch):
    """Usa um banco temporário para cada teste."""
    db_file = tmp_path / "test.db"
    import database
    monkeypatch.setattr(database, "DB_PATH", db_file)
    init_db()
    yield


# ─── Endpoint /report/{id} ────────────────────────────────────────────────────

def test_get_report_by_id_not_found():
    res = client.get("/report/nao-existe")
    assert res.status_code == 404


def test_get_report_by_simulation_not_found():
    res = client.get("/report/by-simulation/sim-inexistente")
    assert res.status_code == 404


# ─── POST /report/generate ────────────────────────────────────────────────────

def test_generate_report_missing_simulation():
    res = client.post("/report/generate", json={"simulation_id": "nao-existe"})
    assert res.status_code == 400
    assert "não encontrada" in res.json()["detail"]


def test_generate_report_not_finished():
    sim_id = str(uuid.uuid4())
    save_simulation(sim_id, {
        "seed_text": "Teste de desinformação",
        "num_agents": 100,
        "random_seed": 42,
    })
    res = client.post("/report/generate", json={"simulation_id": sim_id})
    assert res.status_code == 400
    assert "concluída" in res.json()["detail"]


def test_generate_report_cached():
    """Se já existe relatório no DB, retorna sem chamar Claude API."""
    sim_id = str(uuid.uuid4())
    report_id = str(uuid.uuid4())
    save_simulation(sim_id, {
        "seed_text": "Fake news sobre vacinas",
        "num_agents": 100,
        "random_seed": 99,
    })
    finish_simulation(sim_id, {
        "peak_infected": 30,
        "time_to_peak": 10,
        "total_reach": 0.7,
        "total_ticks": 100,
    })
    save_report(report_id, sim_id, "# Relatório\n\nConteúdo de teste.", "claude-haiku-4-5-20251001")

    res = client.post("/report/generate", json={"simulation_id": sim_id})
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == report_id
    assert data["cached"] is True
    assert "Relatório" in data["markdown"]


def test_generate_report_calls_claude_api():
    """Verifica que generate_report chama a API Claude quando não há cache."""
    sim_id = str(uuid.uuid4())
    report_id = str(uuid.uuid4())
    save_simulation(sim_id, {
        "seed_text": "Terra plana é verdade",
        "num_agents": 50,
        "random_seed": 7,
    })
    finish_simulation(sim_id, {
        "peak_infected": 15,
        "time_to_peak": 5,
        "total_reach": 0.6,
        "total_ticks": 50,
    })

    mock_report = {
        "id": report_id,
        "simulation_id": sim_id,
        "markdown": "# Relatório Gerado\n\nTexto mock.",
        "model": "claude-haiku-4-5-20251001",
        "created_at": "2025-01-01T00:00:00+00:00",
        "cached": False,
    }

    with patch("routers.reports.generate_report", return_value=mock_report) as mock_gen:
        res = client.post("/report/generate", json={"simulation_id": sim_id})
        assert res.status_code == 200
        data = res.json()
        assert data["cached"] is False
        assert "Relatório Gerado" in data["markdown"]
        mock_gen.assert_called_once_with(sim_id)


# ─── Funções de DB de relatório ───────────────────────────────────────────────

def test_save_and_get_report():
    sim_id = str(uuid.uuid4())
    report_id = str(uuid.uuid4())
    save_simulation(sim_id, {
        "seed_text": "Teste de save_report",
        "num_agents": 200,
        "random_seed": 1,
    })
    save_report(report_id, sim_id, "# Relatório\n\nTexto.", "claude-haiku-4-5-20251001")

    report = get_report_by_simulation(sim_id)
    assert report is not None
    assert report["id"] == report_id
    assert report["markdown"] == "# Relatório\n\nTexto."

    from database import get_report
    by_id = get_report(report_id)
    assert by_id is not None
    assert by_id["simulation_id"] == sim_id
