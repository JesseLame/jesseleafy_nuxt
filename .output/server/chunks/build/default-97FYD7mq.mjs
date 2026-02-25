import { _ as __nuxt_component_0 } from './nuxt-link-D2Rnf_tl.mjs';
import { mergeProps, unref, withCtx, createVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderSlot } from 'vue/server-renderer';
import { p as publicAssetsURL } from '../nitro/nitro.mjs';
import { useRoute } from 'vue-router';
import './server.mjs';
import 'date-fns';
import 'perfect-debounce';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'better-sqlite3';

const _imports_0 = publicAssetsURL("/logo_2.png");
const _sfc_main = {
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "min-h-screen bg-cover bg-center",
        style: {
          backgroundImage: unref(route).path === "/" ? "var(--background-image-home)" : "var(--background-image-default)"
        }
      }, _attrs))}><header class="bg-white/70 shadow p-4 backdrop-blur-sm"><div class="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-center">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "flex items-center"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", _imports_0)} alt="Jesse&#39;s Leafy Feasts logo" class="h-10 w-auto"${_scopeId}>`);
          } else {
            return [
              createVNode("img", {
                src: _imports_0,
                alt: "Jesse's Leafy Feasts logo",
                class: "h-10 w-auto"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<nav class="flex flex-wrap justify-center gap-4 text-green-800 text-sm font-medium">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: ["hover:underline", { "underline font-bold": unref(route).path === "/" }]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Home `);
          } else {
            return [
              createTextVNode(" Home ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/recipes",
        class: ["hover:underline", { "underline font-bold": unref(route).path === "/recipes" }]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Recipes `);
          } else {
            return [
              createTextVNode(" Recipes ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/list",
        class: ["hover:underline", { "underline font-bold": unref(route).path === "/list" }]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Grocery List `);
          } else {
            return [
              createTextVNode(" Grocery List ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/about",
        class: ["hover:underline", { "underline font-bold": unref(route).path === "/about" }]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` About `);
          } else {
            return [
              createTextVNode(" About ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/contact",
        class: ["hover:underline", { "underline font-bold": unref(route).path === "/contact" }]
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Contact `);
          } else {
            return [
              createTextVNode(" Contact ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</nav></div></header><main class="p-6">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main><footer class="mt-12 py-4 text-center text-sm text-white bg-black/30"> \xA9 2025 Jesse&#39;s Leafy Feasts. All rights reserved. </footer></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=default-97FYD7mq.mjs.map
