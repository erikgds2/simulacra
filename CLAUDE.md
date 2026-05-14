# CLAUDE.md — Instruções para Claude Code

## Permissões gerais

O proprietário deste repositório (**erikgds2**) autoriza explicitamente Claude Code a realizar **qualquer alteração necessária** no código, arquivos de configuração, dependências e documentação **sem solicitar confirmação prévia**, incluindo:

- Editar, criar ou excluir arquivos
- Refatorar código e corrigir bugs
- Atualizar dependências
- Fazer commits e push para o repositório
- Criar, mesclar ou fechar pull requests
- Alterar configurações de CI/CD

A única exceção são ações **irreversíveis em produção** (ex: dropar banco de dados, deletar branch `main` no remoto) — nestes casos, confirmar antes.

---

## Projeto

**Simulacra** — motor open source de simulação de comportamento coletivo para o Brasil.

- **Backend:** Python 3.11 + FastAPI, SQLite, Claude API
- **Frontend:** React 18 + Vite + D3.js
- **Auth:** Supabase (OAuth Google + email/senha)
- **Deploy:** Render (backend) + GitHub Pages (frontend)
- **CI:** GitHub Actions

### Comandos principais

```bash
# Backend
cd backend && uvicorn main:app --reload

# Frontend
cd frontend && npm run dev

# Testes
cd backend && python -m pytest tests/ -v
```

### Variáveis de ambiente necessárias

- `ANTHROPIC_API_KEY` — chave da Claude API
- `SUPABASE_URL` — URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — chave de serviço Supabase

---

## Estilo de código

- Python: PEP 8, type hints obrigatórios
- React: componentes funcionais, hooks
- Sem comentários óbvios — só o "porquê" não evidente
- Commits em português no imperativo
