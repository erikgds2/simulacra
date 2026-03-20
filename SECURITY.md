# Política de segurança — DesinfoLab

## Credenciais e segredos

- **Nunca** commite arquivos `.env`, `*.key`, `*.pem` ou qualquer arquivo com credenciais reais
- O arquivo `.env.example` contém apenas placeholders — use-o como template
- A `ANTHROPIC_API_KEY` deve ser mantida somente no arquivo `.env` local ou nas variáveis de ambiente do servidor de deploy

## Variáveis de ambiente obrigatórias

| Variável | Descrição | Obrigatória |
|---|---|---|
| `ANTHROPIC_API_KEY` | Chave da API Anthropic | Sim |
| `ALLOWED_ORIGINS` | Origens CORS permitidas | Não (default: localhost) |
| `TWITTER_BEARER_TOKEN` | Token Twitter/X | Não |

## Limites de rate

| Endpoint | Limite |
|---|---|
| `POST /simulation/start` | 10 req/min |
| `GET /simulation/:id/stream` | 20 req/min |
| `POST /seeds/collect` | 5 req/min |
| Global | 60 req/min |

## Reportar vulnerabilidades

Se encontrar uma vulnerabilidade de segurança, abra uma issue privada ou envie email para o mantenedor. Não abra issues públicas para vulnerabilidades de segurança.

## Checklist antes de abrir Pull Request

- [ ] Nenhuma chave ou credencial no código
- [ ] Nenhum `print()` ou `console.log()` com dados sensíveis
- [ ] Inputs validados com Pydantic antes de processar
- [ ] Nenhuma dependência nova sem justificativa no PR
