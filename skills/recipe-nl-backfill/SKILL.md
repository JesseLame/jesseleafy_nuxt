---
name: recipe-nl-backfill
description: Find recipes that exist only in English and backfill Dutch recipes by creating missing nl markdown files. Use when you need to translate EN-only recipes, sync missing `nl` recipe files, or run a Dutch recipe backfill safely with preview-before-write confirmation.
---

# Recipe NL Backfill

## Overview

Backfill missing Dutch recipe files from existing English source files in this repository. Always preview missing slugs first, ask for confirmation, and never overwrite existing Dutch files.

## Required Workflow

1. Detect EN-only slugs by running:
   - `skills/recipe-nl-backfill/scripts/list_missing_nl.sh <repo-root>`
2. Present a preview before writing:
   - total missing count
   - slug list preview (or full list when requested)
   - planned output paths in `content/recipes/nl/<slug>.md`
3. Ask explicit confirmation before any file creation.
4. For each missing slug after confirmation:
   - read `content/recipes/en/<slug>.md`
   - create `content/recipes/nl/<slug>.md`
   - keep the same slug and frontmatter shape
5. If a Dutch file already exists, skip it and do not overwrite.
6. Report a final summary:
   - `created`
   - `skipped`
   - `failed`

## Translation Rules

- Translate user-facing text naturally into Dutch.
- Preserve `created` exactly in `dd-MM-yyyy`.
- Preserve ingredient structure type:
  - flat array stays flat array
  - grouped object stays grouped object
- Preserve internal recipe links as `/recipes/<slug>`.
- Preserve `image` value unchanged when present.
- Keep required keys:
  - `title`
  - `description`
  - `ingredients`
  - `instructions`
  - `created`
- Keep optional keys only when present in the English source.

## Safety Rules

- Do not write files before user confirmation.
- Do not delete or modify English recipe files.
- Do not overwrite existing Dutch recipe files.
- If no missing slugs are found, report no-op and stop.
