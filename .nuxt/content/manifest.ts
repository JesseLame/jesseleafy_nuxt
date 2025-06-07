export const checksums = {
  "content": "v3.5.0--fA4YScCBjxUDJYFT9YdW9b-wTE31W5V5HpRWtlcfB2g",
  "recipes": "v3.5.0--nHJtuMdQuIExx2xq1Kdlwm-XIi4z8Ubf4Eg3noT4TNI"
}
export const checksumsStructure = {
  "content": "bgIYhpjRuV8zbHJE_CfelwKpJ_Td6YuGJwixiek8lmI",
  "recipes": "nHJtuMdQuIExx2xq1Kdlwm-XIi4z8Ubf4Eg3noT4TNI"
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
      "navigation": "json"
    }
  },
  "info": {
    "type": "data",
    "fields": {}
  }
}