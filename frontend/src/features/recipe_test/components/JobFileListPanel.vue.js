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
var props = defineProps({
    paneFocus: { type: Boolean, default: false },
    attention: { type: Boolean, default: false },
    panelStyle: { type: Object, default: function () { return ({}); } },
    modelValue: { type: String, default: '' },
    queryClass: { type: String, default: '' },
    hint: { type: String, default: '' },
    scrollLeft: { type: Number, default: 0 },
    listMode: {
        type: String,
        default: 'name',
    },
    columns: {
        type: Array,
        default: function () { return []; },
    },
    selectedIds: {
        type: Array,
        default: function () { return []; },
    },
    colWidths: {
        type: Object,
        required: true,
    },
    sortKey: {
        type: String,
        default: null,
    },
    sortDir: {
        type: String,
        default: null,
    },
});
var emit = defineEmits();
var scrollEl = (0, vue_1.ref)(null);
var headerCount = (0, vue_1.computed)(function () { return Math.max(props.columns.length, 1); });
var columnBlockWidth = (0, vue_1.computed)(function () { return ((props.listMode === 'detail' ? props.colWidths.name + props.colWidths.modifiedAt : props.colWidths.name) + 10); });
function sortIndicator(key) {
    if (props.sortKey !== key || !props.sortDir)
        return '';
    return props.sortDir === 'asc' ? '▲' : '▼';
}
function setItemRef(id, el) {
    emit('register-item-ref', { id: id, el: el instanceof HTMLElement ? el : null });
}
function setScrollRef(el) {
    scrollEl.value = el instanceof HTMLDivElement ? el : null;
    emit('register-scroll-el', scrollEl.value);
}
(0, vue_1.onMounted)(function () {
    emit('register-scroll-el', scrollEl.value);
});
(0, vue_1.onBeforeUnmount)(function () {
    emit('register-scroll-el', null);
});
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['win-input']} */ ;
/** @type {__VLS_StyleScopedClasses['win-input']} */ ;
/** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['head-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['col-resizer']} */ ;
/** @type {__VLS_StyleScopedClasses['w97-li-row']} */ ;
/** @type {__VLS_StyleScopedClasses['w97-li-row']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-name']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-time']} */ ;
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
    } }), { class: "w97-panel job-panel" }), { class: ({
        'pane-focus': __VLS_ctx.paneFocus,
        'attention-job-list': __VLS_ctx.attention,
    }) }), { style: (__VLS_ctx.panelStyle) }));
/** @type {__VLS_StyleScopedClasses['w97-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['job-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pane-focus']} */ ;
/** @type {__VLS_StyleScopedClasses['attention-job-list']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-titlebar" }));
/** @type {__VLS_StyleScopedClasses['w97-titlebar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "w97-title" }));
/** @type {__VLS_StyleScopedClasses['w97-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)(__assign(__assign(__assign(__assign(__assign({ onInput: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('update:modelValue', $event.target.value);
        // @ts-ignore
        [emit, paneFocus, attention, panelStyle,];
    } }, { onKeydown: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('search');
        // @ts-ignore
        [emit,];
    } }), { onFocus: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('activate');
        // @ts-ignore
        [emit,];
    } }), { class: "win-input w97-find" }), { class: (__VLS_ctx.queryClass) }), { value: (__VLS_ctx.modelValue), placeholder: "예: JOB47" }));
/** @type {__VLS_StyleScopedClasses['win-input']} */ ;
/** @type {__VLS_StyleScopedClasses['w97-find']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('search');
        // @ts-ignore
        [emit, queryClass, modelValue,];
    } }, { class: "win-btn iconbtn" }), { type: "button", 'aria-label': "search" }));
/** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['iconbtn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "view-mode-switch" }));
/** @type {__VLS_StyleScopedClasses['view-mode-switch']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('update:listMode', 'name');
        // @ts-ignore
        [emit,];
    } }, { class: "view-btn" }), { class: ({ active: __VLS_ctx.listMode === 'name' }) }), { type: "button", title: "Name Only" }));
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign(__assign({ onClick: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('update:listMode', 'detail');
        // @ts-ignore
        [emit, listMode,];
    } }, { class: "view-btn" }), { class: ({ active: __VLS_ctx.listMode === 'detail' }) }), { type: "button", title: "Details" }));
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
if (__VLS_ctx.hint) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "find-inline-hint" }));
    /** @type {__VLS_StyleScopedClasses['find-inline-hint']} */ ;
    (__VLS_ctx.hint);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "list-head" }));
