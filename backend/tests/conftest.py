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
