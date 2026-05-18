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
var __VLS_props = defineProps({
    open: { type: Boolean, default: false },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    items: {
        type: Array,
        default: function () { return []; },
    },
});
var __VLS_ctx = __assign(__assign(__assign({}, {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['w97-menu-item']} */ ;
if (__VLS_ctx.open) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-menu" }, { style: ({ left: __VLS_ctx.x + 'px', top: __VLS_ctx.y + 'px' }) }));
    /** @type {__VLS_StyleScopedClasses['w97-menu']} */ ;
    var _loop_1 = function (it, idx) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.open))
                    return;
                it.action();
                // @ts-ignore
                [open, x, y, items,];
            } }, { key: (idx) }), { class: "w97-menu-item" }));
        /** @type {__VLS_StyleScopedClasses['w97-menu-item']} */ ;
        (it.label);
        // @ts-ignore
        [];
    };
    for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.items)); _i < _a.length; _i++) {
        var _b = _a[_i], it = _b[0], idx = _b[1];
        _loop_1(it, idx);
    }
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    props: {
        open: { type: Boolean, default: false },
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        items: {
            type: Array,
            default: function () { return []; },
        },
    },
});
exports.default = {};
