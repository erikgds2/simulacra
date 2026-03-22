"""Testes dos multiplicadores regionais do SimulationEngine."""
import pytest
from agents.simulation_engine import SimulationEngine, REGION_MULTIPLIERS, BETA_BASE, INTERVENTION_BETA


def test_region_multipliers_defined():
    expected_regions = {"SP", "NE", "SUL", "CO", "N", "RJ"}
    assert set(REGION_MULTIPLIERS.keys()) == expected_regions


def test_region_multipliers_values():
    assert REGION_MULTIPLIERS["SP"] == pytest.approx(1.20)
    assert REGION_MULTIPLIERS["NE"] == pytest.approx(1.35)
    assert REGION_MULTIPLIERS["SUL"] == pytest.approx(0.85)
    assert REGION_MULTIPLIERS["CO"] == pytest.approx(1.00)
    assert REGION_MULTIPLIERS["N"] == pytest.approx(1.10)
    assert REGION_MULTIPLIERS["RJ"] == pytest.approx(1.15)


def test_no_region_uses_base_beta():
    engine = SimulationEngine(num_agents=50, random_seed=42, intervention=None, region=None)
    assert engine.beta == pytest.approx(BETA_BASE)


def test_co_region_uses_base_beta():
    """Centro-Oeste tem multiplicador 1.0 — deve ser igual ao sem região."""
    engine_none = SimulationEngine(num_agents=50, random_seed=42, intervention=None, region=None)
    engine_co = SimulationEngine(num_agents=50, random_seed=42, intervention=None, region="CO")
    assert engine_co.beta == pytest.approx(engine_none.beta)


def test_ne_region_increases_beta():
    """Nordeste tem multiplicador 1.35 — beta deve ser maior que base."""
    engine = SimulationEngine(num_agents=50, random_seed=42, intervention=None, region="NE")
    assert engine.beta == pytest.approx(BETA_BASE * 1.35)
    assert engine.beta > BETA_BASE


def test_sul_region_decreases_beta():
    """Sul tem multiplicador 0.85 — beta deve ser menor que base."""
    engine = SimulationEngine(num_agents=50, random_seed=42, intervention=None, region="SUL")
    assert engine.beta == pytest.approx(BETA_BASE * 0.85)
    assert engine.beta < BETA_BASE


def test_region_and_intervention_stack():
    """Multiplicador regional aplica sobre o beta já reduzido pela intervenção."""
    engine = SimulationEngine(num_agents=50, random_seed=42, intervention="fact_check", region="NE")
    expected = INTERVENTION_BETA["fact_check"] * REGION_MULTIPLIERS["NE"]
    assert engine.beta == pytest.approx(expected)


def test_ne_spreads_more_than_sul_same_seed():
    """NE deve ter maior propagação que SUL com mesmos parâmetros."""
    engine_ne = SimulationEngine(num_agents=200, random_seed=42, region="NE")
    engine_sul = SimulationEngine(num_agents=200, random_seed=42, region="SUL")
    ticks_ne = list(engine_ne.run_ticks())
    ticks_sul = list(engine_sul.run_ticks())
    max_ne = max(t["I"] for t in ticks_ne)
    max_sul = max(t["I"] for t in ticks_sul)
    assert max_ne >= max_sul, "NE deve ter pico >= SUL com mesmo seed"


def test_region_stored_in_engine():
    for region in REGION_MULTIPLIERS:
        engine = SimulationEngine(num_agents=50, random_seed=42, region=region)
        assert engine.region == region


def test_unknown_region_uses_base_beta():
    """Região desconhecida deve usar multiplicador 1.0."""
    engine = SimulationEngine(num_agents=50, random_seed=42, region="XX")
    assert engine.beta == pytest.approx(BETA_BASE)


def test_all_regions_conserve_population():
    """Simulações com qualquer região devem conservar o total de agentes."""
    for region in REGION_MULTIPLIERS:
        engine = SimulationEngine(num_agents=100, random_seed=42, region=region)
        for tick in engine.run_ticks():
            total = tick["S"] + tick["E"] + tick["I"] + tick["R"]
            assert total == 100, f"Região {region} falhou conservação no tick {tick['tick']}"
