import anthropic
import os
from typing import List, Optional
from models.simulation import SimulationResult


def generate_report(
    seed_text: str,
    results: List[SimulationResult],
    intervention: Optional[str] = None,
) -> str:
    """Gera relatorio narrativo em portugues usando Claude claude-haiku-4-5."""
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    total_agents = (
        results[0].susceptible + results[0].exposed
        + results[0].infected + results[0].recovered
    ) if results else 0

    peak_infected = max((r.infected for r in results), default=0)
    peak_tick = next((r.tick for r in results if r.infected == peak_infected), 0)
    final = results[-1] if results else None
    total_recovered = final.recovered if final else 0
    intervention_text = (
        f"Intervencao aplicada: {intervention}" if intervention else "Nenhuma intervencao aplicada."
    )

    prompt = f"""Voce e um especialista em desinformacao e saude da informacao no Brasil.
Analise a simulacao de propagacao de desinformacao e gere um relatorio em portugues.

Conteudo simulado:
\"\"\"{seed_text}\"\"\"

Metricas da simulacao SEIR:
- Total de agentes: {total_agents}
- Pico de infectados: {peak_infected} agentes no tick {peak_tick}
- Recuperados ao final: {total_recovered}
- Duracao: {len(results)} ticks
- {intervention_text}

Gere um relatorio com:
1. **Resumo Executivo**
2. **Analise de Propagacao**
3. **Impacto Estimado** no contexto brasileiro
4. **Eficacia da Intervencao** (se aplicavel)
5. **Recomendacoes** (3-5 acoes concretas)"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text
