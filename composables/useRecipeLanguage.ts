import { watch } from 'vue'

export type RecipeLang = 'en' | 'nl'

type SupportedLanguage = {
  code: RecipeLang
  label: string
}

const supportedLanguages: SupportedLanguage[] = [
  { code: 'en', label: 'English' },
  { code: 'nl', label: 'Nederlands' }
]

const isRecipeLang = (value: string | null): value is RecipeLang => value === 'en' || value === 'nl'

export function useRecipeLanguage() {
  const language = useState<RecipeLang>('recipe-language', () => 'en')
  const initialized = useState<boolean>('recipe-language-initialized', () => false)

  if (process.client && !initialized.value) {
    const storedLanguage = localStorage.getItem('recipe_language')
    if (isRecipeLang(storedLanguage)) {
      language.value = storedLanguage
    }

    watch(
      language,
      (nextLanguage) => {
        localStorage.setItem('recipe_language', nextLanguage)
      },
      { immediate: true }
    )

    initialized.value = true
  }

  const setLanguage = (nextLanguage: RecipeLang) => {
    language.value = nextLanguage
  }

  return {
    language,
    setLanguage,
    supportedLanguages
  }
}
