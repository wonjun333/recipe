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
var __VLS_props = defineProps({
    visible: { type: Boolean, default: false },
    paneFocus: { type: Boolean, default: false },
    panelStyle: { type: Object, default: function () { return ({}); } },
    casIdDisplay: { type: String, default: '' },
    editMode: { type: Boolean, default: false },
    tab: { type: String, default: 'standard' },
    tabLabel: { type: String, default: 'Standard' },
    tableRows: {
        type: Array,
        default: function () { return []; },
    },
    tableHeaders: {
        type: Array,
        default: function () { return []; },
    },
    tableColWidths: {
        type: Array,
        default: function () { return []; },
    },
    selectedSlots: {
        type: Array,
        default: function () { return []; },
    },
});
var emit = defineEmits();
function displayJobName(name) {
    var text = String(name !== null && name !== void 0 ? name : '').trim();
    return text.toLowerCase().endsWith('.job') ? text.slice(0, -4) : text;
}
function setRootRef(el) {
    emit('register-root', el instanceof HTMLElement ? el : null);
}
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['win-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['win-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['cas-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cas-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cas-table']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['cas-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['cas-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['col-resizer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)(__assign(__assign(__assign(__assign(__assign({ onMousedown: function () {
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
    } }), { class: "cas-content" }), { class: ({ open: __VLS_ctx.visible, 'pane-focus': __VLS_ctx.paneFocus }) }), { style: (__VLS_ctx.panelStyle) }), { ref: (__VLS_ctx.setRootRef) }));
