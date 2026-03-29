import os
import pytest

os.environ.setdefault("ENVIRONMENT", "test")


def test_advanced_report_disabled_in_test_env(client):
    """Em ambiente de teste, o endpoint deve retornar 503."""
    import uuid
    resp = client.post(
        "/report/generate/advanced",
        json={"simulation_id": str(uuid.uuid4())},
    )
    assert resp.status_code == 503


def test_advanced_report_endpoint_exists(client):
    """O endpoint POST /report/generate/advanced deve existir."""
    import uuid
    resp = client.post(
        "/report/generate/advanced",
        json={"simulation_id": str(uuid.uuid4())},
    )
    # 503 = test env disabled (correct behavior), not 404 (missing)
    assert resp.status_code != 404


def test_advanced_report_invalid_sim_id(client):
    """simulation_id vazio deve retornar 400, 503 ou 429 (rate limit)."""
    resp = client.post("/report/generate/advanced", json={"simulation_id": ""})
    assert resp.status_code in (400, 503, 429)


def test_generate_report_advanced_import():
    """Função deve ser importável sem erro."""
    from agents.report_agent import generate_report_advanced
    assert callable(generate_report_advanced)
