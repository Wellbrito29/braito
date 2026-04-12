# SPEC_GPT

## Objetivo

Este documento compara o repositório de referência `NebulaSpecKit` com o `braito` e propõe uma forma prática de absorver a ideologia do Nébula no seu projeto sem descaracterizar o que o Braito já faz bem.

Resumo direto:

- `NebulaSpecKit` é um framework de governança documental, execução por tasks e validação.
- `braito` é um motor de análise estática + sinais operacionais + síntese LLM para gerar contexto por arquivo.
- Eles não competem entre si. Na prática, o Nébula define como trabalhar; o Braito pode virar uma das fontes de evidência e contexto dessa governança.

---

## Leitura Conceitual

### Ideologia central do NebulaSpecKit

Pelos documentos lidos (`README.md`, `Workflows/README.md`, `Quality/*.md`, `Skills/README.md`, `Templates/Full/README.md`, `agents/system.md`), a ideologia do Nébula pode ser resumida assim:

1. O projeto precisa de uma fonte oficial de verdade em `Docs/`.
2. Toda mudança precisa nascer de escopo explícito, task rastreável e workflow definido.
3. Execução humana e por IA deve seguir a mesma governança.
4. Qualidade não é só teste; é controle de escopo, estrutura, review e validação final.
5. A documentação não é acessória; ela governa projeto, execução e decisão.
6. Cada task deve ter evidência de conclusão.
7. A previsibilidade operacional vale mais do que velocidade improvisada.

Em uma frase: o Nébula transforma desenvolvimento em um sistema governado por artefatos, políticas e trilha de execução.

### Ideologia central do Braito

Pelos arquivos do seu projeto (`README.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL_AND_SCHEMA.md`), a ideologia do Braito é:

1. O código deve ser interpretado primeiro por sinais determinísticos.
2. O LLM entra no fim, só para síntese, não para ser fonte primária da verdade.
3. O conhecimento operacional deve ser separado do código, em sidecars.
4. O contexto precisa ser auditável, incremental e consumível por agentes.
5. O repositório deve gerar contexto objetivo para review, onboarding, manutenção e impacto.

Em uma frase: o Braito transforma o código existente em contexto operacional estruturado e auditável.

---

## Comparação Direta

### Onde os dois convergem

1. Ambos querem reduzir improviso.
2. Ambos tratam IA como parte do processo, não como autoridade absoluta.
3. Ambos valorizam rastreabilidade.
4. Ambos se preocupam com qualidade real de produção.
5. Ambos tentam criar contexto reutilizável para execução técnica.

### Onde eles divergem

1. O Nébula começa antes do código.
Linha de pensamento: brief, escopo, arquitetura, tasks, workflow, validação.

2. O Braito começa no código já existente.
Linha de pensamento: scanner, AST, grafo, git, testes, síntese, sidecar.

3. O Nébula governa o processo.
4. O Braito observa e sintetiza o estado do sistema.
5. O Nébula usa documentação como input principal.
6. O Braito usa código, git e testes como input principal.

### Diferença estrutural principal

O Nébula é prescritivo.
O Braito é descritivo.

Isso é a diferença mais importante do estudo.

- Nébula diz: `como o time deve trabalhar`.
- Braito diz: `o que o sistema mostra sobre como esse código funciona`.

---

## Oportunidade Real Para o Braito

A melhor adaptação não é transformar o Braito em clone do NebulaSpecKit.

A melhor adaptação é fazer o Braito incorporar a camada de governança do Nébula em três níveis:

1. `Project governance` — o Braito entender e expor artefatos de projeto, não só arquivos de código.
2. `Task intelligence` — o Braito entender plano, tasks, workflows e evidências.
3. `Decision traceability` — o Braito conectar código alterado com contrato, arquitetura, docs e validação.

Em outras palavras:

Hoje o Braito responde muito bem `o que este arquivo faz?`.

Com a ideologia do Nébula aplicada, ele também passaria a responder:

- `por que isso existe?`
- `qual task originou isso?`
- `qual contrato/documento governa essa área?`
- `qual workflow deveria ser seguido?`
- `quais evidências faltam para considerar essa mudança pronta?`

