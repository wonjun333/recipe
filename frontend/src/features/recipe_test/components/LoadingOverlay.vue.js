"use strict";
/// <reference types="../../../../node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../node_modules/@vue/language-core/types/props-fallback.d.ts" />
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var __VLS_props = defineProps();
var __VLS_ctx = __assign(__assign(__assign({}, {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
if (__VLS_ctx.visible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "loading-overlay" }));
    /** @type {__VLS_StyleScopedClasses['loading-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "loading-card" }));
    /** @type {__VLS_StyleScopedClasses['loading-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "spinner" }));
    /** @type {__VLS_StyleScopedClasses['spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "loading-text" }));
    /** @type {__VLS_StyleScopedClasses['loading-text']} */ ;
    (__VLS_ctx.message);
}
// @ts-ignore
[visible, message,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeProps: {},
});
exports.default = {};
