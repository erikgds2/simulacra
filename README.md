# Simulacra

[![CI](https://github.com/erikgds2/simulacra/actions/workflows/ci.yml/badge.svg)](https://github.com/erikgds2/simulacra/actions/workflows/ci.yml)
[![Deploy](https://github.com/erikgds2/simulacra/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/erikgds2/simulacra/actions/workflows/deploy-frontend.yml)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Custo](https://img.shields.io/badge/Infraestrutura-Zero%20Cost-brightgreen)](https://render.com)

> **Motor de simulação de comportamento coletivo para o Brasil.**
> Simule como informações se propagam em redes sociais, teste intervenções e receba relatórios analíticos em português gerados por IA.

**Demo:** https://erikgds2.github.io/simulacra/
**API:** https://desinfolab.onrender.com/docs

---

## Resultado real

**Caso:** Fake news financeira — padrão Pix/banco (seed sintética representativa de padrão verificado pela Agência Lupa e Aos Fatos, 2021-2024)

> *"URGENTE: Banco Central suspende operações do Pix por falha de segurança. Transações acima de R$ 500 estão bloqueadas até segunda-feira..."*

Simulação com **200 agentes**, semente aleatória fixa 42, 5 cenários de intervenção:

| Intervenção | Score | Label | Pico infectados | Alcance total |
|---|---|---|---|---|
| Remoção | **7** | Baixo | 22% | 75,5% |
| Fact-check | 21 | Baixo | 47% | 99% |
| Contra-narrativa | 28 | Moderado | 48,5% | 99% |
| Aviso de rótulo | 36 | Moderado | 52,5% | 100% |
| **Sem intervenção** | **74** | **Alto** | **54,5%** | **100%** |

**Remoção reduz o risco em 91% vs. sem intervenção** (score 74 → 7).

Para reproduzir: `cd backend && python cases/run_demo.py`

---

## O problema

Fake news sobre o Pix, rumores de falência, notícias eleitorais falsas — uma vez que saem do WhatsApp, você tem minutos para responder. Sem dados sobre como a narrativa vai se espalhar, decisões são tomadas no feeling.

**Simulacra resolve isso antes de acontecer.**

---

## O que é

Simulacra é um motor open source de simulação de comportamento coletivo. Você alimenta com o texto de uma notícia — real ou hipotética — e recebe:

- **Curva SEIR ao vivo** — Suscetíveis, Expostos, Infectados, Recuperados em tempo real
- **Grafo de propagação** — visualização D3 da rede com nós coloridos por estado
- **Score de risco 0-100** — Baixo / Moderado / Alto / Crítico com descrição acionável
- **Comparação de intervenções** — 5 cenários rodados em paralelo, ordenados por eficácia
- **Relatório em português** — análise gerada por IA com recomendações práticas
- **Perfis regionais** — multiplicadores de propagação por região (SP, NE, SUL, CO, N, RJ) baseados em infraestrutura digital
- **Multi-seed** — rode até 5 notícias em paralelo e compare os resultados lado a lado
- **Export de dados** — ticks em CSV/JSON, seeds e relatórios em Markdown para análise externa
- **Alertas por e-mail** — configura limiar de score de risco e recebe notificações automáticas via SMTP
- **Dashboard comparativo** — selecione 2 simulações finalizadas e compare gráficos SEIR sincronizados

---

## Casos de uso

**Fintechs e bancos digitais**
Simule como uma fake news sobre o Pix ou sobre solvência institucional se espalharia. Qual resposta reduz mais o pânico antes que ele se instale?

**Agências de comunicação e PR**
Cole o texto de uma notícia negativa e compare: resposta imediata vs. silêncio vs. contra-narrativa. Leve dados concretos para a reunião com o cliente.

**Redações e fact-checkers**
Priorize quais fake news merecem checagem urgente — baseado no alcance projetado, não na intuição editorial.

**Consultoria eleitoral**
War game de desinformação: simule a propagação de narrativas falsas sobre candidatos e qual intervenção seria mais eficaz.

**Educação**
Professores configuram parâmetros ao vivo enquanto alunos observam a propagação. Mais didático que qualquer slides sobre fake news.

---

## Como funciona

```
Texto seed → Modelo SEIR → Grafo Barabási-Albert → Score de risco → Relatório IA
```

O motor usa o modelo epidemiológico SEIR em grafos Barabási-Albert — a mesma topologia de redes sociais reais.

| Intervenção | Redução na transmissão | Score típico |
|---|---|---|
| Sem intervenção | — | 60–90 |
| Aviso de rótulo | 25% | 45–70 |
| Contra-narrativa | 40% | 35–55 |
| Fact-check | 50% | 25–45 |
| Remoção | 80% | 10–25 |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.11 + FastAPI |
| Simulação | NetworkX + NumPy |
| IA | Claude API (claude-haiku-4-5) |
| Banco | SQLite |
| Frontend | React 18 + Vite |
| Visualização | D3.js + Chart.js |
| Deploy backend | Render (free tier) |
| Deploy frontend | GitHub Pages |
| CI | GitHub Actions |
| Custo mensal | R$ 0 |

---

## Rodar localmente

**Pré-requisitos:** Python 3.11+, Node.js 20+, [Claude API key](https://console.anthropic.com/settings/keys)

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # Edite com sua ANTHROPIC_API_KEY
uvicorn main:app --reload
# Swagger UI: http://localhost:8000/docs

# Frontend
cd frontend
npm install
npm run dev
# http://localhost:5173
```

```bash
# Testes
cd backend
python -m pytest tests/ -v
```

---

## API — Endpoints principais

```
POST /simulation/start          Inicia simulação individual
GET  /simulation/{id}/stream    SSE — ticks SEIR em tempo real
GET  /simulation/{id}/result    Resultado com score de risco
POST /simulation/compare        Compara todas as intervenções em paralelo
POST /simulation/multi          Simulação paralela de até 5 seeds
GET  /simulation/compare-view   Dados de 2 simulações para comparação
GET  /simulation/{id}/export    Ticks em CSV ou JSON
POST /seeds/collect             Coleta seeds RSS da Lupa e AosFatos
GET  /seeds/db/list             Lista seeds coletadas
GET  /seeds/export/csv          Seeds em CSV
POST /report/generate           Gera relatório IA em português
GET  /report/{id}/export/md     Relatório em Markdown
POST /alerts/config             Configura alerta por e-mail
GET  /alerts/config             Consulta configuração de alerta
DELETE /alerts/config           Desativa alerta
GET  /health                    Status da API
```

Documentação completa: https://desinfolab.onrender.com/docs

---

## Estrutura

```
simulacra/
├── backend/
│   ├── agents/
│   │   ├── simulation_engine.py # SEIR Barabási-Albert
│   │   ├── risk_scorer.py       # Score 0-100 com labels
│   │   ├── report_agent.py      # Relatório PT via Claude API
│   │   └── data_collector.py    # RSS Lupa + AosFatos
│   ├── routers/
│   │   ├── simulation.py        # start, stream, result, compare
│   │   ├── seeds.py             # collect, list, translate
│   │   └── reports.py           # generate, get
│   ├── tests/                   # 70+ testes automatizados
│   ├── database.py              # SQLite
│   └── main.py                  # FastAPI + segurança
├── frontend/
│   └── src/pages/
│       ├── Dashboard.jsx        # Histórico + status servidor
│       ├── Simulate.jsx         # Formulário + SeedSelector
│       ├── SimulationView.jsx   # SEIR ao vivo + D3 + score
│       ├── Compare.jsx          # Comparação de 5 intervenções
│       └── Report.jsx           # Relatório markdown
├── .github/workflows/
│   ├── ci.yml                   # Testes a cada push
│   └── deploy-frontend.yml      # Deploy GitHub Pages
└── render.yaml
```

---

## Segurança

- Rate limiting por IP em todos os endpoints
- Sanitização XSS com bleach
- Validação Pydantic com field_validator
- Security headers em todas as respostas
- CORS restrito por origem

Ver [SECURITY.md](SECURITY.md)

---

## Contribuindo

Ver [CONTRIBUTING.md](CONTRIBUTING.md)

Áreas prioritárias:
- Perfis de agentes regionais brasileiros
- Novas fontes de seeds (G1, BBC Brasil)
- Visualizações alternativas
- Export CSV/JSON dos resultados

---

## Roadmap

- [x] Motor SEIR com Barabási-Albert
- [x] SSE streaming em tempo real
- [x] Grafo D3 force-directed
- [x] Score de risco 0-100
- [x] Comparação de 5 intervenções em paralelo
- [x] Report Agent com Claude API
- [x] Coleta RSS Lupa e AosFatos
- [x] Deploy zero-cost
- [ ] Perfis de agentes regionais brasileiros
- [ ] Export CSV/JSON dos dados de simulação
- [ ] Webhook de alerta automático
- [ ] Integração GDELT para seeds internacionais
- [ ] Simulacra Insights — versão SaaS

---

## Licença

MIT — veja [LICENSE](LICENSE)

---

*Inspirado no [MiroFish](https://github.com/666ghj/MiroFish) de Guo Hangjiang.*
