# Contribuindo com o Simulacra

Obrigado pelo interesse em contribuir! Este guia explica como participar do projeto.

## Como começar

1. Faça um fork do repositório
2. Clone seu fork: `git clone https://github.com/SEU-USER/simulacra`
3. Crie uma branch: `git checkout -b feat/minha-contribuicao`
4. Faça suas mudanças
5. Rode os testes: `cd backend && python -m pytest tests/ -v`
6. Commit: `git commit -m "feat: descrição da mudança"`
7. Push: `git push origin feat/minha-contribuicao`
8. Abra um Pull Request

## Padrões de commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

| Prefixo | Quando usar |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `test:` | Adição ou correção de testes |
| `docs:` | Documentação |
| `refactor:` | Refatoração sem mudança de comportamento |
| `ci:` | Mudanças no CI/CD |

## Onde contribuir

### Fontes de seeds
Adicione novas fontes RSS em `backend/routers/seeds.py`:
```python
RSS_SOURCES = [
    {"id": "lupa", "name": "Agência Lupa", "url": "..."},
    {"id": "aosfatos", "name": "Aos Fatos", "url": "..."},
    # Adicione aqui: G1, UOL Confere, BBC Brasil, etc.
]
```

### Parâmetros do SimulationEngine
O motor SEIR está em `backend/agents/simulation_engine.py`.
Parâmetros atuais: `BETA_BASE=0.3`, `SIGMA=0.3`, `GAMMA=0.1`.
Contribuições de calibração baseada em dados reais de propagação são bem-vindas.

### Perfis de agentes regionais
Atualmente todos os agentes têm o mesmo beta. Uma contribuição valiosa seria
criar perfis distintos por região brasileira e nível de letramento digital.

### Visualizações
O grafo D3 está em `frontend/src/components/PropagationGraph.jsx`.
Ideias: heatmap por região, timeline de propagação, comparação side-by-side.

### Testes
Sempre adicione testes para novas funcionalidades.
Todos os testes ficam em `backend/tests/`.

## Checklist antes de abrir PR

- [ ] `python -m pytest tests/ -v` — todos passando
- [ ] `npm run build` — frontend compila sem erro
- [ ] Nenhuma credencial no código
- [ ] Nenhum `print()` de debug esquecido
- [ ] README atualizado se adicionou funcionalidade nova

## Dúvidas

Abra uma [issue](https://github.com/erikgds2/simulacra/issues) com a tag `question`.
