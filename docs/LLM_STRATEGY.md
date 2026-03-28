# Estratégia de LLM

## Papel do modelo

O LLM não deve ser responsável por descobrir tudo sozinho. Ele deve receber evidências preparadas e sintetizar uma nota confiável e útil.

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
- testes relacionados
- comentários especiais
- contexto do domínio
- score de criticidade

## O que não fazer

- mandar o repo inteiro
- pedir inferência sem evidência
- pedir “resuma o arquivo” sem contexto
- misturar dezenas de arquivos sem necessidade

## Regras de prompt

### System prompt sugerido

```text
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

### User prompt sugerido

```text
Analise o arquivo abaixo e gere uma nota operacional.

Arquivo: [path]

Contexto estático:
[json]

Dependências reversas:
[list]

Sinais do Git:
[json]

Testes relacionados:
[json]

Contexto do domínio:
[text]

Código:
```ts
[source]
```

Retorne JSON com:
- purpose
- invariants
- sensitiveDependencies
- importantDecisions
- knownPitfalls
- impactValidation

Cada campo deve conter:
- observed
- inferred
- confidence
- evidence
```

## Regras de qualidade

1. evidência obrigatória para afirmações importantes
2. confiança numérica sempre presente
3. campos podem ficar vazios
4. `importantDecisions` deve ser conservador
5. `knownPitfalls` pode usar sinais de churn e TODOs
6. `impactValidation` deve priorizar consumidores reais e testes

## Recomendações práticas

- usar temperature baixa
- usar schema rígido
- validar JSON com `zod`
- descartar respostas fora do schema
- reprocessar apenas arquivos alterados

## Estratégia de custo

- cache por hash de arquivo + sinais
- limitar síntese a arquivos relevantes ou críticos
- permitir execução incremental

## Estratégia de confiança

Sugestão informal:

- 0.90+ quando há import, uso e teste claros
- 0.70–0.89 quando há boa evidência, mas alguma inferência
- 0.40–0.69 quando depende de heurística ou Git parcial
- abaixo de 0.40 quando há pouca evidência
