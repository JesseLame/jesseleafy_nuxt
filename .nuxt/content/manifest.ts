export const checksums = {
  "content": "v3.5.0--jp6Fims1XVn9we3oUIxi2uMistR70ZkBhbM7QtwqAWQ",
  "recipes": "v3.5.0--f9r0mboIRbUA2XJLARAKS-noiO6jlns4HQUXCG5g1kM"
}
export const checksumsStructure = {
  "content": "bgIYhpjRuV8zbHJE_CfelwKpJ_Td6YuGJwixiek8lmI",
  "recipes": "hoqlMcdQA8SCCUuPb4KQ3g6isyoul0chUoL1i6UhV3I"
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
      "tags": "json",
      "categories": "json"
    }
  },
  "info": {
    "type": "data",
    "fields": {}
  }
}