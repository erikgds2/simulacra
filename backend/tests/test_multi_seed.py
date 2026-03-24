"""Testes unitários do módulo multi-seed — Dia 15."""
import pytest
from pydantic import ValidationError

from agents.simulation_engine import SimulationEngine
from agents.risk_scorer import calculate_risk_score


# ---------------------------------------------------------------------------
# Testes de validação do MultiSeedRequest (sem HTTP — testamos a lógica pura)
# ---------------------------------------------------------------------------

def _make_multi_seed_request(seeds, num_agents=50):
    """Helper: importa e instancia MultiSeedRequest."""
    from routers.simulation import MultiSeedRequest
    return MultiSeedRequest(seeds=seeds, num_agents=num_agents)


def test_multi_seed_requires_at_least_2_seeds():
    """Deve rejeitar quando apenas 1 seed é fornecida."""
    with pytest.raises(ValidationError) as exc_info:
        _make_multi_seed_request(seeds=["Esta é uma seed com pelo menos 10 chars"])
    assert "pelo menos 2" in str(exc_info.value).lower() or "2" in str(exc_info.value)


def test_multi_seed_max_5_seeds():
    """Deve rejeitar quando mais de 5 seeds são fornecidas."""
    seeds = [f"Seed válida número {i} com texto" for i in range(6)]
    with pytest.raises(ValidationError) as exc_info:
        _make_multi_seed_request(seeds=seeds)
    assert "5" in str(exc_info.value)


def test_multi_seed_each_seed_min_10_chars():
    """Deve rejeitar quando qualquer seed tem menos de 10 caracteres."""
    seeds = ["Seed válida com texto suficiente", "curta"]
    with pytest.raises(ValidationError) as exc_info:
        _make_multi_seed_request(seeds=seeds)
    assert "10" in str(exc_info.value)


# ---------------------------------------------------------------------------
# Testes de lógica do motor de simulação
# ---------------------------------------------------------------------------

def test_multi_seed_runs_for_each_seed():
    """3 seeds distintas devem gerar 3 resultados independentes."""
    seeds = [
        "Governo anuncia bloqueio do Pix a partir de segunda-feira",
        "Nova vacina causa efeitos colaterais graves segundo estudo",
        "Ministério da Saúde distribui remédio experimental sem testes",
    ]
    results = []
    for seed in seeds:
        engine = SimulationEngine(num_agents=50, random_seed=42)
        ticks = list(engine.run_ticks())
        results.append(ticks)

    assert len(results) == 3
    for ticks in results:
        assert len(ticks) > 0
        # Cada tick deve conter as chaves SEIR
        assert "S" in ticks[0]
        assert "I" in ticks[0]


def test_multi_seed_returns_risk_scores():
    """Cada resultado deve ter um risk score entre 0 e 100."""
    seeds = [
        "Governo anuncia bloqueio do Pix a partir de segunda-feira",
        "Nova vacina causa efeitos colaterais graves segundo estudo",
        "Ministério da Saúde distribui remédio experimental sem testes",
    ]
    for seed in seeds:
        engine = SimulationEngine(num_agents=50, random_seed=42)
        ticks = list(engine.run_ticks())
        assert ticks, f"Nenhum tick gerado para seed: {seed[:30]}"

        peak = max(ticks, key=lambda t: t["I"])
        first = ticks[0]
        total = first["S"] + first["E"] + first["I"] + first["R"]
        total_reach = (total - ticks[-1]["S"]) / total

        risk = calculate_risk_score(
            num_agents=50,
            peak_infected=peak["I"],
            time_to_peak=peak["tick"],
            total_reach=total_reach,
            total_ticks=len(ticks),
        )

        assert "score" in risk
        assert 0 <= risk["score"] <= 100, f"Score fora do intervalo: {risk['score']}"
        assert risk["label"] in ("Baixo", "Moderado", "Alto", "Crítico")
