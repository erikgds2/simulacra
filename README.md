# MiroFish-BR

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Claude](https://img.shields.io/badge/Claude-claude--haiku--4--5-orange)

Motor de simulacao de desinformacao no Brasil baseado em swarm intelligence.

- Coleta automatica de checagens de fatos via RSS (Lupa, Aos Fatos)
- Simulacao SEIR em grafos Barabasi-Albert com ate 1000 agentes
- Modelagem de plataformas (Twitter, WhatsApp, Facebook, portais)
- Intervencoes simuladas (fact-check, rotulagem, remocao de conteudo)
- Relatorios narrativos gerados por IA via API Claude

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI + Python 3.11 |
| Simulacao | NetworkX + NumPy |
| IA | Claude claude-haiku-4-5 |
| Frontend | React 18 + Vite + Tailwind |
| Visualizacao | Chart.js + D3 |
| Estado | Zustand |
| Streaming | SSE (Server-Sent Events) |

## Custo zero

Utiliza exclusivamente a API Claude com credito gratuito inicial.
Sem banco de dados externo, sem servicos pagos obrigatorios.

## Como rodar

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1    # Windows
pip install -r requirements.txt
cp .env.example .env           # edite e adicione ANTHROPIC_API_KEY
uvicorn main:app --reload
```

API: http://localhost:8000 | Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Interface: http://localhost:5173

## Licenca

MIT
