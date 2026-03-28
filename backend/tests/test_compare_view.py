"""Tests for compare-view logic and regional multipliers."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.simulation_engine import SimulationEngine
from agents.risk_scorer import calculate_risk_score


def _run(agents, seed, region=None, intervention=None):
    engine = SimulationEngine(num_agents=agents, random_seed=seed, region=region, intervention=intervention)
    ticks = list(engine.run_ticks())
    peak = max(ticks, key=lambda t: t["I"])
    first = ticks[0]
    total = first["S"] + first["E"] + first["I"] + first["R"]
    reach = round((total - ticks[-1]["S"]) / total, 3)
    return ticks, peak, reach


def test_two_sims_different_seeds_differ():
    ticks_a, _, _ = _run(80, 1)
    ticks_b, _, _ = _run(80, 2)
    assert ticks_a != ticks_b


def test_risk_score_range():
    ticks, peak, reach = _run(100, 42)
    risk = calculate_risk_score(100, peak["I"], peak["tick"], reach, len(ticks), None)
    assert 0 <= risk["score"] <= 100


def test_intervention_lowers_risk():
    ticks_n, peak_n, reach_n = _run(100, 42)
    ticks_r, peak_r, reach_r = _run(100, 42, intervention="removal")
    risk_n = calculate_risk_score(100, peak_n["I"], peak_n["tick"], reach_n, len(ticks_n), None)
    risk_r = calculate_risk_score(100, peak_r["I"], peak_r["tick"], reach_r, len(ticks_r), "removal")
    assert risk_r["score"] <= risk_n["score"]


def test_ticks_seir_conservation():
    ticks, _, _ = _run(50, 7)
    for t in ticks:
        assert t["S"] + t["E"] + t["I"] + t["R"] == 50


def test_ne_higher_peak_than_sul():
    ticks_ne, peak_ne, _ = _run(100, 42, region="NE")
    ticks_s, peak_s, _ = _run(100, 42, region="SUL")
    assert peak_ne["I"] >= peak_s["I"]