/** @type {__VLS_StyleScopedClasses['cas-content']} */ ;
/** @type {__VLS_StyleScopedClasses['open']} */ ;
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
if (__VLS_ctx.visible) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-win97" }));
    /** @type {__VLS_StyleScopedClasses['cas-win97']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-bar" }));
    /** @type {__VLS_StyleScopedClasses['cas-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-bar-left" }));
    /** @type {__VLS_StyleScopedClasses['cas-bar-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-bar-right" }));
    /** @type {__VLS_StyleScopedClasses['cas-bar-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cas-id" }));
    /** @type {__VLS_StyleScopedClasses['cas-id']} */ ;
    (__VLS_ctx.casIdDisplay);
    if (__VLS_ctx.editMode) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "edit-pill" }));
        /** @type {__VLS_StyleScopedClasses['edit-pill']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-tabs" }));
    /** @type {__VLS_StyleScopedClasses['cas-tabs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.visible))
                return;
            __VLS_ctx.emit('update:tab', 'standard');
            // @ts-ignore
            [emit, visible, visible, paneFocus, panelStyle, setRootRef, casIdDisplay, editMode,];
        } }, { class: "win-tab" }), { class: ({ active: __VLS_ctx.tab === 'standard' }) }));
    /** @type {__VLS_StyleScopedClasses['win-tab']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.visible))
                return;
            __VLS_ctx.emit('update:tab', 'pre');
            // @ts-ignore
            [emit, tab,];
        } }, { class: "win-tab" }), { class: ({ active: __VLS_ctx.tab === 'pre' }) }));
    /** @type {__VLS_StyleScopedClasses['win-tab']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.visible))
                return;
            __VLS_ctx.emit('update:tab', 'gating');
            // @ts-ignore
            [emit, tab,];
        } }, { class: "win-tab" }), { class: ({ active: __VLS_ctx.tab === 'gating' }) }));
    /** @type {__VLS_StyleScopedClasses['win-tab']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.visible))
                return;
            __VLS_ctx.emit('update:tab', 'post');
            // @ts-ignore
            [emit, tab,];
        } }, { class: "win-tab" }), { class: ({ active: __VLS_ctx.tab === 'post' }) }));
    /** @type {__VLS_StyleScopedClasses['win-tab']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-body" }));
    /** @type {__VLS_StyleScopedClasses['cas-body']} */ ;
    if (__VLS_ctx.tab === 'standard') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-std-bar" }));
        /** @type {__VLS_StyleScopedClasses['cas-std-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-std-hint" }));
        /** @type {__VLS_StyleScopedClasses['cas-std-hint']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-std-actions" }));
        /** @type {__VLS_StyleScopedClasses['cas-std-actions']} */ ;
        if (!__VLS_ctx.editMode) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.visible))
                        return;
                    if (!(__VLS_ctx.tab === 'standard'))
                        return;
                    if (!(!__VLS_ctx.editMode))
                        return;
                    __VLS_ctx.emit('save-as');
                    // @ts-ignore
                    [emit, editMode, tab, tab,];
                } }, { class: "win-btn save-btn" }));
            /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
            /** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
        }
        if (!__VLS_ctx.editMode) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.visible))
                        return;
                    if (!(__VLS_ctx.tab === 'standard'))
                        return;
                    if (!(!__VLS_ctx.editMode))
                        return;
                    __VLS_ctx.emit('enter-edit');
                    // @ts-ignore
                    [emit, editMode,];
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
                    if (!(__VLS_ctx.visible))
                        return;
                    if (!(__VLS_ctx.tab === 'standard'))
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
                    if (!(__VLS_ctx.visible))
                        return;
                    if (!(__VLS_ctx.tab === 'standard'))
                        return;
                    if (!!(!__VLS_ctx.editMode))
                        return;
                    __VLS_ctx.emit('cancel');
                    // @ts-ignore
                    [emit,];
                } }, { class: "win-btn" }));
            /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-table-wrap" }));
        /** @type {__VLS_StyleScopedClasses['cas-table-wrap']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)(__assign({ class: "cas-table" }));
        /** @type {__VLS_StyleScopedClasses['cas-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.colgroup, __VLS_intrinsics.colgroup)({});
        for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.tableColWidths)); _i < _a.length; _i++) {
            var _b = _a[_i], w = _b[0], i = _b[1];
            __VLS_asFunctionalElement1(__VLS_intrinsics.col)(__assign({ key: ("cas-col-".concat(i)) }, { style: ({ width: "".concat(w, "px") }) }));
            // @ts-ignore
            [tableColWidths,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        var _loop_1 = function (label, i) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.visible))
                        return;
                    if (!(__VLS_ctx.tab === 'standard'))
                        return;
                    __VLS_ctx.emit('header-click', i);
                    // @ts-ignore
                    [emit, tableHeaders,];
                } }, { key: (label) }), { class: ({ clickable: i === 1 }) }));
            /** @type {__VLS_StyleScopedClasses['clickable']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "th-label" }));
            /** @type {__VLS_StyleScopedClasses['th-label']} */ ;
            (label);
            if (i < __VLS_ctx.tableHeaders.length - 1) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ onMousedown: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(__VLS_ctx.visible))
                            return;
                        if (!(__VLS_ctx.tab === 'standard'))
                            return;
                        if (!(i < __VLS_ctx.tableHeaders.length - 1))
                            return;
                        __VLS_ctx.emit('start-resize', { index: i, event: $event });
                        // @ts-ignore
                        [emit, tableHeaders,];
                    } }, { class: "col-resizer" }));
                /** @type {__VLS_StyleScopedClasses['col-resizer']} */ ;
            }
            // @ts-ignore
            [];
        };
        for (var _c = 0, _d = __VLS_vFor((__VLS_ctx.tableHeaders)); _c < _d.length; _c++) {
            var _e = _d[_c], label = _e[0], i = _e[1];
            _loop_1(label, i);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        var _loop_2 = function (row) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (row.slot),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "center cas-td" }));
            /** @type {__VLS_StyleScopedClasses['center']} */ ;
            /** @type {__VLS_StyleScopedClasses['cas-td']} */ ;
            (row.slot);
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.visible))
                        return;
                    if (!(__VLS_ctx.tab === 'standard'))
                        return;
                    __VLS_ctx.emit('cell-click', { slot: row.slot, jobName: row.jobName, event: $event });
                    // @ts-ignore
                    [emit, tableRows,];
                } }, { class: "center cas-td cas-cell" }), { class: ({ sel: __VLS_ctx.editMode && __VLS_ctx.selectedSlots.includes(row.slot) }) }));
            /** @type {__VLS_StyleScopedClasses['center']} */ ;
            /** @type {__VLS_StyleScopedClasses['cas-td']} */ ;
            /** @type {__VLS_StyleScopedClasses['cas-cell']} */ ;
            /** @type {__VLS_StyleScopedClasses['sel']} */ ;
            (__VLS_ctx.displayJobName(row.jobName));
            // @ts-ignore
            [editMode, selectedSlots, displayJobName,];
        };
        for (var _f = 0, _g = __VLS_vFor((__VLS_ctx.tableRows)); _f < _g.length; _f++) {
            var row = _g[_f][0];
            _loop_2(row);
        }
        if (__VLS_ctx.editMode) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-edit-hint" }));
            /** @type {__VLS_StyleScopedClasses['cas-edit-hint']} */ ;
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cas-todo" }));
        /** @type {__VLS_StyleScopedClasses['cas-todo']} */ ;
        (__VLS_ctx.tabLabel);
    }
}
// @ts-ignore
[editMode, tabLabel,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    props: {
        visible: { type: Boolean, default: false },
        paneFocus: { type: Boolean, default: false },
        panelStyle: { type: Object, default: function () { return ({}); } },
        casIdDisplay: { type: String, default: '' },
        editMode: { type: Boolean, default: false },
        tab: { type: String, default: 'standard' },
        tabLabel: { type: String, default: 'Standard' },
        tableRows: {
            type: Array,
            default: function () { return []; },
        },
        tableHeaders: {
            type: Array,
            default: function () { return []; },
        },
        tableColWidths: {
            type: Array,
            default: function () { return []; },
        },
        selectedSlots: {
            type: Array,
            default: function () { return []; },
        },
    },
});
exports.default = {};
