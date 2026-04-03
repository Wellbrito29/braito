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

- esqueleto do código (assinaturas exportadas com JSDoc, definições de tipos, comentários especiais)
- imports e exports com assinaturas tipadas
- dependências reversas mais relevantes
- sinais de git (churn, commits recentes, arquivos co-modificados)
- testes relacionados e cobertura
- comentários especiais: `DECISION`, `INVARIANT`, `WHY`, `HACK`, `TODO`, `FIXME`
- contexto do domínio
- score de criticidade

## O que não fazer

- mandar o repo inteiro
- pedir inferência sem evidência
- pedir "resuma o arquivo" sem contexto
- usar as primeiras N linhas (geralmente só imports)
- misturar dezenas de arquivos sem necessidade

## Regras de prompt

### System prompt

```
Você é um analista de software gerando notas operacionais para arquivos individuais.

Regras por campo:

purpose: descreva o PAPEL do arquivo no sistema e POR QUE ele existe.
  RUIM: "Exporta: buildBasicNote"
  BOM: "Constrói o AiFileNote estático a partir de análise AST, sinais de grafo e git"

invariants: contratos específicos que chamadores ou o runtime devem manter.
  RUIM: "Input deve ser válido"
  BOM: "filePath deve ser um caminho absoluto — a função assume que o arquivo existe"

importantDecisions: preencha SOMENTE quando houver sinal concreto.
  RUIM: "O desenvolvedor provavelmente escolheu esse padrão por performance"
  BOM: "Commit: 'switched from axios to fetch because of bundle size'"
```

Quando `language` é diferente de inglês, uma instrução adicional é adicionada:

```
- Escreva todo o conteúdo de texto em <idioma>.
```

## Regras de qualidade

1. Evidência obrigatória para afirmações importantes
2. Confiança numérica sempre presente
3. Campos podem ficar vazios
4. `importantDecisions` deve ser conservador
5. `knownPitfalls` pode usar sinais de churn e TODOs
6. `impactValidation` deve priorizar consumidores reais e testes

## Estratégia de custo

- cache por hash de arquivo + sinais
- limitar síntese a arquivos relevantes ou críticos (`criticalityScore >= llmThreshold`)
- permitir execução incremental

## Referência de confiança

- 0.90+ quando há import, uso e teste claros
- 0.70–0.89 quando há boa evidência, mas alguma inferência
- 0.40–0.69 quando depende de heurística ou git parcial
- abaixo de 0.40 quando há pouca evidência
