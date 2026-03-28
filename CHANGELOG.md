# Changelog — Simulacra

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased] — Dias 14–18

### Adicionado
- **Dia 14**: Perfis regionais brasileiros com multiplicadores de beta (SP +20%, NE +35%, SUL -15%, CO base, N +10%, RJ +15%)
- **Dia 15**: Simulação paralela multi-seed — `POST /simulation/multi`, até 5 seeds simultâneas com `asyncio.gather`
- **Dia 16**: Export de dados — ticks em CSV/JSON, seeds em CSV, relatório em `.md`
- **Dia 17**: Alertas por e-mail — limiar de score configurável, SMTP via variáveis de ambiente
- **Dia 18**: Dashboard comparativo side-by-side — seleciona 2 simulações, gráficos SEIR sincronizados, tabela de métricas diff

---

## [1.0.0] — 2026-03-22

### Adicionado
- Rename completo: DesinfoLab → Simulacra (novo nome, novo posicionamento)
- `backend/agents/risk_scorer.py`: score de risco 0-100 com labels Baixo/Moderado/Alto/Crítico
- Endpoint `POST /simulation/compare`: 5 intervenções rodadas em paralelo, ordenadas por risco
- Endpoint `GET /simulation/{id}/result`: agora inclui `risk` com score, label, cor e descrição
- Página `Compare.jsx`: comparação visual com ResultCards, RiskBadge e curva SEIR expansível
- `backend/tests/test_risk_scorer.py`: 10 testes do risk scorer e endpoint compare
- Toast notifications com 4 tipos (info, success, error, warning) em todas as ações
- ErrorBoundary global para captura de erros React
- SkeletonCard e SkeletonList com animação shimmer
- ColdStartBanner: aviso de hibernação do Render free tier com contador de segundos
- PageLoader: spinner reutilizável com mensagem customizável
- 404 melhorado: mostra caminho atual e contexto sobre simulação expirada
- Dashboard com skeleton loader, status online/offline do servidor e hover nos cards
- Meta tags Open Graph, Twitter Card, favicon 🧪
- Link "Comparar" na Navbar
- Rota `/compare` no App.jsx
- Score de risco exibido na SimulationView após simulação concluída

### Alterado
- Repositório renomeado de `desinfolab` para `simulacra` no GitHub
- Pasta local renomeada de `mirofish-br` para `simulacra`
- Remote git atualizado para `https://github.com/erikgds2/simulacra.git`
- `vite.config.js`: base path alterado para `/simulacra/`
- `frontend/src/App.jsx`: basename atualizado para `/simulacra`
- `backend/database.py`: DB renomeado para `simulacra.db`
- `render.yaml`: service name `simulacra-api`
- FastAPI app: title "Simulacra API", version "1.0.0"
- Health endpoint retorna `app: "Simulacra"` e `version: "1.0.0"`

### Testes
- **74 testes passando** (64 existentes + 10 novos)

---

## [0.9.0] — 2026-03-21

