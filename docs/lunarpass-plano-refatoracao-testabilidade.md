# Plano de Refatoração — Testabilidade (Playwright)

> Base: relatório *Análise de Aderência para Automação de Testes*.
> Escopo: testabilidade de UI. Fora de escopo: arquitetura, performance, UX, dependências e criação de testes.
> Método: leitura estática do código em `src/` e `supabase/functions/`. Nenhum arquivo de código foi alterado.

---

## 1. Resumo

A base semântica da aplicação é boa: todos os elementos interativos são `button`, `a`, `input` ou `select` nativos, não há `iframe` nem shadow DOM, e não há classes CSS geradas/hasheadas (sem CSS Modules).
O bloqueio está na **camada de dados exibidos**: não existe **nenhum** `data-testid` em `src/` (varredura completa sem ocorrências) e não há atributo de domínio que permita escopar um item de missão, um assento ou um valor do resumo.
Consequência: assertions dependem de texto ambíguo ou de navegação estrutural no DOM (`/..`, cadeias de CSS), exatamente o que o relatório pede para eliminar.
Somam-se dois problemas de estado: o tooltip do assento é controlado por `opacity` (invisível para o modelo de visibilidade do Playwright) e a atualização de assentos ocupados ocorre após a carga sem marcador no DOM.
**Esforço total estimado: 12 ações — 5 P, 6 M, 1 G** (aprox. 3 a 5 dias de desenvolvimento, sendo 6 ações P1 concentradas em 4 arquivos).

---

## 2. Problemas confirmados

