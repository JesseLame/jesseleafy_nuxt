#!/usr/bin/env node

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const DEFAULT_MODEL = 'gpt-4.1-mini'
const MAX_ATTEMPTS = 3
const OPENAI_API_URL = 'https://api.openai.com/v1/responses'
const REQUIRED_FRONTMATTER_KEYS = ['title', 'description', 'ingredients', 'instructions', 'created']

function printUsage() {
  console.log(
    [
      'Usage:',
      '  npm run translate:nl -- [--dry-run|--write] [--slug <slug>] [--limit <n>] [--overwrite]',
      '',
      'Flags:',
      '  --dry-run      Plan translations without writing files (default).',
      '  --write        Translate and write files to content/recipes/nl.',
      '  --slug <slug>  Process a single recipe slug.',
      '  --limit <n>    Process at most n recipes.',
      '  --overwrite    Overwrite existing Dutch files.',
      '  --help         Show this message.',
      '',
      'Environment:',
      '  OPENAI_API_KEY Required when running with --write and at least one file to translate.',
      `  OPENAI_MODEL   Optional model override (default: ${DEFAULT_MODEL}).`
    ].join('\n')
  )
}

function parseArgs(argv) {
  const options = {
    dryRun: true,
    write: false,
    overwrite: false,
    limit: undefined,
    slug: undefined
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }

    if (arg === '--write') {
      options.write = true
      options.dryRun = false
      continue
    }

    if (arg === '--dry-run') {
      options.dryRun = true
      options.write = false
      continue
    }

    if (arg === '--overwrite') {
      options.overwrite = true
      continue
    }

    if (arg === '--limit') {
      const value = argv[i + 1]
      if (!value) {
        throw new Error('Missing value for --limit')
      }
      const parsed = Number.parseInt(value, 10)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid --limit value: ${value}. Use a positive integer.`)
      }
      options.limit = parsed
      i += 1
      continue
    }

    if (arg === '--slug') {
      const value = argv[i + 1]
      if (!value) {
        throw new Error('Missing value for --slug')
      }
      options.slug = value
      i += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

async function ensureDirectoryExists(dirPath, label) {
  try {
    const details = await stat(dirPath)
    if (!details.isDirectory()) {
      throw new Error(`${label} path is not a directory: ${dirPath}`)
    }
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error(`${label} directory does not exist: ${dirPath}`)
    }
    throw error
  }
}

async function readRecipeSlugs(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.slice(0, -3))
    .sort((a, b) => a.localeCompare(b))
}

function extractFrontmatter(rawMarkdown) {
  const normalized = rawMarkdown.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) {
    throw new Error('Translated output is missing a valid YAML frontmatter block.')
  }

  return {
    normalizedMarkdown: normalized,
    frontmatter: match[1],
    body: match[2]
  }
}

function stripCodeFence(value) {
  const trimmed = value.trim()
  const fenced = trimmed.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/i)
  if (fenced) {
    return fenced[1]
  }
  return value
}

function getTopLevelFrontmatterKeys(frontmatter) {
  const regex = /^([A-Za-z_][A-Za-z0-9_]*):/gm
  const keys = new Set()
  let match
  while ((match = regex.exec(frontmatter)) !== null) {
    keys.add(match[1])
  }
  return keys
}

function getCreatedValue(frontmatter) {
  const match = frontmatter.match(/^created:\s*(.+)$/m)
  if (!match) {
    return null
  }

  return match[1].trim().replace(/^['"]|['"]$/g, '')
}

function isValidDateString(value) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    return false
  }

  const [dayRaw, monthRaw, yearRaw] = value.split('-')
  const day = Number.parseInt(dayRaw, 10)
  const month = Number.parseInt(monthRaw, 10)
  const year = Number.parseInt(yearRaw, 10)

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function extractRecipeLinks(markdown) {
  const regex = /\((\/recipes\/[^)\n\r]+?)\)/g
  const links = new Set()
  let match
  while ((match = regex.exec(markdown)) !== null) {
    links.add(match[1].trim())
  }
  return links
}

function setDifference(setA, setB) {
  const result = []
  for (const item of setA) {
    if (!setB.has(item)) {
      result.push(item)
    }
  }
  return result
}

function parseResponseText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text
  }

  if (Array.isArray(payload?.output)) {
    const textParts = []
    for (const item of payload.output) {
      if (!Array.isArray(item?.content)) {
        continue
      }
      for (const contentPart of item.content) {
        if (typeof contentPart?.text === 'string') {
          textParts.push(contentPart.text)
        }
      }
    }
    if (textParts.length > 0) {
      return textParts.join('\n')
    }
  }

  return ''
}

function buildPrompt(slug, sourceMarkdown) {
  return [
    `Translate this recipe markdown file from English to Dutch (nl) for slug "${slug}".`,
    'Return only the translated markdown file text.',
    'Rules:',
    '1) Preserve valid YAML frontmatter and markdown structure.',
    '2) Keep all top-level YAML key names exactly unchanged.',
    '3) Keep the "created" value exactly unchanged and in dd-MM-yyyy format.',
    '4) Preserve all recipe link targets that appear inside parentheses, including exact /recipes/... paths.',
    '5) Keep ingredient group key names unchanged (for example: cake, toppings, soup).',
    '6) Translate user-facing English text content into natural Dutch.',
    '7) Do not add code fences or extra commentary.',
    '',
    'Recipe markdown:',
    sourceMarkdown
  ].join('\n')
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function translateRecipe({ apiKey, model, slug, sourceMarkdown }) {
  const requestBody = {
    model,
    temperature: 0.2,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'You are a careful culinary translation engine that outputs valid markdown with YAML frontmatter.'
          }
        ]
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: buildPrompt(slug, sourceMarkdown) }]
      }
    ]
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${errorBody.slice(0, 300)}`)
  }

  const payload = await response.json()
  const text = stripCodeFence(parseResponseText(payload)).replace(/\r\n/g, '\n').trim()
  if (!text) {
    throw new Error('OpenAI response did not include translated text.')
  }

  return `${text}\n`
}