---

## Mapeamento Conceitual

### Nébula -> Braito

1. `Docs/brief.md`, `Docs/project.md`, `Docs/stack.md`
No Braito: podem alimentar contexto de projeto e enriquecer `get_architecture_context`.

2. `Docs/architecture.md`, `Docs/contract.yaml`, `Docs/structure.md`
No Braito: podem virar fontes de evidência documental no note schema e no impacto.

3. `Docs/plan.md`, `Docs/tasks.md`, `Docs/control.md`
No Braito: podem virar uma camada nova de inteligência de execução.

4. `Workflows/*.md`
No Braito: podem sustentar recomendação de workflow por tipo de mudança.

5. `Skills/*.md`
No Braito: podem sustentar prompts/contexto para agentes MCP ou `init --agent`.

6. `Quality/*.md`
No Braito: podem sustentar review estruturado, validação de task e classificação de risco de mudança.

7. `agents/*.md`
No Braito: podem virar perfis de contexto para agentes consumidores do MCP.

---

## Proposta de Implementação no Braito

### Direção recomendada

Adotar a ideologia do Nébula como uma nova camada opcional do Braito: `governance-aware analysis`.

Isso preserva a identidade do projeto e evita inflar o escopo base para quem só quer sidecars por arquivo.

### Fase 1. Document Intelligence

Adicionar leitura opcional de artefatos de governança do projeto.

Arquivos-alvo:

- `Docs/brief.md`
- `Docs/project.md`
- `Docs/stack.md`
- `Docs/architecture.md`
- `Docs/contract.yaml`
- `Docs/structure.md`
- `Docs/plan.md`
- `Docs/tasks.md`
- `Docs/control.md`
- `Quality/*.md`
- `Workflows/*.md`
- `Skills/*.md`

Capacidades novas:

1. Detectar se o projeto usa convenção estilo Nébula.
2. Extrair fontes de verdade por domínio.
3. Indexar artefatos documentais junto com o índice atual.
4. Permitir evidência do tipo `doc` com origem real mais forte.
5. Enriquecer `get_architecture_context` com contexto vindo de docs oficiais.

Implementação sugerida:

- Novo módulo: `src/core/docs/`
- Novo loader: `loadGovernanceContext.ts`
- Novo tipo: `ProjectGovernanceContext`
- Novo campo opcional no índice: `governance`

### Fase 2. Task Intelligence

Objetivo: aproximar Braito da lógica de execução rastreável do Nébula.

Capacidades novas:

1. Ler `Docs/tasks.md` e mapear:
   - task id
   - status
   - arquivos tocados
   - commit hash
   - evidências
   - workflow associado
2. Relacionar arquivos do código com tasks históricas.
3. Responder via MCP perguntas como:
   - `qual task alterou essa área?`
   - `quais arquivos desta task ainda não têm cobertura?`
   - `quais evidências faltam para fechar a task?`

Ferramentas MCP candidatas:

- `get_task_context(taskId)`
- `get_file_governance(path)`
- `get_change_readiness(path | taskId)`

### Fase 3. Workflow Recommendation

Objetivo: o Braito deixar de ser só observador e passar a orientar execução.

Capacidades novas:

1. Inferir tipo de mudança pelo diff ou área tocada:
   - feature
   - bug fix
   - refactor
   - contract change
   - integration
2. Sugerir workflow aplicável.
3. Sugerir documentos obrigatórios a consultar antes da mudança.
4. Sugerir validações obrigatórias para fechar a mudança.

Ferramentas MCP candidatas:

- `suggest_workflow(paths[])`
- `get_required_docs(changeType)`
- `review_against_quality_gate(paths[])`

### Fase 4. Review Governado

Objetivo: aplicar `review-checklist.md` e `validation-rules.md` como inteligência operacional do Braito.

Capacidades novas:

1. Revisão baseada em eixos formais.
2. Resultado estruturado: `OK`, `Attention`, `Limit`, `Critical`.
3. Classificação de outcome: `Approved`, `Approved with Attention`, `Changes Requested`, `Critical`.
4. Cruzamento entre diff, métricas estáticas, dependências e docs.