| # | Problema | Evidência (arquivo:linha) | Impacto na automação |
|---|---|---|---|
| C1 | O `<li>` de cada missão não possui atributo estável com o código da missão | [missions-page.tsx:158](src/features/storefront/catalog/pages/missions-page.tsx:158); código só como texto em [:170](src/features/storefront/catalog/pages/missions-page.tsx:170) | Impossível escopar um card por código. Como o link "Reservar" ([:216-220](src/features/storefront/catalog/pages/missions-page.tsx:216)) tem o mesmo nome acessível em todos os cards, `getByRole('link', {name:'Reservar'})` viola o strict mode. Restam `filter({hasText})` ou `.nth()`, ambos acoplados a texto/posição |
| C2 | Data de ida e data de volta ficam no **mesmo** `<span>`, separadas por `→` | [missions-page.tsx:182-185](src/features/storefront/catalog/pages/missions-page.tsx:182) | Não há elemento próprio para cada data. Qualquer assertion isolada exige split de string; `departure-date` e `return-date` não existem como nós distintos |
| C3 | "Estadia" sem identificador: rótulo e valor são dois `<span>` irmãos sem associação | [missions-page.tsx:187-191](src/features/storefront/catalog/pages/missions-page.tsx:187) | Para ler o valor é preciso partir do texto "Estadia" e caminhar no DOM (`/..`, `following-sibling`), acoplando o teste ao layout |
| C4 | Disponibilidade de assentos sem identificador (`{available} / {SEATS_PER_ROCKET} assentos`) | [missions-page.tsx:192-197](src/features/storefront/catalog/pages/missions-page.tsx:192) | Mesma situação de C3, agravada por ser valor dinâmico (ver A9) |
| C5 | Estado "sem resultados" sem `data-testid`, sem `role` e sem `id` | [missions-page.tsx:117-129](src/features/storefront/catalog/pages/missions-page.tsx:117) | Só é localizável pelo texto literal "Nenhuma missão programada com esses filtros." ([:118-120](src/features/storefront/catalog/pages/missions-page.tsx:118)). Note que o texto real difere do sugerido no relatório ("Nenhuma missão encontrada") |
| C6 | Tooltip do assento sem `role="tooltip"`, sem `id`, sem `data-testid` e sem `aria-describedby` no botão | [reservation-page.tsx:1087-1108](src/features/storefront/checkout/pages/reservation-page.tsx:1087); botão em [:1047-1058](src/features/storefront/checkout/pages/reservation-page.tsx:1047) | Não há relação entre assento e tooltip. Sem role e com `aria-hidden` ([:1088](src/features/storefront/checkout/pages/reservation-page.tsx:1088)), `getByRole('tooltip')` não encontra nada; sobra seletor por classe/estrutura. Ver também A2 e A3 |
| C7 | Aside de resumo: valores em `<dd>` sem identificador individual | `<dl>` em [reservation-page.tsx:861-867](src/features/storefront/checkout/pages/reservation-page.tsx:861); par `dt`/`dd` em [:880-887](src/features/storefront/checkout/pages/reservation-page.tsx:880) | Para ler "Ida", "Retorno", "Estadia", "Assentos" ou "Valor unitário" é obrigatório partir do `<dt>` e usar `following-sibling::dd` — dependência estrutural explícita |
| C8 | Aside: código da missão e foguete concatenados no mesmo `<p>` (`{mission.id} · {mission.rocket}`) | [reservation-page.tsx:855-857](src/features/storefront/checkout/pages/reservation-page.tsx:855) | `summary-mission-code` não existe como nó próprio; assertion exige parsing do separador `·` |
| C9 | Confirmação da reserva: todos os dados usam o componente `Info`, com rótulo e valor em `<p>` irmãos sem associação | Grid em [reservation-page.tsx:774-783](src/features/storefront/checkout/pages/reservation-page.tsx:774); componente em [:822-829](src/features/storefront/checkout/pages/reservation-page.tsx:822) | Etapa crítica do E2E sem `reservation-code`, `reservation-seats` etc. Leitura só por navegação estrutural a partir do rótulo |
| C10 | Confirmação: ida e volta concatenadas em um único valor "Datas" | [reservation-page.tsx:777-780](src/features/storefront/checkout/pages/reservation-page.tsx:777) | `reservation-departure-date` / `reservation-return-date` não são separáveis sem split de string |
| C11 | Confirmação: total pago e lista de passagens sem identificadores | Total em [reservation-page.tsx:804-816](src/features/storefront/checkout/pages/reservation-page.tsx:804); `<li>` das passagens em [:791-799](src/features/storefront/checkout/pages/reservation-page.tsx:791) (passaporte e assento no mesmo `<span>`, [:796-798](src/features/storefront/checkout/pages/reservation-page.tsx:796)) | Sem `reservation-total-price`; cada passagem não é escopável por assento |
| C12 | O filtro de bases não é padronizado entre as páginas: a Home usa chips com `input[type=checkbox]`, a `/missions` usa dropdown Radix | Home: [home-page.tsx:62](src/features/storefront/catalog/pages/home-page.tsx:62) → [base-options.tsx:30-53](src/features/storefront/catalog/ui/base-options.tsx:30). Resultados: [missions-page.tsx:92-97](src/features/storefront/catalog/pages/missions-page.tsx:92) → [base-select.tsx:56-96](src/features/storefront/catalog/ui/base-select.tsx:56) | Duas estratégias distintas para o mesmo filtro de domínio: `getByRole('checkbox')` na Home e abrir trigger + `getByRole('menuitemcheckbox')` na `/missions`. Dobra o código de page object e as formas de falha |

---

## 3. Problemas não confirmados

Itens em que o relatório pediu alteração, mas **não há evidência do defeito no código**:

