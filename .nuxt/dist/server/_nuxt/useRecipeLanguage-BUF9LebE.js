import { toRef, isRef } from "vue";
import { d as useNuxtApp } from "../server.mjs";
const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxtApp = useNuxtApp();
  const state = toRef(nuxtApp.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxtApp.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" }
];
function useRecipeLanguage() {
  const language = useState("recipe-language", () => "en");
  useState("recipe-language-initialized", () => false);
  const setLanguage = (nextLanguage) => {
    language.value = nextLanguage;
  };
  return {
    language,
    setLanguage,
    supportedLanguages
  };
}
export {
  useRecipeLanguage as u
};
//# sourceMappingURL=useRecipeLanguage-BUF9LebE.js.map
