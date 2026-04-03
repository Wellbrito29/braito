# LLM Strategy

## Role of the model

The LLM must not be responsible for discovering everything on its own. It receives prepared evidence and synthesizes a reliable, useful note.

## Main rule

**LLM at the edge, not at the center.**

The ideal pipeline is:

- deterministic analysis first
- probabilistic synthesis after

## What to send to the model

For each file:

- file content
- imports and exports
- most relevant reverse dependencies
- git signals
- related tests and coverage
- special comments
- domain context
- criticality score

## What not to do

- send the entire repo
- request inference without evidence
- ask "summarize the file" without context
- mix dozens of files unnecessarily

## Prompt rules

### System prompt

```
You are a software analyst specialized in generating operational notes per file.

Rules:
- Use only the provided evidence.
- Do not invent facts.
- Differentiate observed from inferred.
- Be technical and concise.
- Fill "importantDecisions" only if there are real signals in code, comments, docs, or Git.
- When something is unclear, reduce confidence and leave the field empty or partial.
- Return valid JSON following the requested schema.
```

## Quality rules

1. Evidence required for important claims
2. Numeric confidence always present
3. Fields may be empty
4. `importantDecisions` must be conservative
5. `knownPitfalls` may use churn signals and TODOs
6. `impactValidation` should prioritize real consumers and tests

## Practical recommendations

- use low temperature (0.2)
- use rigid schema (Zod validation)
- discard responses outside the schema
- reprocess only changed files

## Cost strategy

- cache by file hash + signals
- limit synthesis to relevant or critical files (`criticalityScore >= llmThreshold`)
- allow incremental execution

## Confidence guidelines

- 0.90+ when there are clear imports, usage, and tests
- 0.70–0.89 when there is good evidence but some inference
- 0.40–0.69 when it depends on heuristics or partial git signals
- below 0.40 when there is little evidence

---

# Estratégia de LLM

## Papel do modelo

O LLM não deve ser responsável por descobrir tudo sozinho. Ele recebe evidências preparadas e sintetiza uma nota confiável e útil.

## Regra principal

**LLM na borda, não no centro.**

A pipeline ideal é:

- análise determinística primeiro
- síntese probabilística depois

## O que mandar para o modelo

Para cada arquivo:

- conteúdo do arquivo
- imports e exports
- dependências reversas mais relevantes
- sinais de Git
- testes relacionados e cobertura
- comentários especiais
- contexto do domínio
- score de criticidade

## O que não fazer

- mandar o repo inteiro
- pedir inferência sem evidência
- pedir "resuma o arquivo" sem contexto
- misturar dezenas de arquivos sem necessidade

## Regras de prompt

### System prompt

```
Você é um analista de software especializado em gerar notas operacionais por arquivo.

Regras:
- Use apenas as evidências fornecidas.
- Não invente fatos.
- Diferencie observado de inferido.
- Seja técnico e conciso.
- Preencha "importantDecisions" apenas se houver sinais reais em código, comentários, docs ou Git.
- Quando algo não estiver claro, reduza a confiança e deixe o campo vazio ou parcial.
- Retorne JSON válido seguindo o schema solicitado.
```

## Regras de qualidade

1. Evidência obrigatória para afirmações importantes
2. Confiança numérica sempre presente
3. Campos podem ficar vazios
4. `importantDecisions` deve ser conservador
5. `knownPitfalls` pode usar sinais de churn e TODOs
6. `impactValidation` deve priorizar consumidores reais e testes

## Recomendações práticas

- usar temperature baixa (0.2)
- usar schema rígido (validação Zod)
- descartar respostas fora do schema
- reprocessar apenas arquivos alterados

## Estratégia de custo

- cache por hash de arquivo + sinais
- limitar síntese a arquivos relevantes ou críticos (`criticalityScore >= llmThreshold`)
- permitir execução incremental

## Referência de confiança

- 0.90+ quando há import, uso e teste claros
- 0.70–0.89 quando há boa evidência, mas alguma inferência
- 0.40–0.69 quando depende de heurística ou Git parcial
- abaixo de 0.40 quando há pouca evidência
