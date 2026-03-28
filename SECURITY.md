# Política de segurança — Simulacra

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

## Variáveis de ambiente sensíveis

As seguintes variáveis de ambiente contêm dados sensíveis e NUNCA devem ser commitadas no repositório:

| Variável | Uso |
|----------|-----|
| `ANTHROPIC_API_KEY` | Geração de relatórios com Claude |
| `SMTP_HOST` | Servidor SMTP para alertas |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASS` | Senha SMTP |
| `SMTP_FROM` | Endereço de envio (opcional) |
| `SMTP_PORT` | Porta SMTP (padrão: 587) |

Configure estas variáveis no painel do seu serviço de deploy (Render, Railway, etc.) ou em um arquivo `.env` local **que nunca deve ser commitado**.

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