/** @type {__VLS_StyleScopedClasses['list-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "list-head-track" }, { style: ({ transform: "translateX(".concat(-__VLS_ctx.scrollLeft, "px)") }) }));
/** @type {__VLS_StyleScopedClasses['list-head-track']} */ ;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.headerCount)); _i < _a.length; _i++) {
    var idx = _a[_i][0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ key: ("job-head-".concat(idx)) }, { class: "w97-col list-col-wide head-wide" }), { style: ({ width: __VLS_ctx.columnBlockWidth + 'px' }) }));
    /** @type {__VLS_StyleScopedClasses['w97-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['list-col-wide']} */ ;
    /** @type {__VLS_StyleScopedClasses['head-wide']} */ ;
    if (__VLS_ctx.listMode === 'detail') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.listMode === 'detail'))
                    return;
                __VLS_ctx.emit('toggle-sort', 'jobName');
                // @ts-ignore
                [emit, listMode, listMode, hint, hint, scrollLeft, headerCount, columnBlockWidth,];
            } }, { class: "head-cell name-col" }), { style: ({ width: __VLS_ctx.colWidths.name + 'px' }) }));
        /** @type {__VLS_StyleScopedClasses['head-cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['name-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "head-label" }));
        /** @type {__VLS_StyleScopedClasses['head-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "sort-ind" }));
        /** @type {__VLS_StyleScopedClasses['sort-ind']} */ ;
        (__VLS_ctx.sortIndicator('jobName'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ onMousedown: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.listMode === 'detail'))
                    return;
                __VLS_ctx.emit('start-resize', { colKey: 'name', event: $event });
                // @ts-ignore
                [emit, colWidths, sortIndicator,];
            } }, { class: "col-resizer" }));
        /** @type {__VLS_StyleScopedClasses['col-resizer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.listMode === 'detail'))
                    return;
                __VLS_ctx.emit('toggle-sort', 'modifiedAt');
                // @ts-ignore
                [emit,];
            } }, { class: "head-cell time-col" }), { style: ({ width: __VLS_ctx.colWidths.modifiedAt + 'px' }) }));
        /** @type {__VLS_StyleScopedClasses['head-cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['time-col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "head-label" }));
        /** @type {__VLS_StyleScopedClasses['head-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "sort-ind" }));
        /** @type {__VLS_StyleScopedClasses['sort-ind']} */ ;
        (__VLS_ctx.sortIndicator('modifiedAt'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ onMousedown: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.listMode === 'detail'))
                    return;
                __VLS_ctx.emit('start-resize', { colKey: 'modifiedAt', event: $event });
                // @ts-ignore
                [emit, colWidths, sortIndicator,];
            } }, { class: "col-resizer" }));
        /** @type {__VLS_StyleScopedClasses['col-resizer']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!!(__VLS_ctx.listMode === 'detail'))
                    return;
                __VLS_ctx.emit('toggle-sort', 'jobName');
                // @ts-ignore
                [emit,];
            } }, { class: "head-cell name-col only-name-head" }), { style: ({ width: __VLS_ctx.colWidths.name + 'px' }) }));
        /** @type {__VLS_StyleScopedClasses['head-cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['name-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['only-name-head']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "head-label" }));
        /** @type {__VLS_StyleScopedClasses['head-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "sort-ind" }));
        /** @type {__VLS_StyleScopedClasses['sort-ind']} */ ;
        (__VLS_ctx.sortIndicator('jobName'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ onMousedown: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!!(__VLS_ctx.listMode === 'detail'))
                    return;
                __VLS_ctx.emit('start-resize', { colKey: 'name', event: $event });
                // @ts-ignore
                [emit, colWidths, sortIndicator,];
            } }, { class: "col-resizer" }));
        /** @type {__VLS_StyleScopedClasses['col-resizer']} */ ;
    }
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onScroll: function () {
        var _a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _a[_i] = arguments[_i];
        }
        var $event = _a[0];
        __VLS_ctx.emit('body-scroll');
        // @ts-ignore
        [emit,];
    } }, { class: "w97-scroll job-scroll" }), { ref: (__VLS_ctx.setScrollRef) }));