Isso combina extremamente bem com o que o Braito já tem:

- AST
- graph
- git signals
- coverage
- criticality
- business rules extraction

O Braito já possui metade dos insumos para isso.

### Fase 5. Spec Mode

Aqui está a camada mais alinhada ao pedido de “mesmos conceitos aplicados”.

Criar um modo opcional no Braito para inicializar uma estrutura inspirada no Nébula em qualquer projeto.

Exemplo de comando:

```bash
bun src/cli/index.ts init --spec-gpt
```

Esse modo poderia gerar:

- `Docs/brief.md`
- `Docs/project.md`
- `Docs/stack.md`
- `Docs/architecture.md`
- `Docs/contract.yaml`
- `Docs/plan.md`
- `Docs/tasks.md`
- `Docs/control.md`
- `Quality/validation-rules.md`
- `Workflows/README.md`
- `Skills/README.md`

Mas com identidade do Braito, não como cópia literal.

---

## Conceitos do Nébula que Valem Muito a Pena Adotar

### 1. Fonte oficial de verdade por domínio

Por que vale adotar:

- reduz ambiguidade
- melhora consistência entre IA e humano
- cria rastreabilidade entre requisito, contrato e código

Aplicação no Braito:

- cada nota de arquivo pode apontar `sourceOfTruth`
- MCP pode responder qual documento governa uma área

### 2. Workflow por tipo de mudança

Por que vale adotar:

- torna execução mais previsível
- ajuda agentes a não pular etapas
- é excelente para PR review e automação

Aplicação no Braito:

- análise de diff + sugestão de workflow + checklist de fechamento

### 3. Fechamento de task com evidência

Por que vale adotar:

- força disciplina operacional
- cria histórico útil para manutenção
- conecta documentação com entrega real

Aplicação no Braito:

- índice de tasks
- tool MCP de prontidão de entrega

### 4. Quality Gate explícito

Por que vale adotar:

- evita que “passou no teste” seja confundido com “está bom”
- ajuda revisão por IA a ficar menos subjetiva

Aplicação no Braito:

- review estruturado com resultado formal

### 5. Separação entre template e artefato oficial

Por que vale adotar:

- evita que modelo vazio vire documentação “falsa”
- preserva a noção de documento oficial vivo

Aplicação no Braito:

- se houver `init --spec-gpt`, gerar templates e artefatos com distinção explícita

---

## Conceitos do Nébula que Eu Adotaria com Moderação

### 1. Regra rígida de `1 task = 1 commit`

Prós:

- rastreabilidade excelente
- histórico fácil de auditar

Contras:

- rígido demais para fluxo real de exploração
- pode atrapalhar ajustes pequenos ou refactors auxiliares
- nem todo repositório trabalha bem com granularidade tão estrita

Sugestão para o Braito:

- tratar como recomendação ou policy configurável, não regra central fixa

### 2. Bootstrap estrutural só na Task 1

Prós:

- evita crescimento caótico de árvore de arquivos
- força estrutura pensada antes de implementação

Contras:

- pouco flexível para projetos vivos
- ruim para evolução incremental tardia

Sugestão para o Braito:

- adaptar como “mudanças estruturais devem ser explícitas e rastreadas”, não necessariamente restritas à task 1

### 3. Forte dependência de documentação manual

Prós:

- governança clara
- excelente para equipes grandes e ambientes regulados

Contras:

- alto custo de manutenção
- pode gerar documentação desatualizada se o processo não for disciplinado

Sugestão para o Braito:

- usar o Braito para reduzir esse custo, cruzando docs e implementação e sinalizando divergências

---

## Prós de Aplicar a Ideologia no Braito

1. O Braito deixa de ser apenas um gerador de sidecars e passa a ser uma camada de governança assistida.
2. O MCP fica muito mais valioso para agentes autônomos.
3. O projeto ganha um posicionamento mais forte: não só “entender código”, mas “operar software com contexto e governança”.
4. Você cria um diferencial claro frente a ferramentas que só fazem RAG em código.
5. O Braito pode conectar requisito, contrato, código, risco e validação em uma mesma superfície.

