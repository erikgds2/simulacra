# DesinfoLab

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Claude](https://img.shields.io/badge/Claude-Haiku-orange)
![License](https://img.shields.io/badge/licenca-MIT-blue)

**Motor de simulacao de propagacao de desinformacao no Brasil**, baseado em swarm intelligence e modelo epidemiologico SEIR.

---

## O que e o DesinfoLab?

O DesinfoLab simula como uma noticia falsa se espalha em uma rede social sintetica brasileira:

1. **Coleta** checagens de fatos reais via RSS (Agencia Lupa, Aos Fatos)
2. **Constroi** uma rede de agentes com comportamento inspirado em redes sociais brasileiras (Twitter, WhatsApp, Facebook)
3. **Simula** a propagacao usando o modelo SEIR em grafo Barabasi-Albert
4. **Aplica** intervencoes configuradas (fact-check, rotulagem, remocao) e mede o impacto
5. **Gera** relatorio de analise com recomendacoes via Claude API

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI + Python 3.11 |
| Simulacao | NetworkX + NumPy (SEIR / Barabasi-Albert) |
| IA | Anthropic Claude claude-haiku-4-5 |
| Frontend | React 18 + Vite + Tailwind CSS |
| Visualizacao | Chart.js + D3 |
| Estado | Zustand |
| Streaming | Server-Sent Events (SSE) |

---

## Custo zero

Roda com o credito gratuito inicial da Anthropic API.
Sem banco de dados externo, sem servicos pagos obrigatorios.

---

## Como rodar

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1      # Windows
# source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
# edite .env e adicione sua ANTHROPIC_API_KEY
uvicorn main:app --reload
```

- API: http://localhost:8000
- Documentacao Swagger: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Interface: http://localhost:5173

---

## Seguranca

Leia [SECURITY.md](SECURITY.md) antes de contribuir.
Nunca commite arquivos `.env` ou credenciais.

---

## Licenca

MIT
