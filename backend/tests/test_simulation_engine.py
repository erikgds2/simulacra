"""Testes do SimulationEngine SEIR com grafo Barabási-Albert."""
import pytest
from agents.simulation_engine import SimulationEngine


def test_engine_creates_graph():
    engine = SimulationEngine(num_agents=50, random_seed=42)
    assert engine.graph.number_of_nodes() == 50
    assert engine.graph.number_of_edges() > 0


def test_engine_initial_state():
    engine = SimulationEngine(num_agents=50, random_seed=42)
    states = list(engine.states.values())
    assert states.count("I") == 1
    assert states.count("S") == 49
    assert states.count("E") == 0
    assert states.count("R") == 0


def test_engine_run_ticks_yields_dicts():
    engine = SimulationEngine(num_agents=50, random_seed=42)
    ticks = list(engine.run_ticks())
    assert len(ticks) > 0
    for tick in ticks:
        assert "tick" in tick
        assert "S" in tick
        assert "E" in tick
        assert "I" in tick
        assert "R" in tick


def test_engine_conservation():
    engine = SimulationEngine(num_agents=100, random_seed=42)
    for tick in engine.run_ticks():
        total = tick["S"] + tick["E"] + tick["I"] + tick["R"]
        assert total == 100, f"Tick {tick['tick']}: total {total} != 100"


def test_engine_tick_numbers_sequential():
    engine = SimulationEngine(num_agents=50, random_seed=42)
    ticks = list(engine.run_ticks())
    for i, tick in enumerate(ticks):
        assert tick["tick"] == i + 1


def test_engine_propagation_happens():
    engine = SimulationEngine(num_agents=100, random_seed=42)
    ticks = list(engine.run_ticks())
    max_infected = max(t["I"] for t in ticks)
    assert max_infected > 1, "Propagação não aconteceu"


def test_engine_reproducibility():
    # Criar e rodar sequencialmente para não contaminar estado global do random
    engine1 = SimulationEngine(num_agents=100, random_seed=42)
    ticks1 = list(engine1.run_ticks())

    engine2 = SimulationEngine(num_agents=100, random_seed=42)
    ticks2 = list(engine2.run_ticks())

    assert ticks1 == ticks2, "Simulações com mesmo seed devem ser idênticas"


def test_engine_different_seeds_differ():
    engine1 = SimulationEngine(num_agents=100, random_seed=1)
    engine2 = SimulationEngine(num_agents=100, random_seed=2)
    ticks1 = list(engine1.run_ticks())
    ticks2 = list(engine2.run_ticks())
    assert ticks1 != ticks2, "Seeds diferentes devem produzir resultados diferentes"


def test_engine_intervention_fact_check_reduces_spread():
    engine_no_int = SimulationEngine(num_agents=200, random_seed=42, intervention=None)
    engine_fact = SimulationEngine(num_agents=200, random_seed=42, intervention="fact_check")
    ticks_no = list(engine_no_int.run_ticks())
    ticks_fc = list(engine_fact.run_ticks())
    max_no = max(t["I"] for t in ticks_no)
    max_fc = max(t["I"] for t in ticks_fc)
    assert max_fc <= max_no, "Fact-check deve reduzir ou manter o pico de infectados"


def test_engine_intervention_removal_most_effective():
    engine_removal = SimulationEngine(num_agents=200, random_seed=42, intervention="removal")
    engine_none = SimulationEngine(num_agents=200, random_seed=42, intervention=None)
    ticks_r = list(engine_removal.run_ticks())
    ticks_n = list(engine_none.run_ticks())
    reach_r = ticks_r[-1]["R"] + ticks_r[-1]["I"] + ticks_r[-1]["E"]
    reach_n = ticks_n[-1]["R"] + ticks_n[-1]["I"] + ticks_n[-1]["E"]
    assert reach_r <= reach_n, "Remoção deve reduzir ou manter o alcance"


def test_engine_run_method_returns_dict():
    engine = SimulationEngine(num_agents=50, random_seed=42)
    result = engine.run()
    assert "ticks" in result
    assert "peak_infected" in result
    assert "time_to_peak" in result
    assert result["peak_infected"] >= 1
    assert result["time_to_peak"] >= 1


def test_engine_max_ticks_respected():
    engine = SimulationEngine(num_agents=50, random_seed=42)
    ticks = list(engine.run_ticks(max_ticks=10))
    assert len(ticks) <= 10
