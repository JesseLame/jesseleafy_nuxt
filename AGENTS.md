# AGENTS.md instructions for /Users/jesselamerigts/WebDev/jesseleafy_nuxt

## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.

### Available skills
- skill-creator: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: /Users/jesselamerigts/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: /Users/jesselamerigts/.codex/skills/.system/skill-installer/SKILL.md)
- recipe-writer: Create recipe markdown files for this repository in `content/recipes/en` and `content/recipes/nl`. Use when adding new recipes that must match existing tone and schema, including required keys (`title`, `description`, `ingredients`, `instructions`, `created`), flat or sectioned ingredient/instruction groups, `dd-MM-yyyy` dates, underscore slugs, and optional Dutch output with the same slug. (file: /Users/jesselamerigts/WebDev/jesseleafy_nuxt/skills/recipe-writer/SKILL.md)
- recipe-nl-backfill: Find recipes that exist only in English and backfill Dutch recipes by creating missing `nl` markdown files. Use when you need to translate EN-only recipes, sync missing `nl` recipe files, or run a Dutch recipe backfill safely with preview-before-write confirmation. (file: /Users/jesselamerigts/WebDev/jesseleafy_nuxt/skills/recipe-nl-backfill/SKILL.md)

### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) When `SKILL.md` references relative paths (e.g., `scripts/foo.py`), resolve them relative to the skill directory listed above first, and only consider other paths if needed.
  3) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  4) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  5) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.

## Repo Operating Guide

### Purpose
- Act as an implementation-focused Nuxt copilot for this repository.
- Make concrete, low-risk changes with minimal speculation.
- Cover both application code changes and recipe content updates.
- Treat this section as repository policy, separate from the Skills definitions above.

### Project Snapshot
- Stack: Nuxt 3, Vue 3, `@nuxt/content`, Tailwind CSS, and a manually created Supabase client.
- Preferred package manager: `npm`, because `package-lock.json` is committed.
- Main source-of-truth paths:
  - `pages/`
  - `layouts/`
  - `composables/`
  - `content/recipes/`
  - `content.config.ts`
  - `nuxt.config.ts`
  - `assets/css/`
- Runtime language contract in code: `RecipeLang = 'en' | 'nl'`.
- Canonical recipe detail implementation: `pages/recipes/[lang]/[slug].vue`.
- `pages/testPage.vue` exists, but it is not the source of truth for recipe-detail behavior.
- Do not assume `@nuxtjs/supabase` is configured in Nuxt just because it is installed; the current comment flow is built around a raw `@supabase/supabase-js` client in `composables/useComments.ts`.

### Working Rules
- Read first, then edit.
- Prefer minimal diffs and preserve style in touched files.
- Avoid broad formatting passes; the repo has mixed formatting and no committed formatter config.
- Do not refactor unrelated code.
- Do not commit secrets or modify `.env` values.
- When behavior changes, explain the user-visible impact and verify with commands.

### Deployment and Secrets
- The production app is deployed on Vercel from the GitHub branch connected to the Vercel project.
- Local development uses the untracked root `.env`; deployed environments use Vercel project environment variables rather than tracked repo files.
- Use `.env.example` as the placeholder/reference file only; never commit real secret values.
- Preferred runtime variables for new work and new documentation are:
  - `NUXT_PUBLIC_SUPABASE_URL`
  - `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NUXT_SUPABASE_SECRET_KEY`
- Legacy aliases may still exist in code as compatibility fallbacks, but new setup should use the `NUXT_*` names above.
- Never move the secret key into `runtimeConfig.public`, client code, or tracked files.

### Command Policy
- Install dependencies: `npm install`
- Start local development: `npm run dev`
- Primary verification command: `npm run build`
- Lint command: `npm run lint`
- As of April 12, 2026, `npm run lint` fails because ESLint 9 is installed but the repo does not contain an `eslint.config.js`, `eslint.config.mjs`, or `eslint.config.cjs`.
- No formatter config is currently committed.
- No test runner config is currently committed.
- Until lint and automated tests are configured, rely on `npm run build` plus task-specific checks and careful reporting.

