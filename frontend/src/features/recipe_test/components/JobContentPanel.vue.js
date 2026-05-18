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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var JobParsedContent_vue_1 = require("./JobParsedContent.vue");
var __VLS_props = defineProps({
    show: { type: Boolean, default: false },
    paneFocus: { type: Boolean, default: false },
    panelStyle: { type: Object, default: function () { return ({}); } },
    paneHeight: { type: String, required: true },
    jobName: { type: String, default: '' },
    editMode: { type: Boolean, default: false },
    parsed: { type: Object, default: null },
    noneLabel: { type: String, default: '(None)' },
    missingRecipeMap: { type: Object, default: function () { return ({}); } },
});
var emit = defineEmits();
function setContentRef(el) {
    emit('register-content-el', el instanceof HTMLElement ? el : null);
}
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)(__assign(__assign(__assign(__assign({ onMousedown: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('activate');
        // @ts-ignore
        [emit,];
    } }, { onContextmenu: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('open-menu', $event);
        // @ts-ignore
        [emit,];
    } }), { class: "content" }), { class: ({ 'pane-focus': __VLS_ctx.paneFocus }) }), { style: (__VLS_ctx.panelStyle) }));
/** @type {__VLS_StyleScopedClasses['content']} */ ;
/** @type {__VLS_StyleScopedClasses['pane-focus']} */ ;
var __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    name: "slideCard",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        name: "slideCard",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = __VLS_3.slots.default;
if (__VLS_ctx.show) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ class: "card content-card" }, { style: ({ height: __VLS_ctx.paneHeight }) }), { ref: (__VLS_ctx.setContentRef) }));
    /** @type {__VLS_StyleScopedClasses['card']} */ ;
    /** @type {__VLS_StyleScopedClasses['content-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "ch" }));
    /** @type {__VLS_StyleScopedClasses['ch']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "job-head-left" }));
    /** @type {__VLS_StyleScopedClasses['job-head-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "ct" }));
    /** @type {__VLS_StyleScopedClasses['ct']} */ ;
    (__VLS_ctx.jobName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "job-head-right" }));
    /** @type {__VLS_StyleScopedClasses['job-head-right']} */ ;
    if (__VLS_ctx.editMode) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "edit-pill edit-pill-strong" }));
        /** @type {__VLS_StyleScopedClasses['edit-pill']} */ ;
        /** @type {__VLS_StyleScopedClasses['edit-pill-strong']} */ ;
    }
    if (!__VLS_ctx.editMode) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.show))
                    return;
                if (!(!__VLS_ctx.editMode))
                    return;
                __VLS_ctx.emit('enter-edit');
                // @ts-ignore
                [emit, paneFocus, panelStyle, show, paneHeight, setContentRef, jobName, editMode, editMode,];
            } }, { class: "win-btn save-btn" }));
        /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.show))
                    return;
                if (!!(!__VLS_ctx.editMode))
                    return;
                __VLS_ctx.emit('save');
                // @ts-ignore
                [emit,];
            } }, { class: "win-btn save-btn" }));
        /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.show))
                    return;
                if (!!(!__VLS_ctx.editMode))
                    return;
                __VLS_ctx.emit('cancel');
                // @ts-ignore
                [emit,];
            } }, { class: "win-btn" }));
        /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
    }
    var __VLS_6 = JobParsedContent_vue_1.default;
    // @ts-ignore
    var __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6(__assign(__assign({ 'onToggleFlag': {} }, { 'onValueClick': {} }), { parsed: (__VLS_ctx.parsed), editable: (__VLS_ctx.editMode), noneLabel: (__VLS_ctx.noneLabel), missingRecipeMap: (__VLS_ctx.missingRecipeMap) })));
    var __VLS_8 = __VLS_7.apply(void 0, __spreadArray([__assign(__assign({ 'onToggleFlag': {} }, { 'onValueClick': {} }), { parsed: (__VLS_ctx.parsed), editable: (__VLS_ctx.editMode), noneLabel: (__VLS_ctx.noneLabel), missingRecipeMap: (__VLS_ctx.missingRecipeMap) })], __VLS_functionalComponentArgsRest(__VLS_7), false));
    var __VLS_11 = void 0;
    var __VLS_12 = ({ toggleFlag: {} },
        { onToggleFlag: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.show))
                    return;
                __VLS_ctx.emit('toggle-flag', $event);
                // @ts-ignore
                [emit, editMode, parsed, noneLabel, missingRecipeMap,];
            } });
    var __VLS_13 = ({ valueClick: {} },
        { onValueClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.show))
                    return;
                __VLS_ctx.emit('value-click', $event);
                // @ts-ignore
                [emit,];
            } });
    var __VLS_9;
    var __VLS_10;
}
// @ts-ignore
[];
var __VLS_3;
if (!__VLS_ctx.show) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "content-placeholder" }, { style: ({ height: __VLS_ctx.paneHeight }) }));
    /** @type {__VLS_StyleScopedClasses['content-placeholder']} */ ;
}
// @ts-ignore
[show, paneHeight,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    props: {
        show: { type: Boolean, default: false },
        paneFocus: { type: Boolean, default: false },
        panelStyle: { type: Object, default: function () { return ({}); } },
        paneHeight: { type: String, required: true },
        jobName: { type: String, default: '' },
        editMode: { type: Boolean, default: false },
        parsed: { type: Object, default: null },
        noneLabel: { type: String, default: '(None)' },
        missingRecipeMap: { type: Object, default: function () { return ({}); } },
    },
});
exports.default = {};
