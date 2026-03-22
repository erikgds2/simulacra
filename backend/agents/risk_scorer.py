"""
Risk Scorer — Simulacra
Calcula score de risco 0-100 a partir das métricas SEIR de uma simulação.

Score = f(velocidade de propagação, pico relativo, alcance total, tempo ao pico)

Labels:
  0-25  → Baixo     (propagação lenta, alcance limitado)
  26-50 → Moderado  (propagação controlável)
  51-75 → Alto      (propagação significativa, intervenção recomendada)
  76-100 → Crítico  (propagação viral, ação imediata necessária)
"""
from typing import Optional


def calculate_risk_score(
    num_agents: int,
    peak_infected: int,
    time_to_peak: int,
    total_reach: float,
    total_ticks: int,
    intervention: Optional[str] = None,
) -> dict:
    if num_agents == 0 or total_ticks == 0:
        return {"score": 0, "label": "Baixo", "color": "#34d399", "factors": {}}

    peak_ratio = peak_infected / num_agents
    speed = 1.0 - (time_to_peak / max(total_ticks, 1))
    reach = total_reach

    score_raw = (
        peak_ratio  * 40 +
        speed       * 35 +
        reach       * 25
    )

    score = max(0, min(100, round(score_raw)))

    if intervention:
        discount = {
            "removal":           0.20,
            "fact_check":        0.30,
            "counter_narrative": 0.40,
            "label_warning":     0.50,
        }.get(intervention, 1.0)
        score = round(score * discount)

    if score <= 25:
        label, color = "Baixo", "#34d399"
    elif score <= 50:
        label, color = "Moderado", "#fbbf24"
    elif score <= 75:
        label, color = "Alto", "#f97316"
    else:
        label, color = "Crítico", "#f87171"

    return {
        "score": score,
        "label": label,
        "color": color,
        "factors": {
            "peak_ratio":  round(peak_ratio, 3),
            "speed_index": round(speed, 3),
            "reach_index": round(reach, 3),
        },
    }


def risk_label_description(label: str) -> str:
    return {
        "Baixo":    "Propagação lenta e alcance limitado. Monitoramento suficiente.",
        "Moderado": "Propagação controlável. Intervenção preventiva recomendada.",
        "Alto":     "Propagação significativa. Intervenção imediata recomendada.",
        "Crítico":  "Propagação viral. Ação coordenada urgente necessária.",
    }.get(label, "")
