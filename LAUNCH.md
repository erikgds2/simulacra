# Simulacra — Material de Lançamento

> Dados reais de: `backend/cases/resultados_demo.json` (seed 42, 200 agentes, 2026-03-22)

---

## Post LinkedIn

---

Construí um simulador de fake news em Python.

Testei com uma seed real: a fake news de "suspensão do Pix pelo Banco Central" — padrão verificado pela Agência Lupa e Aos Fatos em múltiplos surtos entre 2021 e 2024.

Resultado com 200 agentes simulados:

| Intervenção | Score | Pico infectados | Alcance |
|---|---|---|---|
| Remoção | 7 (Baixo) | 22% | 75,5% |
| Fact-check | 21 (Baixo) | 47% | 99% |
| Contra-narrativa | 28 (Moderado) | 48,5% | 99% |
| Aviso de rótulo | 36 (Moderado) | 52,5% | 100% |
| **Sem intervenção** | **74 (Alto)** | **54,5%** | **100%** |

**Remoção reduz o risco em 91% vs. não fazer nada.**

Fact-check chega cedo demais para ser inútil, tarde demais para conter. Aviso de rótulo permite que 100% da rede seja atingida.

O projeto se chama Simulacra. É open source, roda com zero custo de infraestrutura e usa Claude API para gerar relatórios analíticos em português.

Demo: https://erikgds2.github.io/simulacra/
Código: https://github.com/erikgds2/simulacra
Para reproduzir o caso: `python cases/run_demo.py`

---

## DM Fintechs e Bancos Digitais

---

**Assunto:** Simulacra — simule como uma fake news sobre o Pix se espalharia pela sua base

Olá,

Construí o Simulacra, um motor open source de simulação de propagação de desinformação em redes sociais, voltado para o contexto brasileiro.

Testei com o padrão de fake news financeira mais recorrente no Brasil — a falsa suspensão do Pix — e os resultados são concretos:

- Sem intervenção: score de risco **74/100 (Alto)**, 100% de alcance na rede
- Com remoção precoce: score **7/100 (Baixo)**, alcance limitado a 75,5%
- Redução de risco: **91%**

O sistema simula como uma fake news específica (sobre solvência, falha de sistema, golpe financeiro) se espalharia em uma rede de agentes com perfis sociodemográficos brasileiros, e qual resposta — remoção, fact-check, contra-narrativa, aviso — seria mais eficaz para cada cenário.

Seria útil para o seu time de comunicação de crise ter isso antes que o próximo surto aconteça?

Demo ao vivo: https://erikgds2.github.io/simulacra/
Documentação da API: https://simulacra-api.onrender.com/docs

---

## Contatos Prioritários

### Agências de Fact-Checking

| Organização | Contato sugerido | Ângulo |
|---|---|---|
| Agência Lupa | Editors/diretores | Ferramenta de priorização editorial por alcance projetado |
| Aos Fatos | Time técnico | Integração de RSS já implementada no Simulacra |
| Boatos.org | Editores | Demo com caso real de padrão financeiro |
| AFP Checamos | Team leads | API aberta para integração editorial |

### Fintechs e Bancos

| Empresa | Departamento | Ângulo |
|---|---|---|
| Nubank | Comunicação / PR | Fake news sobre solvência e gestão de crise |
| Inter | Comunicação | Padrão Pix/banco já simulado e documentado |
| C6 Bank | Marketing | War-gaming de narrativas negativas |
| PicPay | RP | Caso de uso: falsa falência ou bloqueio |
| Mercado Pago | Comunicação | Simulação pré-crise de reputação |

### Consultoras e Agências de PR

| Empresa | Ângulo |
|---|---|
| Edelman Brasil | Ferramenta analítica para clientes financeiros |
| Weber Shandwick | Diferencial técnico em pitches de crise |
| FSB Comunicação | Demo com dado real para proposta |

### Acadêmicos e Pesquisadores

| Área | Ângulo |
|---|---|
| Comunicação / FAPESP | Metodologia SEIR em redes sociais brasileiras |
| Ciência da Computação | Motor open source para pesquisa de desinformação |
| Epidemiologia social | Adaptação de modelos epidemiológicos para infodemia |

---

## Métricas de Sucesso do Lançamento

- [ ] 500 impressões no post LinkedIn em 48h
- [ ] 10 estrelas no repositório GitHub na primeira semana
- [ ] 3 respostas de DMs para fintechs/agências
- [ ] 1 cobertura em newsletter de tecnologia brasileira
- [ ] Demo ao vivo funcionando sem erros críticos

---

## Repositório e Demo

- **GitHub:** https://github.com/erikgds2/simulacra
- **Demo:** https://erikgds2.github.io/simulacra/
- **API Docs:** https://simulacra-api.onrender.com/docs
- **Reproduzir caso:** `cd backend && python cases/run_demo.py`

---

*Gerado em 2026-03-22 com base em resultados reais de simulacra/backend/cases/resultados_demo.json*