| Item do relatório | Situação real no código | Motivo da não confirmação |
|---|---|---|
| "Seleção de bases lunares — associar o texto da base ao `input` utilizando `label`" | O `<label>` **já** envolve o `input` e o texto da base | [base-options.tsx:30-53](src/features/storefront/catalog/ui/base-options.tsx:30): `<label>` (linha 30) contém `<input type="checkbox">` (linhas 39-44) e `<span>{base.name}</span>` (linha 52); o marcador decorativo é `aria-hidden` (linhas 45-51). A associação implícita já existe, então `getByLabel('Base Lunar Alpha')` e `getByRole('checkbox', {name:'Base Lunar Alpha'})` resolvem o elemento. **Porém** o `input` é `sr-only` e não é alvo de ponteiro — ver achado A5, que explica por que a automação atual acabou recorrendo a XPath `/..` |
| "Ordenação das missões por data (Home) — garantir que o `select` possua um `label` associado" | O `<label htmlFor>` já existe e envolve o `select` | [mission-sort-select.tsx:16](src/features/storefront/catalog/ui/mission-sort-select.tsx:16) (`<label htmlFor={id}>`) + [:25-26](src/features/storefront/catalog/ui/mission-sort-select.tsx:25) (`<select id={id}>`); `id` sempre fornecido pelo chamador ([home-page.tsx:65](src/features/storefront/catalog/pages/home-page.tsx:65)). `page.getByLabel('Ordenar por')` já funciona. **Ressalva objetiva** em A4: o `<label>` envolve o `select`, então o texto das `option` entra no nome do label e a variante `{exact: true}` falha |
| "Ordenar por (`/missions`) — garantir a existência de um `label` associado" | Idêntico ao anterior, mesmo componente | [missions-page.tsx:100-105](src/features/storefront/catalog/pages/missions-page.tsx:100) reutiliza `MissionSortSelect` com `id="missions-sort"`. Mesma ressalva A4 |
| "Caixa sem resultados — *deve ser verificado* se o componente possui informação semântica" | Verificado: não possui | Não é "não confirmado" — está confirmado como problema em **C5** |

**Itens do relatório avaliados como adequados — confirmados como adequados no código:**

- Botão "Buscar missões": `<button type="submit">` com texto próprio — [home-page.tsx:67-73](src/features/storefront/catalog/pages/home-page.tsx:67).
- Botão "Refinar": `<button>` com texto próprio dentro do form — [missions-page.tsx:107-109](src/features/storefront/catalog/pages/missions-page.tsx:107).
- Filtro de bases da `/missions`: itens Radix com `role="menuitemcheckbox"` e nome acessível igual ao nome da base — [base-select.tsx:84-94](src/features/storefront/catalog/ui/base-select.tsx:84) + [dropdown-menu.tsx:94-115](src/components/ui/dropdown-menu.tsx:94); o conteúdo é renderizado via Portal no DOM claro ([dropdown-menu.tsx:61](src/components/ui/dropdown-menu.tsx:61)), acessível ao Playwright.
- Título da missão em `h3` e descrição em `p` — [missions-page.tsx:174-177](src/features/storefront/catalog/pages/missions-page.tsx:174) (ver ressalva A8: o `h3` traz o nome da **base**, não um nome único por missão).
- Link "Reservar" com o código no `href` — [missions-page.tsx:216-220](src/features/storefront/catalog/pages/missions-page.tsx:216) gera `/booking/<missionId>`.
- `aria-label` consistente nos botões de assento — [reservation-page.tsx:1058](src/features/storefront/checkout/pages/reservation-page.tsx:1058): `Assento {id}, {estado}, {vista}, {preço}`, com prefixo previsível `Assento A1`.

---

## 4. Achados adicionais

Bloqueadores não citados no relatório, encontrados na varredura:

