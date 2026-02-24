import { ref, watch, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain } from "vue/server-renderer";
import { a as useSeoMeta } from "../server.mjs";
import "ofetch";
import "#internal/nuxt/paths";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/hookable/dist/index.mjs";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unctx/dist/index.mjs";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/radix3/dist/index.mjs";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/defu/dist/defu.mjs";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/ufo/dist/index.mjs";
import "date-fns";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/perfect-debounce/dist/index.mjs";
import "minimark/hast";
import "/Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/@unhead/vue/dist/index.mjs";
const _sfc_main = {
  __name: "list",
  __ssrInlineRender: true,
  setup(__props) {
    useSeoMeta({
      title: "Grocery List - Jesse's Leafy Feasts",
      description: "A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes, kitchen tales, and leafy goodness served with love."
    });
    const groceries = ref([
      { name: "Romaine lettuce", checked: false },
      { name: "Cherry tomatoes", checked: false },
      { name: "Mozzarella cheese", checked: false },
      { name: "Balsamic vinegar", checked: false },
      { name: "Olive oil", checked: false }
    ]);
    const newItem = ref("");
    const saveGroceries = () => {
      localStorage.setItem("groceries", JSON.stringify(groceries.value));
    };
    watch(groceries, saveGroceries, { deep: true });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen flex flex-col items-center p-4 sm:p-6 pt-24" }, _attrs))}><div class="w-full max-w-full sm:max-w-3xl bg-white/70 backdrop-blur-sm rounded-xl shadow-lg text-center p-4 sm:p-10"><div class="flex flex-col sm:flex-row items-stretch mb-6 gap-2"><input${ssrRenderAttr("value", newItem.value)} type="text" placeholder="Add a new item" class="w-full p-2 border rounded-lg border-gray-300 focus:outline-none"><button class="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"> Add </button></div><ul class="text-left"><!--[-->`);
      ssrRenderList(groceries.value, (item, index) => {
        _push(`<li class="text-lg text-gray-700 mb-2 flex items-center justify-between"><div class="flex items-center"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(item.checked) ? ssrLooseContain(item.checked, null) : item.checked) ? " checked" : ""}${ssrRenderAttr("id", `item-${index}`)} class="mr-2 h-4 w-4 text-green-600 focus:ring-green-500"><label${ssrRenderAttr("for", `item-${index}`)} class="${ssrRenderClass({ "line-through text-gray-400": item.checked })}">${ssrInterpolate(item.name)}</label></div><button class="ml-4 text-red-500 hover:text-red-700 text-sm"> Delete </button></li>`);
      });
      _push(`<!--]--></ul></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/list.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=list-BoywwCjx.js.map
