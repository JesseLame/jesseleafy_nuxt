export const checksums = {
  "content": "v3.5.0--PRbPIee2AL6xgNDR91j4867JaB00OBWwPgYkXrFHrK0",
  "recipes": "v3.5.0--7uVj4m3VVSPRlpwh-X7FKyZri9UeD420fjL1Zl--3Rw"
}
export const checksumsStructure = {
  "content": "bgIYhpjRuV8zbHJE_CfelwKpJ_Td6YuGJwixiek8lmI",
  "recipes": "JoSus-rhLVR1GvI_G6xaoRBiImyy2PllgmWNLf93vqY"
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
      "created": "date"
    }
  },
  "info": {
    "type": "data",
    "fields": {}
  }
}