| # | Problema | Evidência (arquivo:linha) | Impacto na automação |
|---|---|---|---|
| A1 | Nenhum `data-testid` (ou atributo de teste equivalente) existe na aplicação | Varredura de `src/**/*.{ts,tsx}` sem ocorrências de `data-testid`/`data-test`; nenhum `playwright.config.*` no repositório, embora `test:e2e` exista em [package.json:16](package.json:16) | Não há convenção nem atributo configurado (`testIdAttribute`). Toda a suíte fica dependente de texto e semântica, sem escape hatch para dados sem representação semântica |
| A2 | O tooltip do assento existe **sempre** no DOM e alterna apenas `opacity` (`opacity-0` → `group-hover:opacity-100`) | [reservation-page.tsx:1087-1092](src/features/storefront/checkout/pages/reservation-page.tsx:1087) | O Playwright considera visível todo elemento com bounding box não vazio e sem `display:none`/`visibility:hidden` — `opacity:0` **não** conta. `expect(tooltip).toBeVisible()` passa mesmo sem hover: o teste vira falso-positivo e nunca falha |
| A3 | O conteúdo do tooltip é duplicado em todos os assentos e repete o texto do `aria-label` | Um tooltip por assento em [reservation-page.tsx:1035-1041](src/features/storefront/checkout/pages/reservation-page.tsx:1035); textos em [:1094-1100](src/features/storefront/checkout/pages/reservation-page.tsx:1094); vistas repetidas em [:931-934](src/features/storefront/checkout/pages/reservation-page.tsx:931) (A1/A2 = "Vista para a Terra", B1/B2 = "Vista para a Lua") | `getByText(/Vista para a Terra/)` casa com 4+ nós (2 tooltips + 2 `aria-label`), violando o strict mode. Com `aria-hidden` no tooltip ([:1088](src/features/storefront/checkout/pages/reservation-page.tsx:1088)), nem `getByRole` serve de desempate |
| A4 | Os `<label>` envolvem o `<select>`, então o texto das `option` passa a integrar o nome do label | [mission-sort-select.tsx:16-40](src/features/storefront/catalog/ui/mission-sort-select.tsx:16); mesmo padrão em [mission-sheet.tsx:262-271](src/features/mission-control/missions/mission-sheet.tsx:262) com o select de [:143-154](src/features/mission-control/missions/mission-sheet.tsx:143) | O Playwright deriva o label pelo `textContent` do `<label>` inteiro, incluindo `option`. O nome vira "Ordenar por Missão mais próxima Missão mais distante": `getByLabel('Ordenar por')` funciona (substring), mas `getByLabel('Ordenar por', {exact:true})` falha — comportamento inconsistente entre campos |
| A5 | O `input[type=checkbox]` das bases é `sr-only`, portanto não recebe eventos de ponteiro | [base-options.tsx:39-44](src/features/storefront/catalog/ui/base-options.tsx:39); `sr-only` = `width:1px; height:1px; clip-path: inset(50%)` (utilitário do Tailwind v4 em `node_modules/tailwindcss/dist/lib.mjs`) | O locator resolve, mas `check()`/`click()` falham no hit-target check (o `<label>` intercepta o ponteiro), exigindo `force: true` ou clique no label. Além disso `toBeVisible()` retorna `true` para um controle que não é visível — assertion enganosa. Esta é a causa provável do XPath `/..` relatado |
| A6 | `FieldError` é renderizado **dentro** do `<label>`, alterando o texto do label conforme o estado | `<label>` em [reservation-page.tsx:488](src/features/storefront/checkout/pages/reservation-page.tsx:488), rótulo em [:489-491](src/features/storefront/checkout/pages/reservation-page.tsx:489), erro em [:526](src/features/storefront/checkout/pages/reservation-page.tsx:526) | Sem erro o label é "Nome completo"; com erro passa a "Nome completo O nome deve ter pelo menos 3 caracteres". Locators por label deixam de ser determinísticos entre o caminho feliz e o de validação |
| A7 | Os cards de passageiro não têm atributo de escopo e repetem os mesmos rótulos por assento | Card em [reservation-page.tsx:417-418](src/features/storefront/checkout/pages/reservation-page.tsx:417); campos em [:428-443](src/features/storefront/checkout/pages/reservation-page.tsx:428) | Com 2+ assentos, "Nome completo" e "Passaporte" aparecem repetidos. O único desempate é o `id` (`passenger-A1-fullName`), isto é, seletor por `#id` em vez de semântica escopada |
| A8 | O `h3` do card exibe o nome da **base**, não um identificador único da missão | [missions-page.tsx:174-176](src/features/storefront/catalog/pages/missions-page.tsx:174) | Duas missões da mesma base produzem headings idênticos; `getByRole('heading', {name:'Base Lunar Alpha'})` fica ambíguo. Sem C1 resolvido não há escopo para desambiguar |
| A9 | Assentos ocupados são revalidados no cliente após a carga, sem representação de estado no DOM | [use-reservations.ts:18-25](src/features/storefront/checkout/model/use-reservations.ts:18) (`refetchOnMount: "always"`, `refetchOnWindowFocus: true`); consumido em [missions-page.tsx:154](src/features/storefront/catalog/pages/missions-page.tsx:154) e [reservation-page.tsx:74](src/features/storefront/checkout/pages/reservation-page.tsx:74) | O contador "X / 4 assentos" e o mapa de assentos podem mudar depois do load, sem `aria-busy`/`role=status` para aguardar. Assertions feitas cedo capturam o valor do SSR e ficam sujeitas a corrida |
| A10 | Nenhuma rota declara estado de navegação pendente | [missions.tsx:10-32](src/routes/missions.tsx:10), [booking.$missionId.tsx:7-16](src/routes/booking.$missionId.tsx:7), [index.tsx:6-19](src/routes/index.tsx:6); `createRouter` sem `defaultPendingComponent` em [router.tsx:8-13](src/router.tsx:8) | Durante "Refinar"/"Reservar" a página anterior continua no DOM sem marcador de carregamento. O teste não tem sinal para aguardar a nova lista e tende a assertar sobre o conteúdo antigo |
| A11 | Estado "Esgotado" do card é um `<span>` de texto, sem hook estável | [missions-page.tsx:211-214](src/features/storefront/catalog/pages/missions-page.tsx:211) | Verificar esgotamento por card depende do texto e do escopo inexistente de C1 |
| A12 | Delay fixo de 900 ms no simulador de pagamento | [stripe-payment/index.ts:104](supabase/functions/stripe-payment/index.ts:104) | Alonga o E2E de checkout de forma fixa. Mitigado: a UI expõe `role="status"` e `aria-busy` durante o processamento ([reservation-page.tsx:613](src/features/storefront/checkout/pages/reservation-page.tsx:613), [:668-680](src/features/storefront/checkout/pages/reservation-page.tsx:668)), então não exige `waitForTimeout` |
| A13 | `useId()` como fallback de `id` em componentes de formulário | [base-select.tsx:37-38](src/features/storefront/catalog/ui/base-select.tsx:37); [reservation-page.tsx:483-484](src/features/storefront/checkout/pages/reservation-page.tsx:483) | Risco latente: hoje **todos** os call sites passam `id` explícito, mas qualquer nova instância sem `id` receberá identificador gerado pelo React (instável entre builds/renders) |
| A14 | Linhas da tabela do Mission Control sem atributo de domínio | `<tr>` em [mission-control/missions-page.tsx:139](src/features/mission-control/missions/missions-page.tsx:139) | Mitigado pelos `aria-label` com o ID nas ações ([:161](src/features/mission-control/missions/missions-page.tsx:161), [:169](src/features/mission-control/missions/missions-page.tsx:169), [:182](src/features/mission-control/missions/missions-page.tsx:182)), mas assertions sobre células da linha ainda dependem de `filter({hasText})` |

