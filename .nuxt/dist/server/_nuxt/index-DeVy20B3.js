import { _ as __nuxt_component_0 } from "./nuxt-link-D2Rnf_tl.js";
import { withAsyncContext, mergeProps, withCtx, createTextVNode, unref, createBlock, createCommentVNode, createVNode, openBlock, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderAttr, ssrInterpolate } from "vue/server-renderer";
import { b as useAsyncData, a as useSeoMeta } from "../server.mjs";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/ufo/dist/index.mjs";
import "ofetch";
import "#internal/nuxt/paths";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/hookable/dist/index.mjs";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unctx/dist/index.mjs";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/radix3/dist/index.mjs";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/defu/dist/defu.mjs";
import "date-fns";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/perfect-debounce/dist/index.mjs";
import "minimark/hast";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/@unhead/vue/dist/index.mjs";
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data: recentRecipes } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("recentRecipes", async () => {
    })), __temp = await __temp, __restore(), __temp);
    console.log(recentRecipes.value);
    useSeoMeta({
      title: "Jesse's Leafy Feasts - Home",
      description: "A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes, kitchen tales, and leafy goodness served with love."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen flex flex-col items-center px-4 sm:px-6 pt-10" }, _attrs))}><div class="w-full max-w-3xl bg-white/70 backdrop-blur-sm rounded-xl shadow-lg text-center p-6 sm:p-10 mb-10"><h1 class="text-3xl sm:text-4xl md:text-6xl font-extrabold text-green-700 mb-4"> Welcome to Jesse&#39;s Leafy Feasts 🍃 </h1><p class="text-base sm:text-lg md:text-xl text-gray-700 max-w-xl mx-auto mb-6"> A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes, kitchen tales, and leafy goodness served with love. </p><div class="flex flex-wrap justify-center gap-4">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/about",
        class: "px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow hover:bg-green-700 transition"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Learn More `);
          } else {
            return [
              createTextVNode(" Learn More ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="w-full max-w-5xl"><h2 class="text-2xl sm:text-3xl font-bold text-green-800 mb-6 text-center">Recent Recipes</h2><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"><!--[-->`);
      ssrRenderList(unref(recentRecipes), (recipe) => {
        _push(`<div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `${recipe.path}`,
          class: "block h-full"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (recipe.image) {
                _push2(`<img${ssrRenderAttr("src", recipe.image)} alt="Recipe image" class="w-full h-48 object-cover"${_scopeId}>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="p-5"${_scopeId}><h2 class="text-xl font-semibold mb-2"${_scopeId}>${ssrInterpolate(recipe.title)}</h2><p class="text-gray-600 text-sm"${_scopeId}>${ssrInterpolate(recipe.description)}</p></div>`);
            } else {
              return [
                recipe.image ? (openBlock(), createBlock("img", {
                  key: 0,
                  src: recipe.image,
                  alt: "Recipe image",
                  class: "w-full h-48 object-cover"
                }, null, 8, ["src"])) : createCommentVNode("", true),
                createVNode("div", { class: "p-5" }, [
                  createVNode("h2", { class: "text-xl font-semibold mb-2" }, toDisplayString(recipe.title), 1),
                  createVNode("p", { class: "text-gray-600 text-sm" }, toDisplayString(recipe.description), 1)
                ])
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</div>`);
      });
      _push(`<!--]--></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=index-DeVy20B3.js.map
