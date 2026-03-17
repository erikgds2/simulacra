"""Script de validacao de ambiente — execute antes de subir o servidor.

Uso:
    python check_env.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

OBRIGATORIAS = ["ANTHROPIC_API_KEY"]
OPCIONAIS = ["TWITTER_BEARER_TOKEN", "DATABASE_URL", "ENVIRONMENT"]

erros: list[str] = []
avisos: list[str] = []

print("=" * 50)
print("DesinfoLab — Validacao de Ambiente")
print("=" * 50)

for var in OBRIGATORIAS:
    valor = os.environ.get(var, "")
    if not valor or valor.startswith("sk-ant-coloque") or valor.strip() == "":
        erros.append(f"  ERRO: {var} nao configurada ou com valor placeholder")
    else:
        print(f"  OK: {var} = {valor[:8]}...")

for var in OPCIONAIS:
    valor = os.environ.get(var, "")
    if not valor:
        avisos.append(f"  AVISO: {var} nao configurada (opcional)")
    else:
        print(f"  OK: {var} = {valor[:20]}...")

print()

if avisos:
    for a in avisos:
        print(a)
    print()

if erros:
    for e in erros:
        print(e)
    print()
    print("Configure o arquivo .env antes de iniciar o servidor.")
    print("Copie .env.example para .env e preencha os valores.")
    sys.exit(1)

print("Ambiente OK — pode iniciar com: uvicorn main:app --reload")
