import type { PageCollectionItemBase, DataCollectionItemBase } from '@nuxt/content'

declare module '@nuxt/content' {
  interface ContentCollectionItem extends PageCollectionItemBase {}
  interface RecipesCollectionItem extends PageCollectionItemBase {
    title: string;
    description: string;
    description_long?: string | undefined;
    image?: string | undefined;
    ingredients: string[] | {
      [x: string]: string[];
    };
    instructions: string[];
    created: Date;
    tags?: string[] | undefined;
    categories?: string[] | undefined;
  }

  interface PageCollections {
    content: ContentCollectionItem
    recipes: RecipesCollectionItem
  }

  interface Collections {
    content: ContentCollectionItem
    recipes: RecipesCollectionItem
  }
}
