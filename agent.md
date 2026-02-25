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
- Language support and availability:
  - Runtime language contract in code is `RecipeLang = 'en' | 'nl'`.
  - Supported recipe languages are `en` and `nl`.
  - Dutch (`nl`) coverage is currently partial and is acceptable by policy.
  - Language behavior source-of-truth files:
    - `composables/useRecipeLanguage.ts`
    - `pages/recipes/index.vue`
    - `pages/recipes/[lang]/[slug].vue`
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
- Schema and frontmatter rules:
  - Follow `content.config.ts` schema rules for the `recipes` collection.
  - Required fields:
    - `title`
    - `description`
    - `ingredients`
    - `instructions`
    - `created`
  - Optional fields allowed by schema:
    - `description_long`
    - `image`
    - `tags`
    - `categories`
    - `category`
  - `created` format must be `dd-MM-yyyy`.
  - `ingredients` must be either:
    - an array of strings, or
    - an object whose values are arrays of strings.
- Language path invariants:
  - Recipe files must remain under `content/recipes/<lang>/<slug>.md`.
  - `<lang>` must be `en` or `nl`.
- Dutch availability policy:
  - English-first and Dutch-first recipe updates are both allowed.
  - Same-change translation parity is not required.
  - If the target-language recipe is missing, preserve current translation-unavailable behavior in `pages/recipes/[lang]/[slug].vue` instead of introducing broken routing behavior.
- Slug and translation conventions:
  - If a translation exists in both languages, slug must match across `en` and `nl`.
  - New Dutch translations should reuse the existing English slug.
- Internal recipe-link conventions:
  - Keep markdown recipe links compatible with runtime normalization in `pages/recipes/[lang]/[slug].vue`.
  - Do not knowingly add internal recipe links that resolve to non-existent active-language recipe routes.

## Completion Checklist
- State exactly what changed and why.
- List verification commands that were run and the outcomes.
- Call out skipped checks and explain why they were skipped.
- Verify one touched case where translation exists and language switching works (`en` <-> `nl`).
- Verify one touched case where translation is missing and behavior remains safe (translation-unavailable message, no broken routing flow).
- Report whether Dutch availability changed in the update (new translation added vs unchanged partial coverage).
- Include follow-up actions only when they are actually needed.

## Out-of-Scope / Escalation
- Ask for explicit approval before broad changes such as:
  - architecture rewrites
  - schema-level changes
  - lint-stack migration
  - adding recipe languages beyond `en` and `nl`
- If instructions conflict, follow the latest direct user instruction and document the conflict clearly.

## Public APIs / Interfaces / Types
- This document defines process only.
- It does not change runtime public APIs, interfaces, or type contracts.
- It references `RecipeLang = 'en' | 'nl'` as existing policy context only; it does not change that contract.

## Test Cases and Scenarios
1. Vue page update: run `npm run build`, report pass/fail, and summarize user-visible effect.
2. Existing translated slug case: verify switching `en` <-> `nl` routes successfully for a recipe available in both languages.
3. Missing translation case: verify language switching shows translation-unavailable messaging and remains safe for a recipe that exists in only one language.
4. Recipe list case: verify list/search/category behavior reflects only the active language subset.
5. Recipe markdown edit: validate frontmatter shape, required fields, and `created` date format against `content.config.ts` expectations.
6. Link normalization case: verify internal recipe links resolve using active-language route format and avoid knowingly dead internal links.
7. Supabase-related change (`composables/useComments.ts`): explicitly confirm no secret values were added to tracked files.
8. Lint scenario: do not claim lint passed when flat config is missing; report lint as non-blocking and explain.
9. Minimal-diff scenario: avoid unrelated formatting/refactor changes in untouched areas.

## Edge Cases and Failure Modes
- Slug mismatch between translated recipes can surface false missing-translation behavior.
- Internal markdown recipe links can become dead routes when the linked slug does not exist in the active language.
- Users switching to Dutch for EN-only recipes should get safe unavailability behavior, not broken navigation.
- New recipe additions can bypass language-path invariants if they are not reviewed against `content/recipes/<lang>/<slug>.md`.

## Assumptions and Defaults
1. The target file is root `agent.md` (not `AGENTS.md`).
2. Primary role is Nuxt coding copilot.
3. Document language remains English.
4. Strict guardrails are preferred over lightweight guidance.
5. Scope includes both code workflow and recipe content workflow.
6. Partial Dutch coverage is an accepted default.
7. Do not hardcode recipe coverage counts in policy text to avoid rapid staleness.
8. Verification preference was lint-first, but lint is currently unavailable as a blocking gate, so validation falls back to build and task-specific checks until lint is configured.
