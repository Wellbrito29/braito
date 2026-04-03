# Project Description

## Vision

`braito` (AI File Notes) is a tool for generating operational memory per file in large codebases. The intent is not to create a per-file changelog, but a layer of practical knowledge for humans and AI agents.

Instead of just answering "what does this file do?", the tool tries to answer:

- what is the purpose of the file
- what must not be broken
- which dependencies require care
- what decisions appear to have been made
- what risks or pitfalls exist
- where to validate impact before shipping a change

## Problem it solves

Large projects accumulate:

- implicit couplings
- undocumented contracts
- forgotten decisions
- "sensitive" files that look simple
- rework for onboarding and maintenance
- difficulty for AI to understand the real project context

This tool reduces that cost by generating actionable notes per file.

## What it is not

- does not replace ADRs
- does not replace PRs and Git history
- is not complete functional documentation
- must not invent architecture without evidence
- must not try to understand the entire system at once

## Target audience

- engineering teams with monorepos
- mobile/web/backend squads with shared code
- teams using Copilot, Cursor, or internal AI agents
- tech leads who want to reduce the risk of lateral changes

## Ideal use cases

- central hook used by multiple screens
- adapter between API and UI
- search/recommendation service
- file with high churn in Git
- central reducers/stores/contexts
- critical design system components
- gateways for analytics, feature flags, env vars, and authentication

## Value proposition

### For humans

- faster onboarding
- less time to understand critical files
- lower risk of hidden impact
- support for code review

### For AI agents

- better grounding per file
- richer context for vibe coding
- less need for large prompts
- lower chance of changes breaking lateral flows
