## Prompt Original

Aprimore o meu prompt para que o Claude Code execute com o máximo de eficiência sem ficar alucinando ou fugindo do escopo.

Quero uma saida 100% em MD copia e cola.

```md
Faça uma analise completa na aplicação web com base nesse relatório de testes de aderência. Com isso eu quero um plano de refatoração para que a aplicação seja 100% testável por ferramentas de automação de testes.

Não fuja do escopo principal, foque exatamente na resolução do problema.
```

## Prompt Aprimorado

# Análise de Testabilidade + Plano de Refatoração

## Objetivo
Analisar a aplicação web com base no relatório de testes de aderência e produzir um plano de refatoração que torne a aplicação 100% testável por automação de UI (Playwright).

## Entradas
- Relatório: `./caminho/do/relatorio.md`
- Código-fonte: raiz deste repositório

Se qualquer entrada estiver ausente ou ilegível, PARE e pergunte. Não prossiga com suposições.

## Processo (siga nesta ordem)
1. Leia o relatório inteiro e extraia a lista de problemas apontados.
2. Explore o código e localize cada problema no código real (arquivo:linha).
3. Classifique cada item: **Confirmado** (com evidência no código) ou **Não confirmado** (citado no relatório, sem evidência no código).
4. Varra o código em busca de bloqueadores de testabilidade não citados no relatório, limitando-se a critérios objetivos:
   - elementos interativos sem `data-testid`, `id` estável, `role` ou `aria-label`
   - seletores dependentes de classes CSS geradas/dinâmicas
   - estados sem representação no DOM (loading, erro, vazio)
   - delays/timers fixos que causam flakiness
   - conteúdo em iframe ou shadow DOM sem ponte de acesso
5. Monte o plano de refatoração.

## Regras
- Somente leitura: NÃO modifique, crie ou delete arquivos de código. O único arquivo criado é o entregável.
- Escopo fechado em testabilidade. Fora de escopo: arquitetura, performance, UX, upgrade de dependências, criação de testes.
- Toda afirmação sobre o código exige referência `arquivo:linha`. Sem referência, não entra no documento.
- O que não estiver no relatório nem no código recebe a marcação "não identificado". Nunca preencha com suposição.

## Entregável
Um único arquivo: `PLANO_REFATORACAO_TESTABILIDADE.md`

Estrutura obrigatória:
1. **Resumo** — máx. 5 linhas: estado atual e esforço total estimado.
2. **Problemas confirmados** — tabela: `# | Problema | Evidência (arquivo:linha) | Impacto na automação`
3. **Problemas não confirmados** — itens do relatório sem evidência no código, com o motivo.
4. **Achados adicionais** — bloqueadores fora do relatório (mesma tabela do item 2).
5. **Plano de refatoração** — tabela: `# | Ação | Arquivos afetados | Esforço (P/M/G) | Prioridade`
6. **Definição de 100% testável** — checklist objetivo e verificável para este projeto.

## Priorização
- **P1** — bloqueia a automação (elemento não localizável de forma estável)
- **P2** — causa flakiness (timing, seletores frágeis)
- **P3** — dificulta manutenção da suíte