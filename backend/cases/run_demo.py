"""
Simulacra — Demo reproduzível
Reproduz o caso de uso real publicado no lançamento do projeto.

Uso:
    cd backend
    python cases/run_demo.py

Requer:
    - ANTHROPIC_API_KEY no .env
    - pip install -r requirements.txt
"""
import json
import sys
import asyncio
import uuid
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from agents.simulation_engine import SimulationEngine
from agents.risk_scorer import calculate_risk_score, risk_label_description
from agents.report_agent import generate_report
from database import init_db, save_simulation, save_tick, finish_simulation

SEED_TEXT = (
    "URGENTE: Banco Central suspende operações do Pix por falha de segurança. "
    "Transações acima de R$ 500 estão bloqueadas até segunda-feira. "
    "Usuários relatam dinheiro desaparecendo das contas. Migre seu dinheiro "
    "para outro banco imediatamente. Compartilhe antes que apaguem."
)

INTERVENTIONS = [
    (None,                "Sem intervenção"),
    ("fact_check",        "Fact-check"),
    ("removal",           "Remoção"),
    ("counter_narrative", "Contra-narrativa"),
    ("label_warning",     "Aviso de rótulo"),
]


def run_simulation(intervention, label, num_agents=200, seed=42):
    print(f"  Rodando: {label}...")
    engine = SimulationEngine(
        num_agents=num_agents,
        intervention=intervention,
        random_seed=seed,
    )
    ticks = list(engine.run_ticks())
    peak = max(ticks, key=lambda t: t["I"])
    first = ticks[0]
    total = first["S"] + first["E"] + first["I"] + first["R"]
    total_reach = round((total - ticks[-1]["S"]) / total, 3)

    risk = calculate_risk_score(
        num_agents=num_agents,
        peak_infected=peak["I"],
        time_to_peak=peak["tick"],
        total_reach=total_reach,
        total_ticks=len(ticks),
        intervention=intervention,
    )
    return {
        "label": label,
        "intervention": intervention,
        "peak_infected": peak["I"],
        "peak_pct": round(peak["I"] / num_agents * 100, 1),
        "time_to_peak": peak["tick"],
        "total_reach_pct": round(total_reach * 100, 1),
        "risk_score": risk["score"],
        "risk_label": risk["label"],
        "risk_color": risk["color"],
        "ticks": ticks,
    }


async def run_demo():
    print("=" * 60)
    print("  SIMULACRA — Demo reproduzível")
    print("=" * 60)
    print(f"\nSeed: {SEED_TEXT[:80]}...")
    print("\n1. Rodando comparação de intervenções (200 agentes)...\n")

    results = []
    for intervention, label in INTERVENTIONS:
        r = run_simulation(intervention, label)
        results.append(r)

    results.sort(key=lambda r: r["risk_score"])

    print("\n" + "=" * 60)
    print("  RESULTADOS — Ordenados por score de risco")
    print("=" * 60)
    print(f"\n{'Intervenção':<22} {'Score':<8} {'Label':<12} {'Pico':<8} {'Alcance'}")
    print("-" * 60)
    for r in results:
        print(
            f"{r['label']:<22} {r['risk_score']:<8} {r['risk_label']:<12} "
            f"{r['peak_pct']}%{'':<4} {r['total_reach_pct']}%"
        )

    best = results[0]
    worst = next(r for r in results if r["label"] == "Sem intervenção")
    reducao = round((1 - best["risk_score"] / max(worst["risk_score"], 1)) * 100)

    print(f"\n[OK] Melhor intervencao: {best['label']} (score: {best['risk_score']})")
    print(f"[--] Sem intervencao:    score {worst['risk_score']}")
    print(f"\n[>>] {best['label']} reduz o risco em {reducao}% vs. sem intervencao")

    # Save results
    results_export = {
        "seed": SEED_TEXT,
        "num_agents": 200,
        "random_seed": 42,
        "best_intervention": best["label"],
        "worst_intervention": worst["label"],
        "risk_reduction_pct": reducao,
        "results": [
            {k: v for k, v in r.items() if k != "ticks"}
            for r in results
        ],
    }
    results_path = Path(__file__).parent / "resultados_demo.json"
    results_path.write_text(
        json.dumps(results_export, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\n[OK] Resultados salvos em: {results_path}")

    print("\n2. Gerando relatório analítico via Claude API...")
    init_db()

    sim_id = str(uuid.uuid4())
    no_intervention = next(r for r in results if r["label"] == "Sem intervenção")

    save_simulation(sim_id, {
        "seed_text": SEED_TEXT,
        "seed_id": None,
        "num_agents": 200,
        "intervention": None,
        "random_seed": 42,
    })

    for tick in no_intervention["ticks"]:
        save_tick(sim_id, tick)

    total_reach = no_intervention["total_reach_pct"] / 100
    finish_simulation(sim_id, {
        "peak_infected": no_intervention["peak_infected"],
        "time_to_peak": no_intervention["time_to_peak"],
        "total_reach": total_reach,
        "total_ticks": len(no_intervention["ticks"]),
    })

    try:
        report = await asyncio.get_event_loop().run_in_executor(None, generate_report, sim_id)
        output_path = Path(__file__).parent / "relatorio_demo.md"
        output_path.write_text(report["markdown"], encoding="utf-8")
        print(f"[OK] Relatorio salvo em: {output_path}")
        print("\n--- PRÉVIA DO RELATÓRIO ---")
        print(report["markdown"][:800] + "...\n")
    except Exception as e:
        print(f"[!!] Relatorio nao gerado: {e}")
        print("   Verifique ANTHROPIC_API_KEY no .env")

    print("=" * 60)
    print("  Demo concluído.")
    print(f"  Veja o projeto: https://github.com/erikgds2/simulacra")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_demo())
