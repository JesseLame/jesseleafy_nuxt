import { mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs } from 'vue/server-renderer';
import { a as useSeoMeta } from './server.mjs';
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

const _sfc_main = {
  __name: "about",
  __ssrInlineRender: true,
  setup(__props) {
    useSeoMeta({
      title: "Jesse's Leafy Feasts - About",
      description: "A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes, kitchen tales, and leafy goodness served with love."
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen flex items-start justify-center p-6" }, _attrs))}><div class="w-full max-w-3xl bg-white/70 backdrop-blur-sm rounded-xl shadow-lg text-center p-10"><h1 class="text-4xl md:text-6xl font-extrabold text-green-700 mb-4"> About Jesse&#39;s Leafy Feasts \u{1F33F} </h1><p class="text-lg md:text-xl text-gray-700 max-w-xl mx-auto"> Welcome to my world of culinary adventures and tech musings! I&#39;m Jesse, a computer science aficionado by day, and a voracious reader and traveler by night. Residing in the picturesque city of Utrecht, Netherlands, I balance my life between the intricacies of software development and the simple joys of exploring new cuisines and cultures. My passion for programming is only matched by my enthusiasm for discovering the next unique dish or the latest bestseller. Join me as I delve into the realms of code and cooking, where every byte meets a bite! </p></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/about.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=about-bFnSwLcz.mjs.map
