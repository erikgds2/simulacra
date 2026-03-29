"""Configuração global de testes — inicializa o banco antes de qualquer teste."""
import pytest
from database import init_db


@pytest.fixture(autouse=True, scope="session")
def setup_global_db():
    """Garante que todas as tabelas SQLite existem antes de qualquer teste.

    Idempotente: CREATE TABLE IF NOT EXISTS não afeta dados existentes.
    Os testes de test_report.py sobrescrevem DB_PATH via monkeypatch (função-scoped),
    o que é compatível com esta fixture de escopo de sessão.
    """
    init_db()


@pytest.fixture
def client(tmp_path, monkeypatch):
    """TestClient com banco temporário isolado por teste."""
    import database
    db_file = tmp_path / "test.db"
    monkeypatch.setattr(database, "DB_PATH", db_file)
    init_db()
    from fastapi.testclient import TestClient
    from main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture
def finished_simulation(client):
    """Creates and runs a full simulation, returns sim_id."""
    from database import save_simulation, save_tick, finish_simulation
    import uuid
    sim_id = str(uuid.uuid4())
    save_simulation(sim_id, {
        "seed_text": "Texto de teste para simulação",
        "num_agents": 50,
        "intervention": None,
        "random_seed": 42,
        "region": "SP",
        "seed_id": None,
    })
    # Add some ticks
    for i in range(5):
        save_tick(sim_id, {"tick": i, "S": 40-i*5, "E": 5, "I": i*3, "R": i*2})
    finish_simulation(sim_id, {
        "peak_infected": 12,
        "time_to_peak": 4,
        "total_reach": 0.6,
        "total_ticks": 5,
    })
    return sim_id
