"""Testes da camada SQLite — CRUD de simulações, ticks, seeds e relatórios."""
import uuid
import pytest


def _uid(prefix: str) -> str:
    """Gera ID único para cada execução de teste."""
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def test_save_and_get_simulation():
    from database import get_simulation, save_simulation
    sim_id = _uid("test-sim-db")
    config = {
        "seed_text": "Texto de teste para banco de dados",
        "seed_id": None,
        "num_agents": 50,
        "intervention": None,
        "random_seed": 42,
    }
    save_simulation(sim_id, config)
    result = get_simulation(sim_id)
    assert result is not None
    assert result["id"] == sim_id
    assert result["num_agents"] == 50
    assert result["status"] == "ready"


def test_save_and_get_ticks():
    from database import get_simulation_ticks, save_simulation, save_tick
    sim_id = _uid("test-sim-ticks")
    save_simulation(sim_id, {
        "seed_text": "Texto tick test",
        "seed_id": None,
        "num_agents": 10,
        "intervention": None,
        "random_seed": 1,
    })
    for i in range(1, 6):
        save_tick(sim_id, {"tick": i, "S": 9 - i, "E": i, "I": 0, "R": 0})
    ticks = get_simulation_ticks(sim_id)
    assert len(ticks) == 5
    assert ticks[0]["tick"] == 1
    assert ticks[4]["tick"] == 5


def test_finish_simulation():
    from database import finish_simulation, get_simulation, save_simulation
    sim_id = _uid("test-sim-finish")
    save_simulation(sim_id, {
        "seed_text": "Texto finish test",
        "seed_id": None,
        "num_agents": 20,
        "intervention": "fact_check",
        "random_seed": 7,
    })
    finish_simulation(sim_id, {
        "peak_infected": 8,
        "time_to_peak": 5,
        "total_reach": 0.65,
        "total_ticks": 30,
    })
    result = get_simulation(sim_id)
    assert result["status"] == "finished"
    assert result["peak_infected"] == 8
    assert result["total_reach"] == 0.65


def test_list_simulations():
    from database import list_simulations
    results = list_simulations(limit=5)
    assert isinstance(results, list)
    assert len(results) <= 5


def test_save_seed_to_db():
    from database import count_seeds, save_seed_to_db
    before = count_seeds()
    seed = {
        "id": "test-seed-db-unique-xyz",
        "source": "lupa",
        "source_name": "Agência Lupa",
        "collected_at": "2026-01-01T00:00:00+00:00",
        "title": "Teste de seed no banco",
        "content": "Conteúdo de teste para verificar persistência no SQLite",
        "url": "https://example.com/seed-test-unique-xyz-99999",
        "tags": ["teste"],
        "region_br": "nacional",
    }
    result = save_seed_to_db(seed)
    assert result is True
    after = count_seeds()
    assert after >= before


def test_duplicate_seed_ignored():
    from database import count_seeds, save_seed_to_db
    seed = {
        "id": "test-seed-dup-001",
        "source": "aosfatos",
        "source_name": "Aos Fatos",
        "collected_at": "2026-01-01T00:00:00+00:00",
        "title": "Seed duplicada",
        "content": "Conteúdo que será inserido duas vezes",
        "url": "https://example.com/seed-duplicate-unique-88888",
        "tags": [],
        "region_br": "SP",
    }
    save_seed_to_db(seed)
    before = count_seeds()
    save_seed_to_db(seed)
    after = count_seeds()
    assert after == before


def test_get_simulation_not_found():
    from database import get_simulation
    result = get_simulation("id-que-nao-existe-nunca")
    assert result is None


def test_save_and_get_report():
    from database import (
        finish_simulation,
        get_report,
        get_report_by_simulation,
        save_report,
        save_simulation,
        save_tick,
    )
    sim_id = _uid("test-sim-report-db")
    save_simulation(sim_id, {
        "seed_text": "Texto para relatório de teste",
        "seed_id": None,
        "num_agents": 10,
        "intervention": None,
        "random_seed": 42,
    })
    save_tick(sim_id, {"tick": 1, "S": 9, "E": 0, "I": 1, "R": 0})
    finish_simulation(sim_id, {
        "peak_infected": 1,
        "time_to_peak": 1,
        "total_reach": 0.1,
        "total_ticks": 1,
    })
    report_id = _uid("test-report-db")
    save_report(
        report_id=report_id,
        sim_id=sim_id,
        markdown="## Relatório de teste\n\nConteúdo do relatório.",
        model="claude-haiku-4-5-20251001",
    )
    by_id = get_report(report_id)
    assert by_id is not None
    assert by_id["markdown"] == "## Relatório de teste\n\nConteúdo do relatório."

    by_sim = get_report_by_simulation(sim_id)
    assert by_sim is not None
    assert by_sim["id"] == report_id
