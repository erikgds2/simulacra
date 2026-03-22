"""
Rode antes de subir o servidor para verificar se tudo está configurado.
Uso: python check_env.py
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

CHECKS = [
    {
        "var": "ANTHROPIC_API_KEY",
        "required": True,
        "hint": "Obtenha em https://console.anthropic.com/settings/keys",
        "validate": lambda v: v.startswith("sk-ant-"),
        "validate_msg": "deve comecar com 'sk-ant-'",
    },
    {
        "var": "ALLOWED_ORIGINS",
        "required": False,
        "hint": "Default: http://localhost:5173",
        "validate": None,
    },
    {
        "var": "ENVIRONMENT",
        "required": False,
        "hint": "Use 'development' ou 'production'",
        "validate": lambda v: v in ("development", "production"),
        "validate_msg": "deve ser 'development' ou 'production'",
    },
]

errors = []
warnings = []

print("\nSimulacra -- verificacao de ambiente\n")

for check in CHECKS:
    var = check["var"]
    value = os.getenv(var, "").strip()
    ok_icon = "OK" if value else ("ERRO" if check["required"] else "AVISO")
    label = f"  [{ok_icon}] {var}"

    if not value:
        if check["required"]:
            errors.append(f"{var} -- {check['hint']}")
            print(f"{label} -> AUSENTE")
        else:
            warnings.append(var)
            print(f"{label} -> nao definida (opcional)")
        continue

    validate = check.get("validate")
    if validate and not validate(value):
        msg = check.get("validate_msg", "valor invalido")
        errors.append(f"{var} -- {msg}")
        print(f"{label} -> INVALIDA ({msg})")
    else:
        masked = value[:8] + "***" if len(value) > 8 else "***"
        print(f"{label} -> {masked}")

print()

if errors:
    print("Erros encontrados -- corrija antes de subir o servidor:\n")
    for e in errors:
        print(f"   * {e}")
    print()
    sys.exit(1)

if warnings:
    print(f"Aviso: {len(warnings)} variavel(is) opcional(is) nao definida(s): {', '.join(warnings)}")
    print()

env_file = Path(".env")
if not env_file.exists():
    print("Aviso: arquivo .env nao encontrado -- copie .env.example para .env\n")

print("Ambiente OK -- pode subir o servidor\n")
