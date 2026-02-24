import { defineComponent, withAsyncContext, computed, watchEffect, unref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { useRoute } from 'vue-router';
import MarkdownIt from 'markdown-it';
import { b as useAsyncData, q as queryCollection } from './server.mjs';
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
import 'date-fns';
import 'perfect-debounce';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "testPage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const md = new MarkdownIt();
    const route = useRoute();
    route.params.slug;
    const { data: recipe } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "recipe",
      () => queryCollection("recipes").path(`/recipes/banana`).first()
    )), __temp = await __temp, __restore(), __temp);
    const ingredientsSplit = computed(
      () => recipe.value && !Array.isArray(recipe.value.ingredients)
    );
    const descriptionLongHTML = computed(() => {
      var _a;
      const raw = ((_a = recipe.value) == null ? void 0 : _a.description_long) || "";
      return md.render(raw.replace(/\\n/g, "\n"));
    });
    const parseIngredient = (item) => {
      const linkRegex = /\((\/[^\s)]+)\)/;
      const match = item.match(linkRegex);
      if (match) {
        const text = item.replace(linkRegex, "").trim();
        const href = match[1];
        return `<a href="${href}" class="text-green-600 underline hover:text-green-800">${text}</a>`;
      } else {
        return item;
      }
    };
    watchEffect(() => {
      if (recipe.value) {
        console.log("Recipe:", recipe.value);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      if (unref(recipe)) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-4 sm:mx-auto mt-10 mb-16 w-full max-w-3xl bg-white shadow-xl rounded-xl p-4 sm:p-8" }, _attrs))}>`);
        if (unref(recipe).image) {
          _push(`<img${ssrRenderAttr("src", unref(recipe).image)}${ssrRenderAttr("alt", unref(recipe).title)} class="w-full h-48 sm:h-64 object-cover rounded-lg mb-6">`);
        } else {
          _push(`<!---->`);
        }
        _push(`<h1 class="text-2xl sm:text-4xl font-bold mb-4 text-gray-900">${ssrInterpolate(unref(recipe).title)}</h1><p class="text-base sm:text-lg text-gray-600 mb-8">${ssrInterpolate(unref(recipe).description)}</p>`);
        if (unref(descriptionLongHTML)) {
          _push(`<div class="text-gray-700 mb-6 prose">${(_a = unref(descriptionLongHTML)) != null ? _a : ""}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section><h2 class="text-2xl font-semibold text-green-700 mb-3">Ingredients</h2>`);
        if (!unref(ingredientsSplit)) {
          _push(`<ul class="list-disc list-inside space-y-1 text-gray-800"><!--[-->`);
          ssrRenderList(unref(recipe).ingredients, (item) => {
            var _a2;
            _push(`<li>${(_a2 = parseIngredient(item)) != null ? _a2 : ""}</li>`);
          });
          _push(`<!--]--></ul>`);
        } else {
          _push(`<div class="space-y-4"><!--[-->`);
          ssrRenderList(unref(recipe).ingredients, (items, section) => {
            _push(`<div><h3 class="text-xl font-semibold text-green-600 mb-1 capitalize">${ssrInterpolate(section.replace(/_/g, " "))}</h3><ul class="list-disc list-inside space-y-1 text-gray-800"><!--[-->`);
            ssrRenderList(items, (item) => {
              var _a2;
              _push(`<li>${(_a2 = parseIngredient(item)) != null ? _a2 : ""}</li>`);
            });
            _push(`<!--]--></ul></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</section><section class="mt-8"><h2 class="text-2xl font-semibold text-green-700 mb-3">Instructions</h2><ol class="list-decimal list-inside space-y-2 text-gray-800"><!--[-->`);
        ssrRenderList(unref(recipe).instructions, (step) => {
          _push(`<li>${ssrInterpolate(step)}</li>`);
        });
        _push(`<!--]--></ol></section></div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "text-center text-gray-500 py-20" }, _attrs))}><p>Recipe not found.</p></div>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/testPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=testPage-DxQly3Ti.mjs.map
