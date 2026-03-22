# Relatório de Propagação — Simulacra

## 1. Resumo Executivo

A simulação analisou a propagação de uma fake news financeira de alto impacto — a falsa suspensão do Pix pelo Banco Central — em uma rede de 200 agentes, utilizando o modelo epidemiológico SEIR. O conteúdo simulado apresenta características típicas de desinformação viral no Brasil: urgência artificial, apelo ao medo financeiro e chamada à ação imediata ("Compartilhe antes que apaguem").

Sem qualquer intervenção, a fake news atingiu 100% dos agentes da rede, com pico de 54,5% simultaneamente infectados no tick 15 e score de risco **Alto (74/100)**. A intervenção de remoção de conteúdo foi a mais eficaz, reduzindo o score de risco em **91%** — de 74 para apenas 7 — e limitando o alcance total a 75,5% da rede.

Os resultados demonstram que intervenções precoces de remoção têm impacto dramaticamente superior a abordagens reativas como fact-checks e contra-narrativas, que chegam tarde demais para conter a disseminação inicial.

## 2. Análise de Propagação

A curva SEIR sem intervenção revela velocidade de contágio extremamente alta. Os primeiros 5 ticks foram suficientes para expor 29 agentes (14,5% da rede), com crescimento exponencial entre os ticks 5 e 15. O pico ocorreu no tick 15 com 109 agentes simultaneamente no estado I (Infectado/Compartilhando), representando mais da metade da rede ativa propagando o conteúdo ao mesmo tempo.

| Tick | S | E | I | R |
|------|---|---|---|---|
| 1 | 197 | 2 | 1 | 0 |
| 15 | 5 | 46 | 109 | 40 |
| 30 | 0 | 1 | 38 | 161 |
| 50 | 0 | 0 | 3 | 197 |
| 71 | 0 | 0 | 0 | 200 |

A fase de recuperação iniciou-se no tick 16 e se estendeu até o tick 71, totalizando 71 ciclos de simulação. O índice de velocidade de 0,789 (escala 0-1) confirma a propagação agressiva, característica de conteúdos que exploram gatilhos emocionais financeiros.

## 3. Impacto Estimado no Contexto Brasileiro

No contexto brasileiro, fake news sobre o Pix têm impacto desproporcionalmente alto. O sistema Pix é utilizado por mais de 150 milhões de brasileiros e processa mais de 4 bilhões de transações por mês. Conteúdos falsos sobre falhas de segurança provocam reações imediatas: corridas a agências bancárias, bloqueios desnecessários de contas e transferências precipitadas de valores.

As plataformas mais afetadas são WhatsApp e Telegram, onde o conteúdo circula em grupos fechados sem moderação algorítmica. Grupos vulneráveis incluem idosos com menor familiaridade digital, MEIs e pequenos comerciantes que dependem do Pix para pagamentos diários, e trabalhadores informais que utilizam o sistema para receber remuneração.

A velocidade de propagação simulada — 100% de alcance em 71 ticks — é compatível com surtos observados em casos reais verificados pela Agência Lupa e Aos Fatos entre 2021 e 2024, onde o mesmo padrão de fake news bancária circulou em variações distintas, atingindo milhões de usuários em menos de 48 horas.

## 4. Eficácia da Intervenção

O cenário sem intervenção é o mais grave: score 74 (Alto), alcance total de 100% e pico de 54,5% da rede simultaneamente compartilhando o conteúdo falso. A ausência de ação resulta em saturação completa da rede.

A **Remoção** foi a intervenção mais eficaz (score 7, Baixo), limitando o pico a 22% e o alcance total a 75,5%. A remoção precoce interrompe a cadeia de transmissão antes da fase exponencial. O custo dessa abordagem é a necessidade de sistemas de detecção rápida e processos ágeis de moderação.

O **Fact-check** (score 21) e a **Contra-narrativa** (score 28) apresentaram eficácia intermediária, mas ainda alcançaram 99% da rede — evidenciando que chegam tarde para conter a disseminação inicial. O **Aviso de rótulo** (score 36) foi o menos eficaz entre as intervenções testadas, com 100% de alcance.

## 5. Recomendações

1. **Plataformas digitais**: Implementar sistemas de detecção automática de padrões de desinformação financeira (termos como "Pix bloqueado", "Banco Central suspende") com alerta em tempo real para moderação humana, priorizando remoção nos primeiros 60 minutos após detecção.

2. **Agências de fact-check (Lupa, Aos Fatos, Boatos.org)**: Criar biblioteca pública de padrões recorrentes de fake news financeira com templates de desmentido prontos para uso imediato, reduzindo o tempo de resposta de horas para minutos.

3. **Banco Central do Brasil**: Manter canal oficial de comunicação em redes sociais com atualizações proativas sobre o status do Pix, especialmente durante incidentes técnicos reais, para neutralizar o vácuo de informação explorado por desinformação.

4. **Governo Federal (CGI.br / SENACON)**: Regulamentar obrigação de resposta das plataformas em janela de 2 horas para conteúdos com alto potencial de dano financeiro, com critérios técnicos baseados em métricas de velocidade de propagação similares às do Simulacra.

5. **Usuários finais**: Campanhas de letramento digital focadas no padrão específico de fake news financeira — linguagem de urgência, ausência de fontes verificáveis, chamadas à ação imediata — com treinamento prático de verificação em 3 passos: fonte oficial, data de publicação, outras cobertura jornalística.

---
*Relatório gerado pelo Simulacra · Caso real: Fake news financeira — padrão Pix/banco · Data: 2026-03*
