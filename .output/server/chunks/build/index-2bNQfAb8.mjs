import { _ as __nuxt_component_0 } from './nuxt-link-D2Rnf_tl.mjs';
import { defineComponent, computed, withAsyncContext, ref, watch, watchEffect, mergeProps, unref, withCtx, createBlock, createCommentVNode, createVNode, openBlock, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrRenderComponent } from 'vue/server-renderer';
import { u as useRecipeLanguage } from './useRecipeLanguage-BUF9LebE.mjs';
import { b as useAsyncData, q as queryCollection, a as useSeoMeta } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'better-sqlite3';
import 'vue-router';
import 'date-fns';
import 'perfect-debounce';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { language, supportedLanguages } = useRecipeLanguage();
    const copyByLanguage = {
      en: {
        title: "All Recipes",
        searchPlaceholder: "Search recipes...",
        all: "All",
        noResults: "No recipes found.",
        languageLabel: "Language",
        recipeImageAlt: "Recipe image"
      },
      nl: {
        title: "Alle Recepten",
        searchPlaceholder: "Zoek recepten...",
        all: "Alles",
        noResults: "Geen recepten gevonden.",
        languageLabel: "Taal",
        recipeImageAlt: "Afbeelding van recept"
      }
    };
    const copy = computed(() => copyByLanguage[language.value]);
    const { data: recipes } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("recipeData", () => queryCollection("recipes").all())), __temp = await __temp, __restore(), __temp);
    const searchQuery = ref("");
    const activeCategory = ref(null);
    const isRecipeLang = (value) => value === "en" || value === "nl";
    function extractLanguageFromPath(path) {
      const parts = path.split("/").filter(Boolean);
      const candidate = parts[1];
      return candidate && isRecipeLang(candidate) ? candidate : null;
    }
    const recipesForLanguage = computed(() => {
      var _a;
      const recipeCollection = (_a = recipes.value) != null ? _a : [];
      return recipeCollection.filter((recipe) => extractLanguageFromPath(recipe.path) === language.value);
    });
    const categories = computed(() => {
      const categoriesSet = /* @__PURE__ */ new Set();
      recipesForLanguage.value.forEach((recipe) => {
        if (recipe.category) {
          categoriesSet.add(recipe.category);
        }
      });
      return Array.from(categoriesSet);
    });
    const filteredRecipes = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();
      return recipesForLanguage.value.filter((recipe) => {
        var _a, _b, _c;
        const matchesSearch = !q || ((_a = recipe.title) == null ? void 0 : _a.toLowerCase().includes(q)) || ((_b = recipe.description) == null ? void 0 : _b.toLowerCase().includes(q)) || ((_c = recipe.tags) == null ? void 0 : _c.some((tag) => tag.toLowerCase().includes(q)));
        const matchesCategory = !activeCategory.value || recipe.category === activeCategory.value;
        return matchesSearch && matchesCategory;
      });
    });
    watch(language, () => {
      activeCategory.value = null;
    });
    watchEffect(() => {
      useSeoMeta({
        title: `Jesse's Leafy Feasts - ${copy.value.title}`,
        description: "Explore a collection of delicious plant-based recipes that celebrate fresh flavors and nourishing greens. Dive into seasonal delights and leafy goodness served with love."
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-6xl mx-auto px-4 py-10" }, _attrs))}><h1 class="text-3xl font-bold mb-6 text-center">${ssrInterpolate(copy.value.title)}</h1><div class="mb-6 flex items-center justify-center gap-2"><span class="text-sm font-medium text-gray-700">${ssrInterpolate(copy.value.languageLabel)}:</span><!--[-->`);
      ssrRenderList(unref(supportedLanguages), (option) => {
        _push(`<button class="${ssrRenderClass([unref(language) === option.code ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300", "px-3 py-1 text-sm rounded-full border transition-colors"])}">${ssrInterpolate(option.label)}</button>`);
      });
      _push(`<!--]--></div><div class="mb-4 max-w-md mx-auto"><input${ssrRenderAttr("value", searchQuery.value)} type="text"${ssrRenderAttr("placeholder", copy.value.searchPlaceholder)} class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"></div><div class="mb-8 flex flex-wrap gap-2 justify-center"><button class="${ssrRenderClass([!activeCategory.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300", "px-3 py-1 text-sm rounded-full border transition-colors"])}">${ssrInterpolate(copy.value.all)}</button><!--[-->`);
      ssrRenderList(categories.value, (category) => {
        _push(`<button class="${ssrRenderClass([activeCategory.value === category ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300", "px-3 py-1 text-sm rounded-full border transition-colors"])}">${ssrInterpolate(category)}</button>`);
      });
      _push(`<!--]--></div><ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"><!--[-->`);
      ssrRenderList(filteredRecipes.value, (recipe) => {
        _push(`<li class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: recipe.path,
          class: "block h-full"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (recipe.image) {
                _push2(`<img${ssrRenderAttr("src", recipe.image)}${ssrRenderAttr("alt", copy.value.recipeImageAlt)} class="w-full h-48 object-cover"${_scopeId}>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="p-5"${_scopeId}><h2 class="text-xl font-semibold mb-2"${_scopeId}>${ssrInterpolate(recipe.title)}</h2><p class="text-gray-600 text-sm"${_scopeId}>${ssrInterpolate(recipe.description)}</p></div>`);
            } else {
              return [
                recipe.image ? (openBlock(), createBlock("img", {
                  key: 0,
                  src: recipe.image,
                  alt: copy.value.recipeImageAlt,
                  class: "w-full h-48 object-cover"
                }, null, 8, ["src", "alt"])) : createCommentVNode("", true),
                createVNode("div", { class: "p-5" }, [
                  createVNode("h2", { class: "text-xl font-semibold mb-2" }, toDisplayString(recipe.title), 1),
                  createVNode("p", { class: "text-gray-600 text-sm" }, toDisplayString(recipe.description), 1)
                ])
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul>`);
      if (filteredRecipes.value.length === 0) {
        _push(`<div class="text-center mt-10 text-gray-500">${ssrInterpolate(copy.value.noResults)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/recipes/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-2bNQfAb8.mjs.map
