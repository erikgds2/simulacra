# API Reference — Simulacra

Base URL produção: `https://simulacra-api.onrender.com`
Base URL local: `http://localhost:8000`
Documentação interativa: `/docs` (Swagger UI)

---

## Simulações

### POST /simulation/start

Inicia uma nova simulação.

**Body:**
```json
{
  "seed_text": "string (10-5000 chars, obrigatório)",
  "seed_id": "string (opcional — ID de seed coletada)",
  "num_agents": "integer (10-1000, default: 200)",
  "intervention": "fact_check | removal | counter_narrative | label_warning | null",
  "random_seed": "integer (0-999999, default: 42)"
}
```

**Response 200:**
```json
{
  "simulation_id": "uuid",
  "status": "ready"
}
```

**Rate limit:** 10 req/min por IP

---

### GET /simulation/{id}/stream

Stream SSE de ticks em tempo real.

**Response:** `text/event-stream`
```
data: {"tick": 1, "S": 199, "E": 0, "I": 1, "R": 0}
data: {"tick": 2, "S": 196, "E": 2, "I": 2, "R": 0}
...
data: {"done": true}
```

**Rate limit:** 20 req/min por IP

---

### GET /simulation/{id}/result

Resultado final da simulação (somente após `done: true`).

**Response 200:**
```json
{
  "id": "uuid",
  "seed_text": "string",
  "num_agents": 200,
  "intervention": "fact_check",
  "status": "finished",
  "peak_infected": 45,
  "time_to_peak": 12,
  "total_reach": 0.73,
  "total_ticks": 38,
  "created_at": "ISO8601",
  "finished_at": "ISO8601"
}
```

---

### GET /simulation/list?limit=20

Lista simulações recentes.

**Response 200:**
```json
{
  "simulations": [...]
}
```

---

## Seeds

### POST /seeds/collect

Coleta seeds RSS da Agência Lupa e Aos Fatos.

**Response 200:**
```json
{
  "collected": 8,
  "total": 42,
  "last_updated": "ISO8601"
}
```

**Rate limit:** 5 req/min por IP

---

### GET /seeds/db/list?limit=50&offset=0

Lista seeds coletadas do banco.

**Response 200:**
```json
{
  "total": 42,
  "seeds": [
    {
      "id": "uuid",
      "source": "lupa",
      "source_name": "Agência Lupa",
      "title": "string",
      "content": "string",
      "url": "string",
      "collected_at": "ISO8601",
      "tags": ["desinformação"],
      "region_br": "nacional"
    }
  ]
}
```

---

## Relatórios

### POST /report/generate

Gera relatório analítico em português via Claude API.
Retorna do cache se já gerado para esta simulação.

**Body:**
```json
{
  "simulation_id": "uuid"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "simulation_id": "uuid",
  "markdown": "## Resumo Executivo\n...",
  "model": "claude-haiku-4-5-20251001",
  "created_at": "ISO8601",
  "cached": false
}
```

**Rate limit:** 5 req/min por IP

---

### GET /report/by-simulation/{simulation_id}

Busca relatório pelo ID da simulação.

---

### GET /report/{report_id}

Busca relatório pelo ID do relatório.

---

## Infra

### GET /health

```json
{
  "status": "ok",
  "app": "Simulacra",
  "version": "1.0.0",
  "environment": "production",
  "db_path": "/data/simulacra.db",
  "db_exists": true
}
```

---

## Erros

| Código | Significado |
|---|---|
| 400 | Input inválido ou simulação não concluída |
| 404 | Recurso não encontrado |
| 422 | Falha na validação Pydantic |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

---

## Rate limits globais

- 60 req/min por IP (global)
- Endpoints específicos têm limites menores — ver acima