/** @type {__VLS_StyleScopedClasses['w97-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['job-scroll']} */ ;
for (var _b = 0, _c = __VLS_vFor((__VLS_ctx.columns)); _b < _c.length; _b++) {
    var _d = _c[_b], col = _d[0], idx = _d[1];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ class: "w97-col list-col-wide" }, { key: (idx) }), { style: ({ width: __VLS_ctx.columnBlockWidth + 'px' }) }));
    /** @type {__VLS_StyleScopedClasses['w97-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['list-col-wide']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)(__assign({ class: "w97-ul" }));
    /** @type {__VLS_StyleScopedClasses['w97-ul']} */ ;
    var _loop_1 = function (item) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)(__assign(__assign(__assign(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.emit('item-click', { id: item.id, event: $event });
                // @ts-ignore
                [emit, columnBlockWidth, setScrollRef, columns,];
            } }, { onContextmenu: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.emit('item-contextmenu', { id: item.id, event: $event });
                // @ts-ignore
                [emit,];
            } }), { key: (item.id) }), { class: "w97-li w97-li-row" }), { class: ({ active: __VLS_ctx.selectedIds.includes(item.id), 'detail-row': __VLS_ctx.listMode === 'detail' }) }), { ref: (function (el) { return __VLS_ctx.setItemRef(item.id, el); }) }));
        /** @type {__VLS_StyleScopedClasses['w97-li']} */ ;
        /** @type {__VLS_StyleScopedClasses['w97-li-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
        if (__VLS_ctx.listMode === 'detail') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign(__assign({ class: "cell-name name-col" }, { style: ({ width: __VLS_ctx.colWidths.name + 'px' }) }), { title: (item.jobName) }));
            /** @type {__VLS_StyleScopedClasses['cell-name']} */ ;
            /** @type {__VLS_StyleScopedClasses['name-col']} */ ;
            (item.displayName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-time time-col" }, { style: ({ width: __VLS_ctx.colWidths.modifiedAt + 'px' }) }));
            /** @type {__VLS_StyleScopedClasses['cell-time']} */ ;
            /** @type {__VLS_StyleScopedClasses['time-col']} */ ;
            (item.displayModifiedAt);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign(__assign({ class: "name-only" }, { style: ({ width: __VLS_ctx.colWidths.name + 'px' }) }), { title: (item.jobName) }));
            /** @type {__VLS_StyleScopedClasses['name-only']} */ ;
            (item.displayName);
        }
        // @ts-ignore
        [listMode, listMode, colWidths, colWidths, colWidths, selectedIds, setItemRef,];
    };
    for (var _e = 0, _f = __VLS_vFor((col)); _e < _f.length; _e++) {
        var item = _f[_e][0];
        _loop_1(item);
    }
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    props: {
        paneFocus: { type: Boolean, default: false },
        attention: { type: Boolean, default: false },
        panelStyle: { type: Object, default: function () { return ({}); } },
        modelValue: { type: String, default: '' },
        queryClass: { type: String, default: '' },
        hint: { type: String, default: '' },
        scrollLeft: { type: Number, default: 0 },
        listMode: {
            type: String,
            default: 'name',
        },
        columns: {
            type: Array,
            default: function () { return []; },
        },
        selectedIds: {
            type: Array,
            default: function () { return []; },
        },
        colWidths: {
            type: Object,
            required: true,
        },
        sortKey: {
            type: String,
            default: null,
        },
        sortDir: {
            type: String,
            default: null,
        },
    },
});
exports.default = {};
