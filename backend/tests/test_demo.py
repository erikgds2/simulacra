import pytest
from pathlib import Path


def test_demo_script_exists():
    script = Path(__file__).parent.parent / "cases" / "run_demo.py"
    assert script.exists(), "run_demo.py não encontrado"


def test_caso_real_json_exists():
    caso = Path(__file__).parent.parent / "cases" / "caso_real_01.json"
    assert caso.exists(), "caso_real_01.json não encontrado"


def test_caso_real_json_valid():
    import json
    caso = Path(__file__).parent.parent / "cases" / "caso_real_01.json"
    data = json.loads(caso.read_text(encoding="utf-8"))
    assert "seed_text" in data
    assert len(data["seed_text"]) >= 10
    assert "categoria" in data


def test_risk_scorer_with_demo_params():
    from agents.risk_scorer import calculate_risk_score
    result = calculate_risk_score(
        num_agents=200,
        peak_infected=80,
        time_to_peak=8,
        total_reach=0.75,
        total_ticks=30,
        intervention=None,
    )
    assert result["score"] > 50
    assert result["label"] in ["Alto", "Crítico"]


def test_simulation_engine_demo_seed():
    from agents.simulation_engine import SimulationEngine
    engine = SimulationEngine(num_agents=50, random_seed=42)
    ticks = list(engine.run_ticks())
    assert len(ticks) > 0
    max_infected = max(t["I"] for t in ticks)
    assert max_infected >= 1


def test_compare_all_interventions_demo():
    from agents.simulation_engine import SimulationEngine
    from agents.risk_scorer import calculate_risk_score
    interventions = [None, "fact_check", "removal", "counter_narrative", "label_warning"]
    scores = []
    for intervention in interventions:
        engine = SimulationEngine(num_agents=50, random_seed=42, intervention=intervention)
        ticks = list(engine.run_ticks())
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
            intervention=intervention,
        )
        scores.append(risk["score"])
    assert len(scores) == 5
