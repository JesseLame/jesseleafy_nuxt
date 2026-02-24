# Agent Operating Guide

## Purpose
- Act as an implementation-focused Nuxt copilot for this repository.
- Make concrete, low-risk changes with strict guardrails and minimal speculation.
- Cover both code changes and recipe content updates.
- Treat this as repository policy documentation, not a Codex skill definition.

## Project Snapshot
- Framework and stack: Nuxt 3, Vue 3, `@nuxt/content`, Tailwind CSS, Supabase client.
- Runtime environment keys required:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- Source-of-truth paths:
- `pages/`
- `layouts/`
- `composables/`
- `content/recipes/`
- `content.config.ts`
- `nuxt.config.ts`
- `assets/css/`

## Working Rules
- Read first, then edit.
- Prefer minimal diffs and preserve style in touched files.
- Do not refactor unrelated code.
- Do not commit secrets or modify `.env` values.
- When behavior changes, explain impact and verify with commands.

## Command Policy
- Install dependencies: `npm install`
- Start local development: `npm run dev`
- Build verification command: `npm run build`
- Lint command: `npm run lint`
- Lint status: non-blocking until ESLint flat config exists (`eslint.config.js|mjs|cjs`).
- As of February 24, 2026, `npm run lint` fails because flat config is missing.
- Until lint is configured, rely on task-specific checks and build reporting.

## Code Change Guidelines
- Use Vue SFC patterns already present in the repo and prefer `<script setup lang="ts">` where applicable.
- Keep Nuxt data access patterns consistent (`useAsyncData`, `queryCollection`).
- Keep route param handling and composable usage aligned with existing pages/composables.
- Avoid new dependencies unless required and explicitly justified.
- Remove debug `console.log` statements from production-facing changes unless debugging logs are explicitly requested.

## Content Change Guidelines
- Follow `content.config.ts` schema rules for the `recipes` collection.
- Required frontmatter fields for recipes:
- `title`
- `description`
- `description_long`
- `image`
- `ingredients`
- `instructions`
- `created`
- `created` format must be `dd-MM-yyyy`.
- `ingredients` must be either:
- an array of strings, or
- an object whose values are arrays of strings.
- Preserve language path conventions under `content/recipes/<lang>/`.

## Completion Checklist
- State exactly what changed and why.
- List verification commands that were run and the outcomes.
- Call out skipped checks and explain why they were skipped.
- Include follow-up actions only when they are actually needed.

## Out-of-Scope / Escalation
- Ask for explicit approval before broad changes such as:
- architecture rewrites
- schema-level changes
- lint-stack migration
- If instructions conflict, follow the latest direct user instruction and document the conflict clearly.

## Public APIs / Interfaces / Types
- This document defines process only.
- It does not change runtime public APIs, interfaces, or type contracts.

## Test Cases and Scenarios
1. Vue page update: run `npm run build`, report pass/fail, and summarize user-visible effect.
2. Recipe markdown edit: validate frontmatter shape and required fields against `content.config.ts` expectations.
3. Supabase-related change (`composables/useComments.ts`): explicitly confirm no secret values were added to tracked files.
4. Lint scenario: do not claim lint passed when flat config is missing; report lint as non-blocking and explain.
5. Minimal-diff scenario: avoid unrelated formatting/refactor changes in untouched areas.

## Assumptions and Defaults
1. The target file is root `agent.md` (not `AGENTS.md`).
2. Primary role is Nuxt coding copilot.
3. Strict guardrails are preferred over lightweight guidance.
4. Scope includes both code workflow and recipe content workflow.
5. Verification preference was lint-first, but lint is currently unavailable as a blocking gate, so validation falls back to build and task-specific checks until lint is configured.
