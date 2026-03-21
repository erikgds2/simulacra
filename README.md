# DesinfoLab

[![CI](https://github.com/erikgds2/desinfolab/actions/workflows/ci.yml/badge.svg)](https://github.com/erikgds2/desinfolab/actions/workflows/ci.yml)
[![Deploy](https://github.com/erikgds2/desinfolab/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/erikgds2/desinfolab/actions/workflows/deploy-frontend.yml)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Custo](https://img.shields.io/badge/Custo-Zero-brightgreen)](https://render.com)

> **Simulador de propagação de desinformação no Brasil** usando modelo SEIR e grafos Barabási-Albert.

**Demo ao vivo:** https://erikgds2.github.io/desinfolab/
**API pública:** https://desinfolab-api.onrender.com/docs

---

## O que é

DesinfoLab é um motor de simulação open source que modela como fake news se propagam em redes sociais brasileiras. Você alimenta o sistema com o texto de uma notícia — real ou hipotética — e em segundos vê:

- A curva SEIR animada em tempo real (Suscetíveis, Expostos, Infectados, Recuperados)
- O grafo de propagação com nós coloridos por estado
- O impacto de 4 intervenções diferentes (fact-check, remoção, contra-narrativa, aviso)
- Um relatório analítico em português gerado por IA

---

## Casos de uso

**1. Simulador eleitoral**
Cole uma fake news sobre urnas ou candidatos e veja como ela se espalharia com e sem intervenção do TSE. Visual, polêmico, compartilhável.

**2. Triagem de viralização para jornalistas**
Agências de fact-checking como Lupa e AosFatos podem priorizar quais checagens fazer primeiro — baseado no alcance projetado, não no feeling.

**3. War game de crise para fintechs**
Simule como uma fake news sobre o Pix ou sobre falência de banco se espalha. Qual resposta institucional teria mais impacto antes do pânico se instalar?

**4. Comparador de intervenções**
Rode a mesma notícia com as 4 intervenções disponíveis e veja qual reduz mais o alcance. Entrega número concreto para embasar decisão editorial ou de comunicação.

**5. Laboratório educacional**
Professores configuram parâmetros ao vivo enquanto alunos observam a propagação. Mais didático que qualquer slides sobre fake news.

---

## Como funciona

```
Texto seed → Rede Barabási-Albert → Simulação SEIR → Relatório IA
```

O motor usa o modelo epidemiológico **SEIR** em grafos **Barabási-Albert** — a mesma topologia de redes sociais reais, onde poucos nós têm muitas conexões (influenciadores) e a maioria tem poucas.

**Beta por intervenção:**

| Intervenção | O que faz | Redução na transmissão |
|---|---|---|
| Nenhuma | Sem intervenção — propagação livre | 0% |
| Aviso de rótulo | Plataforma adiciona um aviso na publicação ("conteúdo contestado") sem removê-la | 25% |
| Contra-narrativa | Publicação de conteúdo verdadeiro que disputa o espaço da fake news nas redes | 40% |
| Fact-check | Agência de checagem publica verificação oficial desmentindo o conteúdo | 50% |
| Remoção | Plataforma ou autoridade remove a publicação do ar completamente | 80% |

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
| **Custo mensal** | **R$ 0** |

---

## Rodar localmente

### Pré-requisitos
- Python 3.11+
- Node.js 20+
- Chave da Claude API: https://console.anthropic.com/settings/keys

### Backend
```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edite .env e preencha ANTHROPIC_API_KEY

python check_env.py   # Valida configuração
uvicorn main:app --reload
```

API disponível em: http://localhost:8000 (local) ou https://desinfolab.onrender.com (produção)
Swagger UI em: http://localhost:8000/docs (local) ou https://desinfolab.onrender.com/docs (produção)

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend em: http://localhost:5173

### Testes
```bash
cd backend
python -m pytest tests/ -v
```

---

## Estrutura do projeto

```
desinfolab/
├── backend/
│   ├── agents/
│   │   ├── data_collector.py    # Coleta RSS Lupa + AosFatos
│   │   ├── simulation_engine.py # Motor SEIR Barabási-Albert
│   │   └── report_agent.py      # Relatório em PT via Claude API
│   ├── routers/
│   │   ├── simulation.py        # POST /simulation/start, SSE stream
│   │   ├── seeds.py             # GET/POST /seeds
│   │   └── reports.py           # POST /report/generate
│   ├── tests/                   # 64+ testes automatizados
│   ├── database.py              # SQLite — simulações, ticks, seeds, relatórios
│   ├── main.py                  # FastAPI app com segurança
│   └── check_env.py             # Validação de ambiente
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PropagationGraph.jsx  # D3 force-directed
│   │   │   └── SeedSelector.jsx      # Seletor de seeds coletadas
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Histórico de simulações
│   │   │   ├── Simulate.jsx          # Formulário de configuração
│   │   │   ├── SimulationView.jsx    # Gráfico SEIR ao vivo + D3
│   │   │   └── Report.jsx            # Relatório markdown
│   │   └── api.js                    # Centraliza chamadas à API
│   └── vite.config.js
├── .github/workflows/
│   ├── ci.yml                   # Testes a cada push
│   └── deploy-frontend.yml      # Deploy automático no GitHub Pages
├── docs/
│   ├── deploy.md                # Guia de deploy no Render
│   ├── deploy-frontend.md       # Guia de deploy no GitHub Pages
│   └── API.md                   # Referência completa da API
├── render.yaml                  # Configuração de deploy no Render
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── README.md
```

---

## API

Documentação completa: https://desinfolab-api.onrender.com/docs

### Endpoints principais

```
POST /simulation/start          Inicia simulação
GET  /simulation/{id}/stream    SSE — streaming de ticks em tempo real
GET  /simulation/{id}/result    Resultado final
GET  /simulation/list           Histórico de simulações
POST /seeds/collect             Coleta seeds RSS da Lupa e AosFatos
GET  /seeds/db/list             Lista seeds coletadas
POST /report/generate           Gera relatório IA em português
GET  /report/{id}               Busca relatório por ID
GET  /health                    Status da API
```

### Exemplo rápido

```bash
# Iniciar simulação
curl -X POST https://desinfolab-api.onrender.com/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"seed_text": "Governo anuncia bloqueio do Pix a partir de segunda-feira", "num_agents": 200}'

# Streaming de ticks (SSE)
curl https://desinfolab-api.onrender.com/simulation/{id}/stream
```

Ver [docs/API.md](docs/API.md) para referência completa.

---

## Segurança

- Rate limiting por IP em todos os endpoints
- Sanitização XSS com bleach em todo input
- Validação Pydantic com field_validator
- Security headers em todas as respostas
- CORS restrito à origem configurada
- Nenhuma credencial no código — tudo via variáveis de ambiente

Ver [SECURITY.md](SECURITY.md) para política completa.

---

## Contribuindo

Ver [CONTRIBUTING.md](CONTRIBUTING.md).

Áreas onde contribuições são bem-vindas:
- Novas fontes de seeds (G1, UOL Confere, BBC Brasil)
- Modelos de agentes com perfis regionais brasileiros
- Visualizações alternativas do grafo
- Testes de carga e benchmarks

---

## Roadmap

- [x] Motor SEIR com Barabási-Albert
- [x] SSE streaming em tempo real
- [x] Grafo D3 force-directed
- [x] Report Agent com Claude API
- [x] Coleta RSS Lupa e AosFatos
- [x] SQLite persistente
- [x] Deploy zero-cost (Render + GitHub Pages)
- [x] 64+ testes automatizados com CI
- [ ] Perfis de agentes regionais brasileiros (SP, NE, SUL)
- [ ] Simulação paralela com múltiplas seeds
- [ ] Export de dados em CSV/JSON
- [ ] Dashboard de comparação de intervenções
- [ ] Integração GDELT para seeds internacionais

---

## Citação

Se usar este projeto em pesquisa acadêmica:

```
@software{desinfolab2026,
  author = {erikgds2},
  title = {DesinfoLab: Simulador de Propagação de Desinformação no Brasil},
  url = {https://github.com/erikgds2/desinfolab},
  year = {2026}
}
```

---

## Licença

MIT — veja [LICENSE](LICENSE).

---

*Inspirado no [MiroFish](https://github.com/666ghj/MiroFish) de Guo Hangjiang.*
