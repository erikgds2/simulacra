# Politica de Seguranca — DesinfoLab

## Variaveis de Ambiente

Nunca commite o arquivo `.env`. Use sempre `.env.example` como referencia.

| Variavel | Descricao | Onde obter |
|---|---|---|
| `ANTHROPIC_API_KEY` | Chave da API Claude | console.anthropic.com |
| `TWITTER_BEARER_TOKEN` | Token da API X/Twitter | developer.twitter.com |
| `DATABASE_URL` | URL do banco de dados | local: sqlite:///./desinfolab.db |

## Checklist antes de commitar

- [ ] `git status` — nenhum `.env` ou arquivo com credenciais
- [ ] `grep -r "sk-ant-\|ghp_\|Bearer " .` — nenhum token no codigo
- [ ] `.env` esta listado no `.gitignore`

## Reportar vulnerabilidades

Abra uma issue privada no repositorio ou contate o mantenedor diretamente.

## O que NAO fazer

- Nunca embuta tokens diretamente no codigo-fonte
- Nunca use `git add .` sem revisar o que sera commitado
- Nunca commite arquivos `.env`, `.pem`, `.key` ou similares