**Critérios varridos sem ocorrência (não identificado):** conteúdo em `iframe` ou shadow DOM (nenhuma ocorrência de `iframe`/`attachShadow` em `src/`); classes CSS geradas ou hasheadas (nenhum `*.module.css`; Tailwind com classes estáticas no fonte); `setTimeout`/`setInterval` de espera no código de UI (apenas dois `requestAnimationFrame` de foco em [reservation-page.tsx:399](src/features/storefront/checkout/pages/reservation-page.tsx:399) e [:579](src/features/storefront/checkout/pages/reservation-page.tsx:579), que não introduzem espera observável).

---

## 5. Plano de refatoração

Convenção adotada nas ações: atributo de domínio (`data-mission-code`, `data-seat`) para **entidades**; `data-testid` para **valores** sem representação semântica adequada.

| # | Ação | Arquivos afetados | Esforço | Prioridade |
|---|---|---|---|---|
| 1 | Adicionar `data-mission-code={mission.id}` no `<li>` raiz do card e `data-testid="mission-card"` para varredura da lista | `src/features/storefront/catalog/pages/missions-page.tsx` (l. 158) | P | P1 |
| 2 | Separar as datas do card em dois `<span>` (`data-testid="departure-date"` / `"return-date"`) e identificar `mission-code`, `mission-rocket`, `mission-duration`, `available-seats`, `mission-price` e o selo `sold-out` | `src/features/storefront/catalog/pages/missions-page.tsx` (l. 169-197, 203-214) | M | P1 |
| 3 | Identificar o estado vazio com `data-testid="missions-empty-state"` + `role="status"`, mantendo o texto atual como assertion funcional | `src/features/storefront/catalog/pages/missions-page.tsx` (l. 117-129) | P | P1 |
| 4 | Tornar o tooltip do assento observável: renderizá-lo condicionalmente (ou alternar `hidden`) em vez de `opacity`, dar `id="seat-<id>-tooltip"`, `role="tooltip"` e `data-testid="seat-tooltip"`, e ligar o botão via `aria-describedby`; remover o `aria-hidden` do conteúdo exposto | `src/features/storefront/checkout/pages/reservation-page.tsx` (l. 1042-1108) | M | P1 |
| 5 | Identificar cada valor do aside: `summary-mission-code` (separando código e foguete), `summary-departure-date`, `summary-return-date`, `summary-duration`, `summary-selected-seats`, `summary-unit-price`, `summary-total-price` — via prop `testId` em `SumRow` | `src/features/storefront/checkout/pages/reservation-page.tsx` (l. 844-887) | M | P1 |
| 6 | Identificar a confirmação: `reservation-code`, `reservation-destination`, `reservation-rocket`, `reservation-seats`, `reservation-total-price`; separar "Datas" em `reservation-departure-date` e `reservation-return-date`; identificar cada passagem com `data-seat` e separar passaporte e assento em nós próprios. *Decisão de produto necessária:* o código da missão **não** é exibido nesta etapa (só no aside, l. 855-857) — exibi-lo é mudança de conteúdo, não apenas de atributo | `src/features/storefront/checkout/pages/reservation-page.tsx` (l. 774-829) | M | P1 |
| 7 | Mover `FieldError` para fora do `<label>` e trocar o label implícito por `<label htmlFor>`, mantendo `aria-describedby` — estabiliza o nome do label independentemente do estado de erro | `src/features/storefront/checkout/pages/reservation-page.tsx` (l. 487-528) | M | P2 |
| 8 | Trocar o `<label>` que envolve `<select>` por `<label for>` + `<select id>` irmãos, para que o nome do label não absorva o texto das `option` | `src/features/storefront/catalog/ui/mission-sort-select.tsx` (l. 16-41); `src/features/mission-control/missions/mission-sheet.tsx` (l. 262-271) | P | P2 |
| 9 | Tornar o checkbox das bases alvo de ponteiro (ex.: `appearance-none` com área clicável real em vez de `sr-only`), de modo que `check()` funcione sem `force` e `toBeVisible()` seja verdadeiro | `src/features/storefront/catalog/ui/base-options.tsx` (l. 30-53) | M | P2 |
| 10 | Padronizar o filtro de bases entre Home e `/missions` em um único componente (usar `BaseSelect` como referência, conforme o relatório), eliminando as duas estratégias de automação | `src/features/storefront/catalog/ui/base-options.tsx`, `src/features/storefront/catalog/ui/base-select.tsx`, `src/features/storefront/catalog/pages/home-page.tsx` (l. 61-63) | G | P2 |
| 11 | Expor estados assíncronos no DOM: `pendingComponent`/`defaultPendingComponent` com `role="status"` e `data-testid="route-pending"`; e `aria-busy`/`data-loading` nos containers que dependem de `useOccupiedSeats` | `src/router.tsx` (l. 8-13); `src/routes/missions.tsx`, `src/routes/booking.$missionId.tsx`; `src/features/storefront/checkout/model/use-reservations.ts` (l. 15-36) | M | P2 |
| 12 | Endurecer convenções: `data-testid="passenger-card"` + `data-seat` nos cards de passageiro; `data-mission-id` no `<tr>` do Mission Control; tornar `id` obrigatório onde hoje há fallback `useId()`; documentar a convenção de identificadores | `src/features/storefront/checkout/pages/reservation-page.tsx` (l. 417-418, 483-484); `src/features/mission-control/missions/missions-page.tsx` (l. 139); `src/features/storefront/catalog/ui/base-select.tsx` (l. 37-38) | P | P3 |

