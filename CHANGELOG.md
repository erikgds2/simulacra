# Changelog — DesinfoLab

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.2.0] — 2026-03-17

### Alterado
- Projeto renomeado de `mirofish-br` para `desinfolab`
- Repositorio tornado privado
- README reescrito com descricao completa, badges e instrucoes

### Seguranca
- `.gitignore` reforcado para bloquear `.env`, `*.key`, `*.pem`, `secrets/`
- `SECURITY.md` adicionado com checklist e politica de credenciais
- `architecture.md` expandido com diagramas e tabela de decisoes

---

## [0.1.0] — 2026-03-17

### Adicionado
- Setup inicial completo do projeto
- Backend: FastAPI + CORS + health endpoint (`GET /health`)
- Modelos Pydantic: `AgentProfile`, `SimulationConfig`, `SimulationResult`
- `DataCollector`: coleta RSS de Agencia Lupa e Aos Fatos
- `SimulationEngine`: modelo SEIR em grafo Barabasi-Albert
- `ReportAgent`: relatorio em portugues via Claude claude-haiku-4-5
- Frontend: React 18 + Vite + Tailwind CSS + Chart.js + Zustand
- Paginas: Dashboard, Simulate, SimulationView (SSE), Report
- Hook `useSimulationSSE` para streaming de ticks
- Store Zustand para estado global da simulacao
