export const checksums = {
  "content": "v3.5.0--RmHnOx2UyuSReKvE7rB400LVy0Un2ZlCXgmscWXM34s",
  "recipes": "v3.5.0--WqqwUL7CSeptexSshALtnY2l4GUn08VXQ6Ux9yNuCrc"
}
export const checksumsStructure = {
  "content": "bgIYhpjRuV8zbHJE_CfelwKpJ_Td6YuGJwixiek8lmI",
  "recipes": "Qv0s9wWYFukvvCE_US67yjXIn4G0KtcSCER-7ssC3Ck"
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