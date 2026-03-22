# Arquitetura Simulacra

## Visao Geral

```
┌─────────────────────────────────────────────────────────┐
│                     SIMULACRA                           │
│                                                         │
│  ┌──────────┐    ┌────────────┐    ┌─────────────────┐ │
│  │  React   │◄──►│  FastAPI   │◄──►│  Agentes Python │ │
│  │  + Vite  │SSE │  Backend   │    │  (swarm)        │ │
│  └──────────┘    └────────────┘    └─────────────────┘ │
│                        │                    │           │
│                   Pydantic v2          NetworkX/NumPy   │
│                   + dotenv             + Claude API     │
└─────────────────────────────────────────────────────────┘
```

## Os 5 Agentes

### 1. DataCollector (`agents/data_collector.py`)
Coleta seeds de fact-checkers brasileiros via RSS.
- **Fontes**: Agencia Lupa, Aos Fatos
- **Libs**: httpx (async), feedparser
- **Output**: lista de dicts {source, title, summary, link, published}

### 2. SimulationEngine (`agents/simulation_engine.py`)
Motor principal de simulacao epidemiologica SEIR em grafo de rede social.
- **Grafo**: Barabasi-Albert (escala livre — modela influenciadores)
- **Modelo**: SEIR com parametros beta=0.3, sigma=0.2, gamma=0.1
- **Intervencao**: pode acelerar recuperacao de nos infectados
- **Output**: lista de SimulationResult por tick

### 3. InterventionAgent _(planejado)_
Avalia metricas em tempo real e aplica intervencoes automaticas.
- **Tipos**: fact-check (reduz credibilidade), label (reduz beta), remove (isola no)

### 4. ReportAgent (`agents/report_agent.py`)
Gera relatorio narrativo em portugues via Claude claude-haiku-4-5.
- **Input**: seed_text + metricas agregadas da simulacao
- **Output**: Markdown com Resumo, Analise, Impacto, Recomendacoes

### 5. MonitorAgent _(planejado)_
Transmite estado tick-a-tick para o frontend via SSE.
- **Protocolo**: Server-Sent Events (EventSource)

---

## As 5 Fases

```
FASE 1       FASE 2         FASE 3          FASE 4         FASE 5
COLETA  ──►  GRAFO    ──►  SIMULACAO  ──►  INTERVENCAO ──► RELATORIO
  |            |               |                |               |
RSS feeds   Barabasi-      SEIR ticks       fact_check/     Claude API
feedparser  Albert(N,3)    por tick          label/remove   claude-haiku-4-5
```

---

## Modelo SEIR

```
S (Suscetivel) ──beta──► E (Exposto) ──sigma──► I (Infectado) ──gamma──► R (Recuperado)
```

| Parametro | Valor | Significado |
|---|---|---|
| beta  | 0.30 | Prob. de transmissao por contato infectado |
| sigma | 0.20 | Prob. de E virar I por tick |
| gamma | 0.10 | Prob. de recuperacao por tick |

A probabilidade real de infeccao por tick e `1 - (1-beta)^k`, onde k = numero de vizinhos infectados.

---

## Decisoes de Design

| Decisao | Alternativa descartada | Motivo |
|---|---|---|
| Barabasi-Albert | Erdos-Renyi | Redes sociais reais sao livres de escala |
| SEIR | SIR | Modela delay real entre ver e compartilhar |
| Claude claude-haiku-4-5 | GPT-3.5 / Gemini Flash | Custo zero com credito inicial, melhor portugues |
| SSE | WebSocket | Unidirecional, mais simples para streaming de ticks |
| FastAPI | Flask / Django | Async nativo, Pydantic v2, Swagger automatico |
