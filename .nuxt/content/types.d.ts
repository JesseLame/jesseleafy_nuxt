import type { PageCollectionItemBase, DataCollectionItemBase } from '@nuxt/content'

declare module '@nuxt/content' {
  interface ContentCollectionItem extends PageCollectionItemBase {}
  interface RecipesCollectionItem extends PageCollectionItemBase {}

  interface PageCollections {
    content: ContentCollectionItem
    recipes: RecipesCollectionItem
  }

  interface Collections {
    content: ContentCollectionItem
    recipes: RecipesCollectionItem
  }
}
