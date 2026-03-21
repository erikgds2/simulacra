# Deploy — DesinfoLab

## Backend no Render (free tier)

### Pré-requisitos
- Conta no [Render](https://render.com) (gratuita)
- Repositório no GitHub conectado ao Render

### Passo a passo

1. Acesse https://render.com e faça login
2. Clique em **New** → **Web Service**
3. Conecte o repositório `erikgds2/desinfolab`
4. Configure:
   - **Name**: desinfolab-api
   - **Root Directory**: backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. Em **Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | sua chave sk-ant-... |
| `ENVIRONMENT` | production |
| `ALLOWED_ORIGINS` | https://erikgds2.github.io |

> **Importante**: após o deploy no GitHub Pages, atualize `ALLOWED_ORIGINS` no Render para `https://erikgds2.github.io` para que o CORS funcione em produção.
| `DATA_DIR` | /data |

6. Em **Disks**, adicione:
   - **Name**: desinfolab-data
   - **Mount Path**: /data
   - **Size**: 1 GB

7. Clique em **Create Web Service**

### URL pública
Após o deploy: `https://desinfolab-api.onrender.com`

### Atenção: cold start
O free tier do Render hiberna após 15 minutos sem uso.
A primeira requisição após hibernação leva 30–60 segundos.
Isso é normal e esperado no free tier.

### Verificar deploy
```bash
curl https://desinfolab-api.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "app": "DesinfoLab",
  "version": "0.3.0",
  "environment": "production",
  "db_exists": true
}
```

## Frontend no GitHub Pages

Ver [deploy-frontend.md](deploy-frontend.md) — executado no Dia 8.

## Variáveis de ambiente de produção

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sim | Chave da API Anthropic |
| `ENVIRONMENT` | Sim | Deve ser `production` |
| `ALLOWED_ORIGINS` | Sim | URL do frontend (GitHub Pages) |
| `DATA_DIR` | Sim | `/data` (disco persistente Render) |

## Limites do free tier Render

- 750 horas/mês de execução
- 512 MB de RAM
- Hibernação após 15 min sem requisições
- 1 GB de disco persistente
- Sem limite de requests

## Monitoramento

Acesse o dashboard do Render para ver:
- Logs em tempo real
- Uso de memória e CPU
- Histórico de deploys