function validateTranslation({
  translatedMarkdown,
  sourceFrontmatterKeys,
  sourceCreatedValue,
  sourceLinks
}) {
  const { frontmatter } = extractFrontmatter(translatedMarkdown)
  const translatedFrontmatterKeys = getTopLevelFrontmatterKeys(frontmatter)

  for (const requiredKey of REQUIRED_FRONTMATTER_KEYS) {
    if (!translatedFrontmatterKeys.has(requiredKey)) {
      throw new Error(`Missing required frontmatter key "${requiredKey}" in translated output.`)
    }
  }

  const missingSourceKeys = setDifference(sourceFrontmatterKeys, translatedFrontmatterKeys)
  if (missingSourceKeys.length > 0) {
    throw new Error(`Translated output is missing source frontmatter keys: ${missingSourceKeys.join(', ')}`)
  }

  const translatedCreatedValue = getCreatedValue(frontmatter)
  if (!translatedCreatedValue) {
    throw new Error('Translated output is missing "created" in frontmatter.')
  }

  if (!isValidDateString(translatedCreatedValue)) {
    throw new Error(`Translated "created" value is not dd-MM-yyyy: ${translatedCreatedValue}`)
  }

  if (sourceCreatedValue !== translatedCreatedValue) {
    throw new Error(
      `Translated "created" value changed. Expected "${sourceCreatedValue}", got "${translatedCreatedValue}".`
    )
  }

  const translatedLinks = extractRecipeLinks(translatedMarkdown)
  const missingLinks = setDifference(sourceLinks, translatedLinks)
  if (missingLinks.length > 0) {
    throw new Error(`Translated output changed recipe links. Missing: ${missingLinks.join(', ')}`)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printUsage()
    return
  }

  const projectRoot = process.cwd()
  const enDir = path.join(projectRoot, 'content', 'recipes', 'en')
  const nlDir = path.join(projectRoot, 'content', 'recipes', 'nl')
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL
  const apiKey = process.env.OPENAI_API_KEY

  await ensureDirectoryExists(enDir, 'English recipes')
  await mkdir(nlDir, { recursive: true })

  const enSlugs = await readRecipeSlugs(enDir)
  if (enSlugs.length === 0) {
    throw new Error('No English recipe files found.')
  }

  const nlSlugs = await readRecipeSlugs(nlDir)
  const nlSlugSet = new Set(nlSlugs)

  if (options.slug && !enSlugs.includes(options.slug)) {
    throw new Error(`Slug "${options.slug}" does not exist in content/recipes/en.`)
  }

  const selectedSlugs = options.slug ? [options.slug] : enSlugs
  const queue = []
  let skippedExisting = 0

  for (const slug of selectedSlugs) {
    const alreadyExists = nlSlugSet.has(slug)
    if (alreadyExists && !options.overwrite) {
      skippedExisting += 1
      continue
    }
    queue.push(slug)
  }

  queue.sort((a, b) => a.localeCompare(b))
  let deferredByLimit = 0
  if (options.limit && queue.length > options.limit) {
    deferredByLimit = queue.length - options.limit
    queue.length = options.limit
  }

  if (options.write && queue.length > 0 && !apiKey) {
    throw new Error('OPENAI_API_KEY is required when running with --write.')
  }

  console.log(`Mode: ${options.write ? 'write' : 'dry-run'}`)
  console.log(`Model: ${model}`)
  console.log(`Selected recipes: ${selectedSlugs.length}`)
  console.log(`Queue length: ${queue.length}`)
  if (deferredByLimit > 0) {
    console.log(`Deferred by --limit: ${deferredByLimit}`)
  }

  const stats = {
    created: 0,
    overwritten: 0,
    skipped: skippedExisting,
    failed: 0,
    wouldCreate: 0,
    wouldOverwrite: 0
  }
  const failedSlugs = []

  for (const slug of queue) {
    const sourcePath = path.join(enDir, `${slug}.md`)
    const targetPath = path.join(nlDir, `${slug}.md`)
    const targetExists = nlSlugSet.has(slug)

    if (options.dryRun) {
      if (targetExists && options.overwrite) {
        stats.wouldOverwrite += 1
        console.log(`[dry-run] would overwrite: ${slug}`)
      } else {
        stats.wouldCreate += 1
        console.log(`[dry-run] would create: ${slug}`)
      }
      continue
    }

    let sourceMarkdown
    let sourceFrontmatter
    try {
      sourceMarkdown = await readFile(sourcePath, 'utf8')
      sourceFrontmatter = extractFrontmatter(sourceMarkdown).frontmatter
    } catch (error) {
      stats.failed += 1
      failedSlugs.push(`${slug}: ${error.message}`)
      console.error(`[error] ${slug}: ${error.message}`)
      continue
    }

    const sourceFrontmatterKeys = getTopLevelFrontmatterKeys(sourceFrontmatter)
    const sourceCreatedValue = getCreatedValue(sourceFrontmatter)
    if (!sourceCreatedValue || !isValidDateString(sourceCreatedValue)) {
      stats.failed += 1
      failedSlugs.push(`${slug}: invalid source created date "${sourceCreatedValue ?? 'missing'}"`)
      console.error(`[error] ${slug}: source file has invalid or missing created date`)
      continue
    }

    const sourceLinks = extractRecipeLinks(sourceMarkdown)

    let translatedMarkdown = ''
    let translated = false
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        translatedMarkdown = await translateRecipe({
          apiKey,
          model,
          slug,
          sourceMarkdown
        })
        validateTranslation({
          translatedMarkdown,
          sourceFrontmatterKeys,
          sourceCreatedValue,
          sourceLinks
        })
        translated = true
        break
      } catch (error) {
        if (attempt === MAX_ATTEMPTS) {
          failedSlugs.push(`${slug}: ${error.message}`)
          console.error(`[error] ${slug}: ${error.message}`)
          break
        }
        const waitMs = 500 * attempt
        console.warn(`[warn] ${slug}: attempt ${attempt} failed, retrying in ${waitMs}ms`)
        await delay(waitMs)
      }
    }

    if (!translated) {
      stats.failed += 1
      continue
    }

    await writeFile(targetPath, translatedMarkdown, 'utf8')
    if (targetExists && options.overwrite) {
      stats.overwritten += 1
      console.log(`[ok] overwritten: ${slug}`)
    } else {
      stats.created += 1
      console.log(`[ok] created: ${slug}`)
    }
  }

  console.log('\nSummary:')
  console.log(`  created: ${stats.created}`)
  console.log(`  overwritten: ${stats.overwritten}`)
  console.log(`  skipped: ${stats.skipped}`)
  console.log(`  failed: ${stats.failed}`)
  if (options.dryRun) {
    console.log(`  would create: ${stats.wouldCreate}`)
    console.log(`  would overwrite: ${stats.wouldOverwrite}`)
  }

  if (failedSlugs.length > 0) {
    console.log('\nFailed slugs:')
    for (const item of failedSlugs) {
      console.log(`  - ${item}`)
    }
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(`[fatal] ${error.message}`)
  process.exitCode = 1
})