---

## Contras e Riscos

1. Escopo do produto cresce bastante.
2. O projeto pode perder foco se tentar virar framework de gestão completo de uma vez.
3. Parsing de documentação livre em Markdown pode ser frágil sem convenções mínimas.
4. Há risco de inflar a complexidade do schema e do MCP cedo demais.
5. Se a camada documental virar obrigatória, você piora a adoção em projetos menores.

Mitigação recomendada:

- tudo deve ser opcional e detectável por convenção
- começar com leitura e enriquecimento, não com enforcement pesado

---

## Diferenças que Devem Permanecer

Para não descaracterizar o Braito, estas diferenças devem continuar existindo:

1. O Braito deve continuar `code-first`.
2. O LLM deve continuar na borda, não no centro.
3. A verdade observável deve continuar vindo de código, git, testes e docs reais.
4. O sidecar por arquivo deve continuar sendo o artefato principal.
5. A governança documental deve ser camada complementar, não pré-requisito universal.

---

## Arquitetura Alvo Recomendada

### Modelo conceitual

```text
repo
  -> scanner
  -> code analyzers
  -> graph engine
  -> git intelligence
  -> test intelligence
  -> governance/docs intelligence
  -> static note
  -> review/readiness synthesis
  -> MCP/UI/sidecars
```

### Novos módulos sugeridos

```text
src/core/governance/
  detectGovernanceModel.ts
  loadGovernanceContext.ts
  parseTasks.ts
  parsePlan.ts
  parseControl.ts
  resolveSourceOfTruth.ts
  suggestWorkflow.ts
  reviewQualityGate.ts
```

### Novos tipos sugeridos

```ts
type GovernanceContext = {
  model: 'none' | 'nebula-like'
  docs: GovernanceDoc[]
  workflows: WorkflowSpec[]
  qualityRules: QualityRule[]
  tasks: TaskRecord[]
}

type TaskRecord = {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done' | 'blocked'
  workflow?: string
  filesTouched: string[]
  commitHash?: string
  evidence: string[]
}
```

---

## Roadmap Recomendado

### Etapa 1

Adicionar leitura opcional de `Docs/`, `Workflows/`, `Skills/`, `Quality/` e enriquecer `get_architecture_context`.

Baixo risco, alto valor.

### Etapa 2

Adicionar novas tools MCP:

- `get_file_governance`
- `get_task_context`
- `suggest_workflow`

### Etapa 3

Criar review governado usando `Quality/review-checklist.md` e sinais já existentes do Braito.

### Etapa 4

Criar `init --spec-gpt` para bootstrap opcional de estrutura documental inspirada no Nébula.

### Etapa 5

Criar detecção de divergência entre documentação oficial e implementação real.

Esse ponto é especialmente forte para o Braito, porque combina perfeitamente com a proposta do produto.

---

## Conclusão

O `NebulaSpecKit` não deve ser copiado literalmente para o `braito`.

A ideologia que vale absorver é:

1. governança por fontes oficiais
2. execução guiada por workflow
3. qualidade formalizada
4. task com evidência
5. alinhamento entre humano, IA, documentação e código

O melhor encaixe para o Braito é virar um analisador `governance-aware`.

Ou seja:

- hoje ele entende o código
- amanhã ele pode entender também o processo que governa esse código

Essa combinação é forte porque junta duas coisas raramente bem resolvidas ao mesmo tempo:

1. contexto técnico observado
2. contexto operacional prescrito

Se implementado com moderação e como camada opcional, isso pode elevar o Braito de um gerador de notas para uma plataforma de contexto operacional e governança assistida.

---

## Recomendação Final

Se eu fosse priorizar de forma pragmática, faria nesta ordem:

1. `governance/docs intelligence`
2. `task intelligence`
3. `workflow recommendation`
4. `quality gate review`
5. `init --spec-gpt`

Essa ordem preserva o DNA do Braito e aplica os melhores conceitos do Nébula sem transformar o projeto em outra coisa.
