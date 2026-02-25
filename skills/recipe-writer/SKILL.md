---
name: recipe-writer
description: Create recipe markdown files for this repository in content/recipes/en and content/recipes/nl. Use when adding new recipes that must match existing tone and schema, including required keys (title, description, ingredients, instructions, created), dd-MM-yyyy dates, underscore slugs, and optional Dutch output with the same slug.
---

# Recipe Writer

## Overview

Write repo-ready recipe markdown files that match this project's schema, structure, and writing style. Default to English output. Add Dutch output only when requested. Read [references/schema.md](references/schema.md) for strict content constraints and [references/style.md](references/style.md) for tone and formatting patterns.

## Workflow

1. Collect missing high-impact inputs only:
   - dish or recipe concept
   - output language scope (`en` default, optional `en+nl`)
   - dietary constraints or exclusions
   - optional `category` and `tags`
2. Draft a title and derive a slug:
   - lowercase with underscores
   - letters, numbers, and underscores only
   - collapse repeated separators
   - trim leading and trailing separators
3. Choose output path:
   - default: `content/recipes/en/<slug>.md`
   - if Dutch is requested: also `content/recipes/nl/<slug>.md`
4. Build frontmatter and markdown body:
   - set `created` to current local date in `dd-MM-yyyy` unless user provides a date
   - include required keys every time
   - include optional keys only when valid and available
5. Write file(s) in place.
6. Run the quality checklist before finalizing.

## Input Contract

Required inputs:
- recipe concept or dish name
- language scope (`en` default)
- any strict dietary/allergen constraints

Optional inputs:
- `category`
- `tags`
- explicit `created` date
- `image` path
- flavor profile, cuisine, or serving context

Ask only for missing items that materially affect correctness.

## Output Contract

Each recipe file must:
- be written to `content/recipes/<lang>/<slug>.md` where `<lang>` is `en` or `nl`
- include valid YAML frontmatter with required keys:
  - `title` (string)
  - `description` (string)
  - `ingredients` (array of strings, or grouped object of string arrays)
  - `instructions` (array of strings)
  - `created` (`dd-MM-yyyy`)
- include optional keys only when relevant:
  - `description_long` (two short paragraphs)
  - `image` (only if explicitly provided or confidently inferred from real repo asset path/URL)
  - `category`
  - `tags`
- include markdown body:
  - `# <title>`
  - one short intro paragraph aligned with existing recipe tone

Ingredient rules:
- use a flat ingredient array by default
- use grouped ingredients object only for multi-component recipes (for example `sauce`, `filling`, `toppings`)

Internal link rules:
- when linking another recipe inside ingredient text, use `/recipes/<slug>`
- preserve exact slug and do not add language prefix

## Language Handling (EN default, optional NL)

- generate English by default
- generate Dutch only when requested
- when generating both EN and NL:
  - keep identical slug in both files
  - keep key structure aligned
  - translate user-facing text naturally
  - keep `created` the same unless user explicitly requests otherwise

## Quality Checklist

Before finalizing, verify:
- slug uses underscore style and filename matches slug
- required frontmatter keys are present
- `created` matches `dd-MM-yyyy`
- `ingredients` is valid (flat list or grouped object)
- `instructions` is a non-empty array
- markdown body includes heading and short intro paragraph
- optional `image` is not fabricated
- EN/NL outputs (when requested) share the same slug and expected paths
