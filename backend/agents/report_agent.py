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


REGION_NAMES = {
    "SP": "São Paulo",
    "NE": "Nordeste",
    "SUL": "Sul",
    "CO": "Centro-Oeste",
    "N": "Norte",
    "RJ": "Rio de Janeiro",
}

REGION_MULTIPLIERS = {
    "SP": 1.20,
    "NE": 1.35,
    "SUL": 0.85,
    "CO": 1.00,
    "N": 1.10,
    "RJ": 1.15,
}


def _build_prompt(sim: dict, ticks: list[dict]) -> str:
    num_agents = sim["num_agents"]
    seed_text = sim["seed_text"]
    peak_infected = sim.get("peak_infected") or 0
    time_to_peak = sim.get("time_to_peak") or 0
    total_reach_pct = round((sim.get("total_reach") or 0) * 100, 1)
    total_ticks = sim.get("total_ticks") or len(ticks)
    intervention = sim.get("intervention") or "Nenhuma"
    region_code = sim.get("region")
    region_name = REGION_NAMES.get(region_code, "Brasil (sem região específica)") if region_code else "Brasil (sem região específica)"
    region_multiplier = REGION_MULTIPLIERS.get(region_code, 1.0) if region_code else 1.0
    curve_table = _build_curve_sample(ticks)

    region_context = f"- Região simulada: {region_name} (multiplicador de propagação: {region_multiplier:.2f}x)\n" if region_code else ""

    return f"""Você é um especialista sênior em desinformação e comunicação no Brasil.
Analise os dados desta simulação SEIR de propagação de desinformação e escreva um relatório completo em português brasileiro.

## Conteúdo Simulado
\"\"\"{seed_text}\"\"\"

## Parâmetros da Simulação
- Total de agentes na rede: {num_agents}
{region_context}- Intervenção aplicada: {intervention}
- Duração total: {total_ticks} ticks

## Métricas de Propagação
- Pico de infectados: {peak_infected} agentes (tick {time_to_peak})
- Alcance total (% recuperados): {total_reach_pct}%

## Amostra da Curva SEIR
{curve_table}

## Estrutura do Relatório
Produza o relatório **em markdown** com exatamente estas seções:

# Relatório de Propagação — Simulacra

## 1. Resumo Executivo
(2-3 parágrafos objetivos sobre o que foi simulado e os principais achados)

## 2. Análise de Propagação
(Explicação técnica da curva SEIR: velocidade de contágio, pico, fase de recuperação)

## 3. Impacto Estimado no Contexto Brasileiro
(Como esta desinformação afetaria a sociedade brasileira — especialmente na região {region_name}, considerando plataformas locais, grupos vulneráveis e características regionais)

## 4. Eficácia da Intervenção
(Avalie a intervenção "{intervention}" — se "Nenhuma", discuta o cenário sem intervenção e seus riscos)

## 5. Recomendações
(Lista de 4-5 ações concretas para reduzir propagação, voltadas a: plataformas digitais, agências de fact-checking, governo e usuários finais)

---
*Relatório gerado automaticamente pelo Simulacra · Modelo: {MODEL}*"""


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


MODEL_ADVANCED = "claude-sonnet-4-6"


def _build_prompt_advanced(sim: dict, ticks: list[dict]) -> str:
    """Prompt enriquecido para o agente avançado com web_search."""
    base = _build_prompt(sim, ticks)
    # Replace the last line (footer) and add web_search instructions
    base = base.rsplit("*Relatório gerado", 1)[0]
    region_code = sim.get("region")
    region_name = REGION_NAMES.get(region_code, "Brasil") if region_code else "Brasil"
    return base + f"""
## 6. Contexto Real e Dados Atualizados (use web_search)
Use a ferramenta web_search para buscar:
1. Casos reais recentes de desinformação similares ao texto simulado no Brasil
2. Dados atuais de uso de redes sociais no Brasil (especialmente na região {region_name})
3. Eficácia documentada de intervenções contra desinformação

Incorpore os dados encontrados nas seções anteriores, citando as fontes.

---
*Relatório gerado automaticamente pelo Simulacra · Modelo: {MODEL_ADVANCED} (web-enhanced)*"""


def generate_report_advanced(sim_id: str, use_web_search: bool = True) -> dict:
    """Gera relatório avançado usando Claude Sonnet com web_search.

    Returns:
        dict com chaves: report_id, simulation_id, markdown, model, created_at, cached
    """
    env = os.getenv("ENVIRONMENT", "development")
    if env == "test":
        raise ValueError("Agente avançado desabilitado em ambiente de teste.")

    # Cache check — chave separada do relatório básico
    from database import get_connection
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM reports WHERE simulation_id = ? AND model = ?",
            (sim_id, MODEL_ADVANCED),
        ).fetchone()
        if row:
            return {**dict(row), "cached": True}
    finally:
        conn.close()

    sim = get_simulation(sim_id)
    if not sim:
        raise ValueError(f"Simulação '{sim_id}' não encontrada.")
    if sim["status"] != "finished":
        raise ValueError(
            f"Simulação '{sim_id}' ainda não concluída (status: {sim['status']})."
        )

    ticks = get_simulation_ticks(sim_id)
    prompt = _build_prompt_advanced(sim, ticks)

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    tools = []
    if use_web_search:
        tools = [{"type": "web_search_20250305", "name": "web_search"}]

    messages = [{"role": "user", "content": prompt}]
    full_text = ""

    # Agentic loop — resolve tool calls until text response
    for _ in range(6):  # max 6 turns
        kwargs = {
            "model": MODEL_ADVANCED,
            "max_tokens": 3000,
            "messages": messages,
        }
        if tools:
            kwargs["tools"] = tools

        response = client.messages.create(**kwargs)

        # Collect text blocks
        for block in response.content:
            if hasattr(block, "text"):
                full_text += block.text

        if response.stop_reason == "end_turn":
            break

        # Handle tool use
        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    # web_search results are returned by the API itself
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": "Pesquisa realizada.",
                    })
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
        else:
            break

    if not full_text.strip():
        full_text = "Relatório avançado não pôde ser gerado."

    report_id = str(uuid.uuid4())
    save_report(report_id, sim_id, full_text, MODEL_ADVANCED)

    from database import get_connection
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM reports WHERE id = ?", (report_id,)
        ).fetchone()
        return {**dict(row), "cached": False}
    finally:
        conn.close()