### Adicionado
- Redesign completo — identidade visual "Epidemic Signal" (cyan #06B6D4 + dark navy)
- `frontend/src/index.css`: design system com CSS variables, Inter + JetBrains Mono, grid background
- `Navbar.jsx`: sticky dark navbar com logo cyan, badge BETA, indicador "Sistema ativo"
- `Dashboard.jsx`: hero section, feature cards, histórico redesenhado
- `SeedSelector.jsx`: abas de região (Todas / 🇧🇷 Brasil / 🌍 Internacional) + botão 🌐 PT para tradução via Claude
- `backend/routers/seeds.py`: campo `region` nas 8 fontes RSS, endpoint `POST /seeds/translate`
- Suporte a seeds internacionais: Full Fact, Snopes, FactCheck.org
- `ColdStartBanner.jsx`: aviso de cold start do Render com contador
- Build de produção limpo em Vite

---

## [0.8.0] — 2026-03-20

### Adicionado
- Deploy completo GitHub Pages (`erikgds2.github.io/simulacra`)
- Deploy completo Render (`simulacra-api.onrender.com`)
- `.github/workflows/deploy-frontend.yml`: build + deploy automático
- `frontend/vite.config.js`: loadEnv, base path de produção, manualChunks
- `frontend/src/api.js`: BASE centralizado, helper `apiFetch()`
- `BrowserRouter` com `basename` para GitHub Pages
- CORS configurado com `ALLOWED_ORIGINS` no Render
- `README.md`: documentação open source completa com badges, stack, API reference
- `LICENSE`: MIT 2026
- `CONTRIBUTING.md`: guia de contribuição com checklist
- `CODE_OF_CONDUCT.md`: Contributor Covenant adaptado
- `docs/API.md`: referência completa de endpoints
- `docs/deploy.md` e `docs/deploy-frontend.md`: guias de deploy

---

## [0.7.0] — 2026-03-20

### Adicionado
- Preparação para deploy Render: `Procfile`, `runtime.txt`, `render.yaml`
- `DATA_DIR` para disco persistente (env var configurável)
- Health endpoint com `db_path`, `db_exists`, `environment`
- Lifespan skips `check_env` em ambiente de teste

---

## [0.6.0] — 2026-03-19

### Adicionado
- Suite completa de testes automatizados: 64 testes passando
- `backend/tests/test_simulation_engine.py`: 12 testes do motor SEIR
- `backend/tests/test_data_collector.py`: 10 testes do coletor RSS
- `backend/tests/test_integration.py`: 8 testes end-to-end
- `backend/tests/test_database.py`: 8 testes SQLite CRUD
- `backend/tests/test_production_config.py`: 9 testes de configuração de produção
- `backend/tests/conftest.py`: fixture `init_db()` session-scoped para CI
- `.github/workflows/ci.yml`: CI com pytest + npm build + validate-render-config

---

## [0.5.0] — 2026-03-19

### Adicionado
- `backend/agents/report_agent.py`: Report Agent com Claude API (claude-haiku-4-5)
- `backend/database.py`: tabela `reports`, `save_report()`, `get_report_by_simulation()`, `get_report()`
- `POST /report/generate` e `GET /report/{id}`: endpoints de relatório
- `frontend/src/pages/Report.jsx`: renderização markdown com react-markdown
- Botão "Gerar relatório" na SimulationView
- Cache de relatório: gera uma vez, serve do banco
- Rate limiting por IP com slowapi

---

## [0.4.0] — 2026-03-18

### Adicionado
- `PropagationGraph.jsx`: grafo D3 force-directed com nós coloridos por estado SEIR
- `SimulationView.jsx`: SSE streaming ao vivo via EventSource
- Curva SEIR com Chart.js (react-chartjs-2)
- Métricas: pico infectados, alcance total, tempo ao pico
- Seed coletadas persistidas no SQLite

---

## [0.3.0] — 2026-03-17

### Adicionado
- SSE endpoint `GET /simulation/{id}/stream`: ticks SEIR em tempo real
- `SimulationEngine`: modelo SEIR em grafo Barabási-Albert (NetworkX)
- 4 intervenções: fact_check, removal, counter_narrative, label_warning
- SQLite com WAL mode, tabela `simulations`
- `SeedSelector.jsx`: seleção de seeds coletadas
- Frontend SSE consumer com EventSource

---

## [0.2.0] — 2026-03-17

### Alterado
- Projeto renomeado de `mirofish-br` para `desinfolab`
- Repositório tornado privado
- README reescrito com descrição completa, badges e instruções

### Segurança
- `.gitignore` reforçado para bloquear `.env`, `*.key`, `*.pem`, `secrets/`
- `SECURITY.md` adicionado com checklist e política de credenciais

---

## [0.1.0] — 2026-03-17

### Adicionado
- Setup inicial do projeto (`mirofish-br`)
- Backend: FastAPI + CORS + health endpoint (`GET /health`)
- Modelos Pydantic: `AgentProfile`, `SimulationConfig`, `SimulationResult`
- `DataCollector`: coleta RSS da Agência Lupa e Aos Fatos
- `SimulationEngine`: estrutura inicial SEIR
- `ReportAgent`: relatório em português via Claude claude-haiku-4-5
- Frontend: React 18 + Vite + Chart.js
- Páginas: Dashboard, Simulate, SimulationView (SSE), Report
