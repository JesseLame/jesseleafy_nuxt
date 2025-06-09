export const checksums = {
  "content": "v3.5.0--9sAvlAmyxzgqAESBgX2HutpYwRRi7rCbiqOWcN69220",
  "recipes": "v3.5.0--t4eESb3gEGxPKOvblWRB94k0GnAteQ-QgUWMefb2JkA"
}
export const checksumsStructure = {
  "content": "bgIYhpjRuV8zbHJE_CfelwKpJ_Td6YuGJwixiek8lmI",
  "recipes": "cWI7Gqk1D7qHZ4nwij41u4Q-pd70C6a_n3cGYiu3ANQ"
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
      "stem": "string",
      "extension": "string",
      "meta": "json",
      "path": "string",
      "title": "string",
      "description": "string",
      "seo": "json",
      "body": "json",
      "navigation": "json"
    }
  },
  "recipes": {
    "type": "page",
    "fields": {
      "id": "string",
      "stem": "string",
      "extension": "string",
      "meta": "json",
      "path": "string",
      "title": "string",
      "description": "string",
      "seo": "json",
      "body": "json",
      "navigation": "json",
      "description_long": "string",
      "image": "string",
      "ingredients": "json",
      "instructions": "json",
      "created": "date",
      "tags": "json"
    }
  },
  "info": {
    "type": "data",
    "fields": {}
  }
}