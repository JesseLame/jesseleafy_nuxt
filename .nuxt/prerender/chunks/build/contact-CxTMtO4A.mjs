import { mergeProps, useSSRContext } from 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/vue/index.mjs';
import { ssrRenderAttrs } from 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/vue/server-renderer/index.mjs';
import { a as useSeoMeta } from './server.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/ofetch/dist/node.mjs';
import '../nitro/nitro.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/h3/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/ufo/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/destr/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/hookable/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/node-mock-http/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unstorage/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unstorage/drivers/fs.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unstorage/drivers/fs-lite.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unstorage/drivers/lru-cache.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/ohash/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/klona/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/defu/dist/defu.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/scule/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unctx/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/radix3/dist/index.mjs';
import 'node:fs';
import 'node:url';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/pathe/dist/index.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/db0/dist/connectors/better-sqlite3.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/vue-router/dist/vue-router.node.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/date-fns/index.js';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/perfect-debounce/dist/index.mjs';
import '../_/renderer.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unhead/dist/server.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/devalue/index.js';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unhead/dist/plugins.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unhead/dist/utils.mjs';

const _sfc_main = {
  __name: "contact",
  __ssrInlineRender: true,
  setup(__props) {
    useSeoMeta({
      title: "Jesse's Leafy Feasts - Contact",
      description: "A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes, kitchen tales, and leafy goodness served with love."
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen flex items-start justify-center p-6" }, _attrs))}><div class="w-full max-w-3xl bg-white/70 backdrop-blur-sm rounded-xl shadow-lg text-center p-10"><h1 class="text-4xl md:text-6xl font-extrabold text-green-700 mb-4"> Contact Jesse&#39;s Leafy Feasts \u{1F33F} </h1><p class="text-lg md:text-xl text-gray-700 max-w-xl mx-auto"> Maybe not </p></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/contact.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=contact-CxTMtO4A.mjs.map