> **Nota sobre a ação 10 (decisão de produto, posterior ao plano).** A padronização foi
> revertida na Home a pedido do PO: a barra de busca precisa exibir as 4 bases visíveis, e
> `/missions` permanece com o dropdown. O bloqueador real da ação 9 (`input` `sr-only` sem
> área de ponteiro) foi corrigido em vez de removido — o checkbox agora ocupa toda a pílula.
> A divergência de interação apontada em **C12** persiste por decisão de produto; o que a
> mitiga é o atributo de domínio `data-base-id`, agora presente nas duas implementações.

Legenda de esforço: **P** = alteração pontual de atributos em um arquivo; **M** = mudança estrutural de markup ou de componente compartilhado; **G** = substituição de componente com impacto visual em mais de uma página.

---

## 6. Definição de "100% testável" para este projeto

Checklist objetivo e verificável. Cada item pode ser conferido por inspeção do DOM ou por execução do locator indicado.

**Localização**

- [ ] `playwright.config.ts` existe e define `use.testIdAttribute` (hoje há o script `test:e2e` em [package.json:16](package.json:16), mas nenhum config no repositório).
- [ ] Todo elemento **interativo** é alcançável por `getByRole(...)` + nome acessível, sem XPath e sem seletor de classe CSS.
- [ ] Todo **valor de negócio** exibido nas jornadas Home → `/missions` → `/booking/:id` → confirmação é alcançável por `getByTestId(...)`, sem `following-sibling`, sem `/..` e sem `.nth()`.
- [ ] Nenhum locator da suíte usa classe CSS, `nth`, ou navegação por ancestral/irmão.

