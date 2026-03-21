import os
import uuid

import anthropic

from database import (
    get_report_by_simulation,
    get_simulation,
    get_simulation_ticks,
    save_report,
)

MODEL = "claude-haiku-4-5-20251001"


def _build_curve_sample(ticks: list[dict], n: int = 5) -> str:
    """Retorna tabela markdown com n ticks equidistantes da curva SEIR."""
    if not ticks:
        return "Sem dados de curva disponíveis."
    step = max(1, len(ticks) // n)
    sample = ticks[::step][:n]
    header = "| Tick | S | E | I | R |\n|------|---|---|---|---|"
    rows = "\n".join(
        f"| {t['tick']} | {t['S']} | {t['E']} | {t['I']} | {t['R']} |"
        for t in sample
    )
    return f"{header}\n{rows}"


def _build_prompt(sim: dict, ticks: list[dict]) -> str:
    num_agents = sim["num_agents"]
    seed_text = sim["seed_text"]
    peak_infected = sim.get("peak_infected") or 0
    time_to_peak = sim.get("time_to_peak") or 0
    total_reach_pct = round((sim.get("total_reach") or 0) * 100, 1)
    total_ticks = sim.get("total_ticks") or len(ticks)
    intervention = sim.get("intervention") or "Nenhuma"
    curve_table = _build_curve_sample(ticks)

    return f"""Você é um especialista sênior em desinformação e comunicação no Brasil.
Analise os dados desta simulação SEIR de propagação de desinformação e escreva um relatório completo em português brasileiro.

## Conteúdo Simulado
\"\"\"{seed_text}\"\"\"

## Parâmetros da Simulação
- Total de agentes na rede: {num_agents}
- Intervenção aplicada: {intervention}
- Duração total: {total_ticks} ticks

## Métricas de Propagação
- Pico de infectados: {peak_infected} agentes (tick {time_to_peak})
- Alcance total (% recuperados): {total_reach_pct}%

## Amostra da Curva SEIR
{curve_table}

## Estrutura do Relatório
Produza o relatório **em markdown** com exatamente estas seções:

# Relatório de Propagação — DesinfoLab

## 1. Resumo Executivo
(2-3 parágrafos objetivos sobre o que foi simulado e os principais achados)

## 2. Análise de Propagação
(Explicação técnica da curva SEIR: velocidade de contágio, pico, fase de recuperação)

## 3. Impacto Estimado no Contexto Brasileiro
(Como esta desinformação afetaria a sociedade brasileira — plataformas, regiões, grupos vulneráveis)

## 4. Eficácia da Intervenção
(Avalie a intervenção "{intervention}" — se "Nenhuma", discuta o cenário sem intervenção e seus riscos)

## 5. Recomendações
(Lista de 4-5 ações concretas para reduzir propagação, voltadas a: plataformas digitais, agências de fact-checking, governo e usuários finais)

---
*Relatório gerado automaticamente pelo DesinfoLab · Modelo: {MODEL}*"""


def generate_report(sim_id: str) -> dict:
    """Gera ou retorna do cache o relatório de uma simulação.

    Returns:
        dict com chaves: report_id, simulation_id, markdown, model, created_at, cached
    """
    # Cache check
    cached = get_report_by_simulation(sim_id)
    if cached:
        return {**cached, "cached": True}

    sim = get_simulation(sim_id)
    if not sim:
        raise ValueError(f"Simulação '{sim_id}' não encontrada.")
    if sim["status"] != "finished":
        raise ValueError(
            f"Simulação '{sim_id}' ainda não concluída (status: {sim['status']})."
        )

    ticks = get_simulation_ticks(sim_id)
    prompt = _build_prompt(sim, ticks)

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    message = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    markdown = message.content[0].text

    report_id = str(uuid.uuid4())
    save_report(report_id, sim_id, markdown, MODEL)

    report = get_report_by_simulation(sim_id)
    return {**report, "cached": False}
