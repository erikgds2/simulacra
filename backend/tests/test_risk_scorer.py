import pytest
from agents.risk_scorer import calculate_risk_score, risk_label_description


def test_score_zero_agents():
    result = calculate_risk_score(0, 0, 1, 0.0, 10)
    assert result["score"] == 0


def test_score_range():
    result = calculate_risk_score(100, 50, 10, 0.7, 30)
    assert 0 <= result["score"] <= 100


def test_score_has_required_fields():
    result = calculate_risk_score(100, 50, 10, 0.7, 30)
    assert "score" in result
    assert "label" in result
    assert "color" in result
    assert "factors" in result


def test_label_baixo():
    result = calculate_risk_score(100, 2, 50, 0.05, 80)
    assert result["label"] == "Baixo"
    assert result["color"] == "#34d399"


def test_label_critico():
    result = calculate_risk_score(100, 90, 2, 0.95, 10)
    assert result["label"] in ["Alto", "Crítico"]


def test_intervention_reduces_score():
    base = calculate_risk_score(100, 50, 10, 0.7, 30, intervention=None)
    with_removal = calculate_risk_score(100, 50, 10, 0.7, 30, intervention="removal")
    assert with_removal["score"] <= base["score"]


def test_removal_most_effective():
    removal = calculate_risk_score(100, 50, 10, 0.7, 30, intervention="removal")
    fact_check = calculate_risk_score(100, 50, 10, 0.7, 30, intervention="fact_check")
    assert removal["score"] <= fact_check["score"]


def test_risk_label_description_not_empty():
    for label in ["Baixo", "Moderado", "Alto", "Crítico"]:
        desc = risk_label_description(label)
        assert len(desc) > 10


def test_compare_endpoint():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app, raise_server_exceptions=False)
    r = client.post(
        "/simulation/compare",
        json={
            "seed_text": "Fake news sobre bloqueio do Pix circulando nas redes sociais brasileiras",
            "num_agents": 30,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
    assert len(data["results"]) == 5
    assert "best_intervention" in data
    assert "worst_intervention" in data


def test_compare_results_sorted_by_risk():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app, raise_server_exceptions=False)
    r = client.post(
        "/simulation/compare",
        json={
            "seed_text": "Notícia falsa sobre regulação financeira gerando pânico no mercado",
            "num_agents": 30,
        },
    )
    assert r.status_code == 200
    results = r.json()["results"]
    scores = [res["risk"]["score"] for res in results]
    assert scores == sorted(scores)
