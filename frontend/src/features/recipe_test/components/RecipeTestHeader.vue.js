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
var vue_1 = require("vue");
var props = defineProps();
var emit = defineEmits();
var shaking = (0, vue_1.ref)(false);
var shakeTimer = null;
(0, vue_1.watch)(function () { return props.cartShakeToken; }, function () {
    shaking.value = false;
    if (shakeTimer)
        window.clearTimeout(shakeTimer);
    requestAnimationFrame(function () {
        shaking.value = true;
        shakeTimer = window.setTimeout(function () {
            shaking.value = false;
        }, 720);
    });
});
function setCartRef(el) {
    emit('register-cart-anchor', el instanceof HTMLElement ? el : null);
}
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['ctl']} */ ;
/** @type {__VLS_StyleScopedClasses['ctl']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)(__assign({ class: "header" }));
/** @type {__VLS_StyleScopedClasses['header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('reset');
        // @ts-ignore
        [emit,];
    } }, { class: "title-wrap" }), { type: "button" }));
/** @type {__VLS_StyleScopedClasses['title-wrap']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "t1" }));
/** @type {__VLS_StyleScopedClasses['t1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "t2" }));
/** @type {__VLS_StyleScopedClasses['t2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "controls" }));
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)(__assign({ class: "inline-field" }));
/** @type {__VLS_StyleScopedClasses['inline-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "field-label" }));
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)(__assign(__assign({ onChange: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('update:line', $event.target.value);
        // @ts-ignore
        [emit,];
    } }, { class: "ctl" }), { value: (__VLS_ctx.line) }));
/** @type {__VLS_StyleScopedClasses['ctl']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.filteredLineOptions)); _i < _a.length; _i++) {
    var v = _a[_i][0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (v),
        value: (v),
    });
    (v);
    // @ts-ignore
    [line, filteredLineOptions,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)(__assign({ class: "inline-field" }));
/** @type {__VLS_StyleScopedClasses['inline-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "field-label" }));
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)(__assign(__assign({ onChange: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('update:team', $event.target.value);
        // @ts-ignore
        [emit,];
    } }, { class: "ctl" }), { value: (__VLS_ctx.team) }));
/** @type {__VLS_StyleScopedClasses['ctl']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (var _b = 0, _c = __VLS_vFor((__VLS_ctx.filteredTeamOptions)); _b < _c.length; _b++) {
    var v = _c[_b][0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (v),
        value: (v),
    });
    (v);
    // @ts-ignore
    [team, filteredTeamOptions,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)(__assign({ class: "inline-field eqp-field" }));
/** @type {__VLS_StyleScopedClasses['inline-field']} */ ;
/** @type {__VLS_StyleScopedClasses['eqp-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "field-label" }));
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)(__assign(__assign({ onChange: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('update:eqpId', $event.target.value);
        // @ts-ignore
        [emit,];
    } }, { class: "ctl" }), { value: (__VLS_ctx.eqpId) }));
/** @type {__VLS_StyleScopedClasses['ctl']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
    value: "",
});
for (var _d = 0, _e = __VLS_vFor((__VLS_ctx.filteredEqpOptions)); _d < _e.length; _d++) {
    var v = _e[_d][0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        key: (v),
        value: (v),
    });
    (v);
    // @ts-ignore
    [eqpId, filteredEqpOptions,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('load');
        // @ts-ignore
        [emit,];
    } }, { class: "btn" }), { disabled: (__VLS_ctx.isLoading) }));
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
(__VLS_ctx.isLoading ? 'Loading...' : 'Load');
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('toggle-cart');
        // @ts-ignore
        [emit, isLoading, isLoading,];
    } }, { class: "cart-btn" }), { class: ({ open: __VLS_ctx.cartOpen, shake: __VLS_ctx.shaking }) }), { ref: (__VLS_ctx.setCartRef), type: "button", 'aria-label': "shopping cart" }));
/** @type {__VLS_StyleScopedClasses['cart-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['open']} */ ;
/** @type {__VLS_StyleScopedClasses['shake']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cart-icon" }));
/** @type {__VLS_StyleScopedClasses['cart-icon']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cart-label" }));
/** @type {__VLS_StyleScopedClasses['cart-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cart-badge" }));
/** @type {__VLS_StyleScopedClasses['cart-badge']} */ ;
(__VLS_ctx.cartCount);
// @ts-ignore
[cartOpen, shaking, setCartRef, cartCount,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
