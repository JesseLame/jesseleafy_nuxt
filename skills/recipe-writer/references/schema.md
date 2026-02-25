# Recipe Schema Reference

Use this reference to keep generated recipe files valid for this repository's `recipes` collection.

## Path and Language Rules

- Write files to `content/recipes/<lang>/<slug>.md`.
- Allowed `<lang>` values are `en` and `nl`.
- Use the same `<slug>` for EN/NL variants of the same recipe.
- Prefer underscore-style slugs to match existing repository convention.

## Required Frontmatter Keys

Every recipe frontmatter must include:

- `title`: string
- `description`: string
- `ingredients`: one of:
  - array of strings
  - object where each value is an array of strings
- `instructions`: array of strings
- `created`: date string in `dd-MM-yyyy`

## Optional Frontmatter Keys

Add only when relevant:

- `description_long`: string (usually multiline YAML block)
- `image`: string URL or known repo image path
- `tags`: array of strings
- `categories`: array of strings
- `category`: string

## Date Rules

- Default `created` to today's local date unless the user specifies another date.
- Keep `created` strictly in `dd-MM-yyyy` format.
- Never emit ISO date formats in frontmatter.

## Ingredients Rules

- Default to a flat array for simple recipes.
- Use grouped object format for multi-component recipes.

Flat example:

```yaml
ingredients:
  - 300 g tofu
  - 2 tbsp soy sauce
```

Grouped example:

```yaml
ingredients:
  sauce:
    - 2 tbsp soy sauce
    - 1 tbsp rice vinegar
  toppings:
    - spring onion
    - sesame seeds
```

## Markdown Body Rules

- Include `# <title>` heading after frontmatter.
- Add one short introductory paragraph below the heading.
- Keep body concise and readable.

## Internal Recipe Links

- For links embedded in ingredient strings, use `/recipes/<slug>`.
- Do not add language prefix to this link format.
- Keep target slug exact.