### Code Change Guidelines
- Reuse the Nuxt/Vue patterns already present in the repo.
- Prefer `<script setup lang="ts">` when editing or adding typed Vue files.
- Keep data fetching aligned with existing usage of `useAsyncData` and `queryCollection`.
- Keep route-param handling and composable usage aligned with `pages/recipes/index.vue`, `pages/recipes/[lang]/[slug].vue`, and `composables/useRecipeLanguage.ts`.
- Treat `pages/recipes/[lang]/[slug].vue` as the canonical recipe-detail implementation, not `pages/testPage.vue`.
- Avoid new dependencies unless they are necessary and explicitly justified.
- Remove debug `console.log` statements from production-facing changes unless debugging output was explicitly requested.

### Content Change Guidelines
- Follow the `recipes` collection schema in `content.config.ts`.
- Required frontmatter keys:
  - `title`
  - `description`
  - `ingredients`
  - `instructions`
  - `created`
- Optional frontmatter keys allowed by the current schema:
  - `description_long`
  - `image`
  - `tags`
  - `categories`
  - `category`
- Keep `created` in `dd-MM-yyyy` format.
- `ingredients` must remain either:
  - an array of strings, or
  - an object whose values are arrays of strings.
- `instructions` must remain either:
  - an array of strings, or
  - an object whose values are arrays of strings.
- Keep recipe files under `content/recipes/<lang>/<slug>.md`, where `<lang>` is `en` or `nl`.
- If a recipe exists in both languages, keep the slug identical across `en` and `nl`.
- Use internal recipe links as `/recipes/<slug>` so they stay compatible with runtime normalization in `pages/recipes/[lang]/[slug].vue`.
- When adding filter metadata, prefer `category` because `pages/recipes/index.vue` currently filters on `category`; `categories` is allowed by schema but not used by the current list UI.
- Use real image paths from existing repo assets, typically under `/images/...`, and do not invent image values.
- English and Dutch recipe filenames are currently in parity; do not hardcode stale coverage claims into this file.
- If future one-language recipes are introduced, preserve the current safe translation-unavailable behavior in `pages/recipes/[lang]/[slug].vue` instead of introducing broken routing.

### State and Runtime Contracts
- Runtime environment variables currently used by the app:
  - `NUXT_PUBLIC_SUPABASE_URL`
  - `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NUXT_SUPABASE_SECRET_KEY`
- Legacy aliases may still appear as compatibility fallbacks in code, but they are not the preferred contract for new work.
- Persisted client-side storage keys currently in use:
  - `recipe_language`
  - `groceries`
- `recipe_language` is managed by `composables/useRecipeLanguage.ts`.
- `groceries` is written from `pages/recipes/[lang]/[slug].vue` and read from `pages/list.vue`.
- Existing language support is `RecipeLang = 'en' | 'nl'`; do not expand language handling casually.

### Public APIs / Interfaces / Types
- This file documents repository process only; it does not change runtime APIs.
- Existing contracts to preserve include:
  - `RecipeLang = 'en' | 'nl'`
  - `NUXT_PUBLIC_SUPABASE_URL`
  - `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NUXT_SUPABASE_SECRET_KEY` as a server-only runtime secret
  - the `recipes` frontmatter schema in `content.config.ts`
  - the client persistence keys `recipe_language` and `groceries`

### Completion Checklist
- State exactly what changed and why.
- List the commands that were run and their outcomes.
- Call out skipped checks and explain why they were skipped.
- Never claim `npm run lint` passed while flat ESLint config is still missing.
- Mention whether EN/NL recipe parity changed.
- If the change touches recipe detail, listing, or localization behavior, verify language switching for at least one existing translated slug.
- If the change introduces one-language content or touches translation-fallback behavior, verify that translation-unavailable behavior remains safe.
- If the change touches recipe markdown, validate frontmatter shape and `created` formatting against `content.config.ts`.
- If the change touches comments or Supabase-related code, explicitly confirm that no secret values were added to tracked files.

### Edge Cases and Failure Modes
- Slug mismatches between translated recipes can surface false missing-translation behavior.
- Internal recipe links can resolve to dead routes when the linked slug does not exist in the active language.
- Changing the `recipe_language` or `groceries` keys can silently break persisted client state.
- Assuming Nuxt Supabase module integration where the repo actually uses a raw client can lead to incorrect edits.

### Out-of-Scope / Escalation
- Ask before making broad changes such as architecture rewrites, schema changes, lint-stack migration, or adding recipe languages beyond `en` and `nl`.
- If repository policy conflicts with a direct user instruction, follow the direct user instruction and document the conflict clearly.
