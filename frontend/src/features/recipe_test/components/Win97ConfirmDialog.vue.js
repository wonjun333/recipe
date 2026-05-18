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
var emit = defineEmits();
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['w97-modal-titlebar']} */ ;
/** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
if (__VLS_ctx.open) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal-overlay" }));
    /** @type {__VLS_StyleScopedClasses['w97-modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal" }));
    /** @type {__VLS_StyleScopedClasses['w97-modal']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal-titlebar" }, { class: ({ warn: __VLS_ctx.tone === 'warn' }) }));
    /** @type {__VLS_StyleScopedClasses['w97-modal-titlebar']} */ ;
    /** @type {__VLS_StyleScopedClasses['warn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal-title" }));
    /** @type {__VLS_StyleScopedClasses['w97-modal-title']} */ ;
    (__VLS_ctx.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal-body" }));
    /** @type {__VLS_StyleScopedClasses['w97-modal-body']} */ ;
    (__VLS_ctx.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal-actions" }));
    /** @type {__VLS_StyleScopedClasses['w97-modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('yes');
            // @ts-ignore
            [open, tone, title, message, emit,];
        } }, { class: "win-btn" }));
    /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('no');
            // @ts-ignore
            [emit,];
        } }, { class: "win-btn" }));
    /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
