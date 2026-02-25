# Recipe Style Reference

Use this reference to match the current tone and structure of existing recipes.

## Tone Targets

- Write clear, appetizing, practical recipe copy.
- Keep language warm and direct, not overly technical.
- Prefer concrete sensory words over vague filler.
- Keep steps actionable and ordered.

## Frontmatter Writing Style

- `title`: clear dish name, readable and specific.
- `description`: one concise sentence summarizing taste and texture.
- `description_long`: two short paragraphs:
  - paragraph 1: what the dish is and why it works
  - paragraph 2: context or serving suggestion
- `instructions`: imperative steps with realistic sequencing.
- `tags` and `category`: practical and discoverable.

## Body Writing Style

- Add `# <title>` as heading.
- Follow with one short paragraph that reinforces appeal and use case.
- Keep body compact. Frontmatter carries most metadata.

## Multilingual Guidance

- English is default output.
- Dutch is optional and generated only when requested.
- For EN/NL pairs:
  - keep structure and meaning aligned
  - localize naturally rather than word-for-word literal translation
  - keep slug identical across languages

## Examples to Mirror

Reference these files when calibrating wording:

- `content/recipes/en/chocolate_chip_cookie.md`
- `content/recipes/en/banh_mi.md`
- `content/recipes/nl/chocolate_chip_cookie.md`

## Quality Signals

- Descriptions are concise and specific.
- Instructions avoid ambiguity and overlong sentences.
- Ingredient quantities are concrete where possible.
- The final paragraph reads like existing repository recipes.
