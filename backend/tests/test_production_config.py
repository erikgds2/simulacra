"""Testes de configuração de produção — Procfile, runtime, envs, render.yaml."""
import os
from pathlib import Path


def test_procfile_exists():
    procfile = Path(__file__).parent.parent / "Procfile"
    assert procfile.exists(), "Procfile não encontrado"


def test_procfile_content():
    procfile = Path(__file__).parent.parent / "Procfile"
    content = procfile.read_text()
    assert "uvicorn" in content
    assert "main:app" in content
    assert "$PORT" in content


def test_runtime_txt_exists():
    runtime = Path(__file__).parent.parent / "runtime.txt"
    assert runtime.exists(), "runtime.txt não encontrado"


def test_runtime_txt_python_version():
    runtime = Path(__file__).parent.parent / "runtime.txt"
    content = runtime.read_text().strip()
    assert content.startswith("python-3.11"), f"Versão inesperada: {content}"


def test_requirements_has_all_deps():
    req = Path(__file__).parent.parent / "requirements.txt"
    content = req.read_text().lower()
    required = [
        "fastapi", "uvicorn", "httpx", "feedparser",
        "pydantic", "python-dotenv", "anthropic",
        "networkx", "numpy", "slowapi", "bleach",
        "aiosqlite",
    ]
    for dep in required:
        assert dep in content, f"Dependência ausente: {dep}"


def test_env_example_has_all_vars():
    env_example = Path(__file__).parent.parent / ".env.example"
    content = env_example.read_text()
    required_vars = [
        "ANTHROPIC_API_KEY",
        "ALLOWED_ORIGINS",
        "ENVIRONMENT",
        "DATA_DIR",
    ]
    for var in required_vars:
        assert var in content, f"Variável ausente no .env.example: {var}"


def test_data_dir_env_fallback():
    original = os.environ.pop("DATA_DIR", None)
    try:
        import importlib
        import database
        importlib.reload(database)
        assert database._DATA_DIR is not None
    finally:
        if original:
            os.environ["DATA_DIR"] = original
        import importlib
        import database
        importlib.reload(database)


def test_render_yaml_exists():
    render_yaml = Path(__file__).parent.parent.parent / "render.yaml"
    assert render_yaml.exists(), "render.yaml não encontrado na raiz"


def test_gitignore_excludes_secrets():
    gitignore = Path(__file__).parent.parent.parent / ".gitignore"
    assert gitignore.exists(), ".gitignore não encontrado"
    content = gitignore.read_text()
    must_ignore = [".env", "*.db"]
    for pattern in must_ignore:
        assert pattern in content, f"Padrão não ignorado no .gitignore: {pattern}"
