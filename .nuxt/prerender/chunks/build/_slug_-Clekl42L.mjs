import { defineComponent, ref, withAsyncContext, computed, watchEffect, unref, mergeProps, useSSRContext } from 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrRenderList } from 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/vue/server-renderer/index.mjs';
import { useRoute } from 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/vue-router/dist/vue-router.node.mjs';
import MarkdownIt from 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/markdown-it/index.mjs';
import { createClient } from 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/@supabase/supabase-js/dist/main/index.js';
import { b as useAsyncData, q as queryCollection, a as useSeoMeta, c as useRuntimeConfig } from './server.mjs';
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
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/date-fns/index.js';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/perfect-debounce/dist/index.mjs';
import '../_/renderer.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unhead/dist/server.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/devalue/index.js';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unhead/dist/plugins.mjs';
import 'file:///Users/jesselamerigts/WebDev/jesseleafy_nuxt/node_modules/unhead/dist/utils.mjs';

function useComments(postId) {
  const config = useRuntimeConfig();
  const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey);
  const comments = ref([]);
  const loading = ref(false);
  const error = ref(null);
  async function fetchComments() {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: fetchError } = await supabase.from("comments").select().eq("post_id", postId).order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      const flatComments = (data != null ? data : []).filter((c) => {
        var _a, _b;
        return ((_a = c.text) == null ? void 0 : _a.trim()) || ((_b = c.author_name) == null ? void 0 : _b.trim());
      });
      console.log("Fetched Comments:", flatComments);
      comments.value = nestComments(flatComments);
      console.log("Nested Comments:", comments.value);
    } catch (err) {
      error.value = err.message || "Failed to fetch comments";
    } finally {
      loading.value = false;
    }
  }
  async function addComment(text, author_name, parentId = null) {
    error.value = null;
    console.log("Adding comment:", { text, author_name, postId, parentId });
    try {
      const { data, error: insertError } = await supabase.from("comments").insert([{ text, author_name, post_id: postId, parent_id: parentId }]).select();
      if (insertError) throw insertError;
      if (data && data.length > 0) {
        const newComment = { ...data[0], replies: [] };
        if (parentId === null) {
          comments.value.unshift(newComment);
        } else {
          insertReply(comments.value, parentId, newComment);
        }
      }
    } catch (err) {
      error.value = err.message || "Failed to add comment";
    }
  }
  function nestComments(flatComments) {
    const map = {};
    const roots = [];
    for (const comment of flatComments) {
      comment.replies = [];
      map[comment.id] = comment;
    }
    for (const comment of flatComments) {
      if (comment.parent_id) {
        const parent = map[comment.parent_id];
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        roots.push(comment);
      }
    }
    return roots;
  }
  function insertReply(commentTree, parentId, newReply) {
    var _a;
    for (const comment of commentTree) {
      if (comment.id === parentId) {
        comment.replies.unshift(newReply);
        return true;
      }
      if ((_a = comment.replies) == null ? void 0 : _a.length) {
        const inserted = insertReply(comment.replies, parentId, newReply);
        if (inserted) return true;
      }
    }
    return false;
  }
  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const md = new MarkdownIt();
    const route = useRoute();
    const slug = route.params.slug;
    const lang = route.params.lang;
    const { comments, error } = useComments(slug);
    const newText = ref("");
    const newAuthor = ref("");
    const replyTexts = ref({});
    const replyAuthors = ref({});
    const showReplyForm = ref({});
    const { data: recipe } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "recipe",
      () => queryCollection("recipes").path(`/recipes/${lang}/${slug}`).first()
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
    const formatDate = (dateStr) => {
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      };
      return new Date(dateStr).toLocaleString(void 0, options);
    };
    watchEffect(() => {
      var _a, _b;
      if (recipe.value) {
        console.log("Recipe:", recipe.value);
      }
      useSeoMeta({
        title: ((_a = recipe.value) == null ? void 0 : _a.title) || "Recipe",
        description: ((_b = recipe.value) == null ? void 0 : _b.description) || "A delicious recipe from Jesse's Leafy Feasts."
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      if (unref(recipe)) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-4 sm:mx-auto mt-10 mb-16 w-full max-w-3xl bg-white shadow-xl rounded-xl p-4 sm:p-8" }, _attrs))}>`);
        if (unref(recipe).image) {
          _push(`<img${ssrRenderAttr("src", unref(recipe).image)}${ssrRenderAttr("alt", unref(recipe).title)} class="w-full aspect-square object-cover rounded-lg mb-6">`);
        } else {
          _push(`<!---->`);
        }
        _push(`<h1 class="text-2xl sm:text-4xl font-bold mb-4 text-gray-900">${ssrInterpolate(unref(recipe).title)}</h1><p class="text-base sm:text-lg text-gray-600 mb-8">${ssrInterpolate(unref(recipe).description)}</p>`);
        if (unref(descriptionLongHTML)) {
          _push(`<div class="text-gray-700 mb-6 prose">${(_a = unref(descriptionLongHTML)) != null ? _a : ""}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="mt-6 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"> Add to groceries list </button><section><h2 class="text-2xl font-semibold text-green-700 mb-3">Ingredients</h2>`);
        if (!unref(ingredientsSplit)) {
          _push(`<ul class="list-disc list-inside space-y-1 text-gray-800"><!--[-->`);
          ssrRenderList(unref(recipe).ingredients, (item, index) => {
            var _a2;
            _push(`<li>${(_a2 = parseIngredient(item)) != null ? _a2 : ""}</li>`);
          });
          _push(`<!--]--></ul>`);
        } else {
          _push(`<div class="space-y-4"><!--[-->`);
          ssrRenderList(unref(recipe).ingredients, (items, section) => {
            _push(`<div><h3 class="text-xl font-semibold text-green-600 mb-1 capitalize">${ssrInterpolate(String(section).replace(/_/g, " "))}</h3><ul class="list-disc list-inside space-y-1 text-gray-800"><!--[-->`);
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
        _push(`<!--]--></ol></section><section class="mt-10"><h2 class="text-2xl font-semibold text-green-700 mb-3">Comments</h2><div class="mb-6"><input${ssrRenderAttr("value", unref(newAuthor))} type="text" placeholder="Your name" class="w-full p-2 mb-2 border rounded"><textarea placeholder="Write a comment..." class="w-full p-2 border rounded" rows="3">${ssrInterpolate(unref(newText))}</textarea><button class="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"> Submit Comment </button>`);
        if (unref(error)) {
          _push(`<p class="text-red-500 mt-2">${ssrInterpolate(unref(error))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(comments).length) {
          _push(`<div class="space-y-4"><!--[-->`);
          ssrRenderList(unref(comments), (comment) => {
            _push(`<div class="p-4 border rounded-lg bg-gray-50"><div class="text-sm text-gray-500 mb-1"><span class="font-semibold text-gray-800">${ssrInterpolate(comment.author_name)}</span><span>\u2022</span><span>${ssrInterpolate(formatDate(comment.created_at))}</span></div><p class="text-gray-800">${ssrInterpolate(comment.text)}</p>`);
            if (comment.replies && comment.replies.length) {
              _push(`<div class="ml-4 mt-2 space-y-2"><!--[-->`);
              ssrRenderList(comment.replies, (reply) => {
                _push(`<div class="text-sm text-gray-700 bg-white p-2 rounded border"><strong>${ssrInterpolate(reply.author_name)}:</strong> ${ssrInterpolate(reply.text)}</div>`);
              });
              _push(`<!--]--></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<button class="mt-2 text-green-600 text-sm hover:underline"> Reply </button>`);
            if (unref(showReplyForm)[comment.id]) {
              _push(`<div class="ml-4 mt-3"><input${ssrRenderAttr("value", unref(replyAuthors)[comment.id])} type="text" placeholder="Your name" class="w-full p-2 mb-1 border rounded text-sm"><textarea placeholder="Write a reply..." class="w-full p-2 border rounded text-sm" rows="2">${ssrInterpolate(unref(replyTexts)[comment.id])}</textarea><button class="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"> Submit Reply </button></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="text-gray-500">No comments yet.</div>`);
        }
        _push(`</section></div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "text-center text-gray-500 py-20" }, _attrs))}><p>Recipe not found.</p></div>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/recipes/[lang]/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-Clekl42L.mjs.map
