# Arquitetura MiroFish-BR

## Os 5 Agentes

1. **DataCollector** — Busca checagens de fatos via RSS (Lupa, Aos Fatos) com httpx + feedparser
2. **SimulationEngine** — Executa modelo SEIR em grafo Barabasi-Albert (escala livre, realista)
3. **InterventionAgent** — (planejado) Aplica estrategias de mitigacao dinamicamente por tick
4. **ReportAgent** — Gera relatorio narrativo em portugues usando Claude claude-haiku-4-5
5. **MonitorAgent** — (planejado) Transmite estado da simulacao via SSE para o frontend

## As 5 Fases

```
COLETA ──► GRAFO ──► SIMULACAO ──► INTERVENCAO ──► RELATORIO
  |           |           |               |               |
RSS feeds  Barabasi-   SEIR ticks    fact_check/      Claude
feedparser  Albert(N,3) por tick     label/remove   claude-haiku-4-5
```

## Parametros SEIR

| Parametro | Valor | Significado |
|---|---|---|
| beta  | 0.30 | Taxa de transmissao por contato infectado |
| sigma | 0.20 | Taxa de transicao Exposto -> Infectado |
| gamma | 0.10 | Taxa de recuperacao Infectado -> Recuperado |

## Decisoes de Design

- **Barabasi-Albert**: redes sociais seguem lei de potencia — poucos influenciadores, muitos seguidores
- **SEIR vs SIR**: estado Exposto modela o delay entre ver e compartilhar desinformacao
- **claude-haiku-4-5**: rapido, economico, suficiente para relatorios em portugues
- **SSE vs WebSocket**: unidirecional e mais simples para streaming de ticks de simulacao
