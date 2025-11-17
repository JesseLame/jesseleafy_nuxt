export const checksums = {
  "content": "v3.5.0---_9B6exY6eg377DuM1cY7l5yxs-ys_2EWpIoADVuwyk",
  "recipes": "v3.5.0--FBFx7ChrdACyIiUHqvmgxuC9Y3lLlAyPc1aiBqNNjdU"
}
export const checksumsStructure = {
  "content": "bgIYhpjRuV8zbHJE_CfelwKpJ_Td6YuGJwixiek8lmI",
  "recipes": "g_ljGUwGxGBZlyFQzxrWNYHcVRv4e58lRr1AR7wIaig"
}

export const tables = {
  "content": "_content_content",
  "recipes": "_content_recipes",
  "info": "_content_info"
}

export default {
  "content": {
    "type": "page",
    "fields": {
      "id": "string",
      "title": "string",
      "body": "json",
      "description": "string",
      "extension": "string",
      "meta": "json",
      "navigation": "json",
      "path": "string",
      "seo": "json",
      "stem": "string"
    }
  },
  "recipes": {
    "type": "page",
    "fields": {
      "id": "string",
      "title": "string",
      "body": "json",
      "categories": "json",
      "category": "string",
      "created": "string",
      "description": "string",
      "description_long": "string",
      "extension": "string",
      "image": "string",
      "ingredients": "json",
      "instructions": "json",
      "meta": "json",
      "navigation": "json",
      "path": "string",
      "seo": "json",
      "stem": "string",
      "tags": "json"
    }
  },
  "info": {
    "type": "data",
    "fields": {}
  }
}