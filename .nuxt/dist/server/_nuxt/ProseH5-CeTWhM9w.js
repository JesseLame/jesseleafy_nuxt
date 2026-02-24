import { computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderSlot } from "vue/server-renderer";
import { c as useRuntimeConfig } from "../server.mjs";
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
  __name: "ProseH5",
  __ssrInlineRender: true,
  props: {
    id: { type: String, required: false }
  },
  setup(__props) {
    const props = __props;
    const { headings } = useRuntimeConfig().public.mdc;
    const generate = computed(() => {
      var _a;
      return props.id && (typeof (headings == null ? void 0 : headings.anchorLinks) === "boolean" && (headings == null ? void 0 : headings.anchorLinks) === true || typeof (headings == null ? void 0 : headings.anchorLinks) === "object" && ((_a = headings == null ? void 0 : headings.anchorLinks) == null ? void 0 : _a.h5));
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<h5${ssrRenderAttrs(mergeProps({
        id: props.id
      }, _attrs))}>`);
      if (props.id && unref(generate)) {
        _push(`<a${ssrRenderAttr("href", `#${props.id}`)}>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</a>`);
      } else {
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      }
      _push(`</h5>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/@nuxtjs/mdc/dist/runtime/components/prose/ProseH5.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=ProseH5-CeTWhM9w.js.map