**Escopo por entidade**

- [ ] Todo item de missão expõe `data-mission-code`; `page.locator('[data-mission-code="LP-XXXX"]')` retorna exatamente 1 elemento por missão listada.
- [ ] Todo assento expõe identificação própria e o tooltip correspondente é resolvido por `aria-describedby` a partir do botão.
- [ ] Cada card de passageiro é escopável por assento (`data-seat`), sem depender do `id` do input.
- [ ] Dentro do escopo de uma missão, cada campo (`departure-date`, `return-date`, `mission-duration`, `available-seats`, `mission-price`) resolve para exatamente 1 elemento.

**Atomicidade dos dados**

- [ ] Nenhum `data-testid` contém dois valores de negócio concatenados (hoje violado em [missions-page.tsx:182-185](src/features/storefront/catalog/pages/missions-page.tsx:182), [reservation-page.tsx:777-780](src/features/storefront/checkout/pages/reservation-page.tsx:777), [:855-857](src/features/storefront/checkout/pages/reservation-page.tsx:855), [:796-798](src/features/storefront/checkout/pages/reservation-page.tsx:796)).
- [ ] Nenhuma assertion da suíte precisa de `split`, `replace` ou regex sobre o texto para extrair um único valor.

**Estados**

- [ ] Cada estado tem nó próprio e hook estável: vazio (`missions-empty-state`), esgotado (card e página de reserva), erro de campo (`role="alert"`, já atendido em [field-error.tsx:15-22](src/components/ui/field-error.tsx:15)), processamento de pagamento (`role="status"`, já atendido em [reservation-page.tsx:668-680](src/features/storefront/checkout/pages/reservation-page.tsx:668)) e navegação pendente.
- [ ] A visibilidade de qualquer elemento condicional é expressa por montagem/`display`/`hidden` — nunca só por `opacity` — de forma que `toBeVisible()` seja capaz de **falhar**.
- [ ] Toda atualização assíncrona pós-carga possui marcador no DOM (`aria-busy`, `data-loading` ou `role="status"`) que permita `expect(...).toBeHidden()` como ponto de sincronização.

**Determinismo de nomes**

- [ ] `getByLabel(<rótulo>, { exact: true })` resolve exatamente 1 elemento para cada campo de formulário, **com e sem** mensagem de erro visível.
- [ ] O nome acessível de um campo não muda em função do estado do formulário nem do valor selecionado.
- [ ] O mesmo controle de domínio (filtro de bases) tem a mesma estratégia de locator em todas as páginas.

**Ausência de barreiras estruturais** *(já satisfeito hoje — manter como regressão)*

- [ ] Nenhum conteúdo em `iframe` ou shadow DOM.
- [ ] Nenhuma classe CSS gerada/hasheada em uso como seletor.
- [ ] Nenhum `waitForTimeout` necessário na suíte; o delay fixo do simulador ([stripe-payment/index.ts:104](supabase/functions/stripe-payment/index.ts:104)) é absorvido pelo estado `role="status"`.
