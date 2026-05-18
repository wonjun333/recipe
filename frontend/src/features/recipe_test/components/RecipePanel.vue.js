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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var props = defineProps({
    open: { type: Boolean, default: false },
    activePlaten: { type: Number, default: 1 },
    findModel: { type: String, default: '' },
    findClass: { type: String, default: '' },
    recipeCols: {
        type: Array,
        default: function () { return []; },
    },
    selectedRecipeIds: {
        type: Array,
        default: function () { return []; },
    },
    selectedRecipeSingle: {
        type: Object,
        default: null,
    },
    titleBase: { type: String, default: 'Recipe' },
    emphasizeText: { type: String, default: '' },
    editMode: { type: Boolean, default: false },
    listMode: {
        type: String,
        default: 'name',
    },
    scrollLeft: { type: Number, default: 0 },
    colWidths: {
        type: Object,
        default: function () { return ({ name: 240, modifiedAt: 120 }); },
    },
});
var emit = defineEmits();
var computedTitlePrefix = (0, vue_1.computed)(function () { return (props.editMode ? 'Select' : ''); });
var richRecipeKinds = ['megasonics', 'brush1', 'brush2', 'vaporDryer'];
var isPolPreview = (0, vue_1.computed)(function () { var _a, _b, _c; return String((_c = (_b = (_a = props.selectedRecipeSingle) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.sourceType) !== null && _c !== void 0 ? _c : '') === 'pol'; });
var isPolConPreview = (0, vue_1.computed)(function () { var _a, _b, _c; return ['pol', 'con'].includes(String((_c = (_b = (_a = props.selectedRecipeSingle) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.sourceType) !== null && _c !== void 0 ? _c : '')); });
function stripKnownRecipeExt(name) {
    return String(name !== null && name !== void 0 ? name : '').trim().replace(/\.(br|meg|dryr|drpr|pol|con|alg|seg|scx|cln)$/i, '');
}
function displayListName(name) {
    return stripKnownRecipeExt(name);
}
function recipeCellUi(column, row) {
    var _a, _b;
    return ((_b = (_a = row === null || row === void 0 ? void 0 : row.__ui__) === null || _a === void 0 ? void 0 : _a[column]) !== null && _b !== void 0 ? _b : {});
}
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function recipeHeaderClass(column) {
    return {
        'recipe-header-emphasis': ['Wafer RPM', 'Brush RPM', 'IPA Flow', 'N2 Vapor Carrier Flow'].includes(column),
    };
}
function recipeCellClass(column, value, row) {
    var _a, _b, _c, _d;
    var text = String(value !== null && value !== void 0 ? value : '').trim();
    var sourceKind = (_b = (_a = props.selectedRecipeSingle) === null || _a === void 0 ? void 0 : _a.sourceKind) !== null && _b !== void 0 ? _b : '';
    var ui = recipeCellUi(column, row);
    return {
        'recipe-cell-preline': text.includes('\n'),
        'recipe-checkbox-cell': ui.kind === 'checkbox',
        'cell-cyan': ui.tone === 'cyan'
            || (sourceKind === 'megasonics' && column === 'Wafer RPM')
            || ((sourceKind === 'brush1' || sourceKind === 'brush2') && (column === 'Brush RPM' || column === 'Wafer RPM')),
        'cell-green': ui.tone === 'green'
            || ((sourceKind === 'brush1' || sourceKind === 'brush2') && column === 'DIW to Brushes' && /^on\b/i.test(text))
            || ((sourceKind === 'brush1' || sourceKind === 'brush2') && column === 'Spray Bar Flow Settings' && !/^off\b/i.test(text))
            || (sourceKind === 'vaporDryer' && column === 'Value' && (String((_c = row === null || row === void 0 ? void 0 : row.Item) !== null && _c !== void 0 ? _c : '').trim() === 'IPA Flow'
                || String((_d = row === null || row === void 0 ? void 0 : row.Item) !== null && _d !== void 0 ? _d : '').trim() === 'N2 Vapor Carrier Flow')),
        'cell-yellow': ui.tone === 'yellow',
        'cell-disabled': ui.tone === 'disabled',
        'cell-white': ui.tone === 'white',
        'cell-error': ui.tone === 'error',
        'recipe-cell-center': ui.align === 'center',
    };
}
function formatRecipeLine(line) {
    var html = escapeHtml(String(line !== null && line !== void 0 ? line : ''));
    html = html.replace(/\b(Sine|No Sweep|zones|swps\/min|ml\/min|psi)\b/g, '<span class="recipe-unit">$1</span>');
    html = html.replace(/(\d(?:[\d.]*)?)\s+(s)\b/g, '$1 <span class="recipe-unit">$2</span>');
    html = html.replace(/(\d(?:[\d.]*)?)\s+(in)\b/g, '$1 <span class="recipe-unit">$2</span>');
    return "<span class=\"recipe-line\">".concat(html, "</span>");
}
function recipeCellHtml(column, value, row) {
    var ui = recipeCellUi(column, row);
    if (ui.kind === 'checkbox') {
        var checked = !!ui.checked;
        var disabled = ui.enabled === false;
        return "<span class=\"recipe-check-box ".concat(checked ? 'checked' : '', " ").concat(disabled ? 'disabled' : '', "\"></span>");
    }
    var text = String(value !== null && value !== void 0 ? value : '');
    var lines = text.split('\n');
    if (lines.length <= 1)
        return formatRecipeLine(text);
    return lines.map(formatRecipeLine).join('<br>');
}
var headerCount = (0, vue_1.computed)(function () { return Math.max(props.recipeCols.length, 1); });
var columnBlockWidth = (0, vue_1.computed)(function () { return ((props.listMode === 'detail' ? props.colWidths.name + props.colWidths.modifiedAt : props.colWidths.name) + 8); });
var displayPreviewColumns = (0, vue_1.computed)(function () { var _a, _b; return ((_b = (_a = props.selectedRecipeSingle) === null || _a === void 0 ? void 0 : _a.columns) !== null && _b !== void 0 ? _b : []).filter(function (c) { return c !== '#' && c !== '__ui__'; }); });
function previewColumnStyle(column) {
    var _a, _b, _c, _d, _e;
    var sourceKind = (_b = (_a = props.selectedRecipeSingle) === null || _a === void 0 ? void 0 : _a.sourceKind) !== null && _b !== void 0 ? _b : '';
    var sourceType = String((_e = (_d = (_c = props.selectedRecipeSingle) === null || _c === void 0 ? void 0 : _c.meta) === null || _d === void 0 ? void 0 : _d.sourceType) !== null && _e !== void 0 ? _e : '');
    if (sourceKind === 'megasonics') {
        if (column === '__index__')
            return { width: '52px' };
        if (column === 'Description')
            return { width: '28%' };
        if (column === 'Time')
            return { width: '18%' };
        if (column === 'Wafer RPM')
            return { width: '22%' };
        if (column === 'Meg Power')
            return { width: '20%' };
    }
    if (sourceKind === 'brush1' || sourceKind === 'brush2') {
        if (column === '__index__')
            return { width: '4%' };
        if (column === 'Description')
            return { width: '12%' };
        if (column === 'Time')
            return { width: '7%' };
        if (column === 'Brush RPM')
            return { width: '10%' };
        if (column === 'Brush Position')
            return { width: '14%' };
        if (column === 'Wafer RPM')
            return { width: '10%' };
        if (column === 'DIW to Brushes')
            return { width: '12%' };
        if (column === 'Spray Bar Flow Settings')
            return { width: '22%' };
        if (column === 'DIW to Dual Spray Bars')
            return { width: '9%' };
    }
    if (sourceType === 'pol' || sourceType === 'con') {
        if (column === '__index__')
            return { width: '52px' };
        if (column === 'Description')
            return { width: '14%' };
        if (column === 'Main' || column === 'RTPC' || column === 'HPR' || column === 'Head Rinse')
            return { width: '6%' };
        if (column === 'End By')
            return { width: '11%' };
        if (column === 'Platen RPM' || column === 'Head RPM')
            return { width: '8%' };
        if (column === 'Head Sweep')
            return { width: '11%' };
        if (column.startsWith('Z') || column === 'RR State')
            return { width: '7%' };
        if (column.startsWith('L'))
            return { width: '8%' };
    }
    if (sourceKind === 'vaporDryer') {
        if (column === '__index__')
            return { width: '60px' };
        if (column === 'Item')
            return { width: '34%' };
        if (column === 'Value')
            return { width: '58%' };
    }
    if (column === '__index__')
        return { width: '52px' };
    return {};
}
function setItemRef(id, el) {
    emit('register-item-ref', { id: id, el: el instanceof HTMLElement ? el : null });
}
function setRootRef(el) {
    emit('register-root', el instanceof HTMLElement ? el : null);
}
function setScrollRef(el) {
    emit('register-scroll-el', el instanceof HTMLDivElement ? el : null);
}
(0, vue_1.onBeforeUnmount)(function () {
    emit('register-root', null);
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
/** @type {__VLS_StyleScopedClasses['recipe-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['list-li']} */ ;
/** @type {__VLS_StyleScopedClasses['list-li']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['name-only']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-name']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-time']} */ ;
/** @type {__VLS_StyleScopedClasses['legacy-table']} */ ;
/** @type {__VLS_StyleScopedClasses['legacy-table']} */ ;
/** @type {__VLS_StyleScopedClasses['jobish-table']} */ ;
/** @type {__VLS_StyleScopedClasses['jobish-table']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['polcon-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['polcon-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['pol-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['pol-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['recipe-cell-text']} */ ;
/** @type {__VLS_StyleScopedClasses['recipe-cell-text']} */ ;
/** @type {__VLS_StyleScopedClasses['recipe-check-box']} */ ;
/** @type {__VLS_StyleScopedClasses['recipe-check-box']} */ ;
var __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    name: "slideDown",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        name: "slideDown",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = __VLS_3.slots.default;
if (__VLS_ctx.open) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)(__assign(__assign(__assign(__assign({ onMousedown: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('activate');
            // @ts-ignore
            [open, emit,];
        } }, { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('area-click');
            // @ts-ignore
            [emit,];
        } }), { onContextmenu: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('open-menu', $event);
            // @ts-ignore
            [emit,];
        } }), { class: "bottom-recipe" }), { ref: (__VLS_ctx.setRootRef) }));
    /** @type {__VLS_StyleScopedClasses['bottom-recipe']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "legacy-window" }));
    /** @type {__VLS_StyleScopedClasses['legacy-window']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "legacy-top" }));
    /** @type {__VLS_StyleScopedClasses['legacy-top']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "legacy-titlebar" }));
    /** @type {__VLS_StyleScopedClasses['legacy-titlebar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "title-wrap" }));
    /** @type {__VLS_StyleScopedClasses['title-wrap']} */ ;
    if (__VLS_ctx.computedTitlePrefix) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "legacy-title" }));
        /** @type {__VLS_StyleScopedClasses['legacy-title']} */ ;
        (__VLS_ctx.computedTitlePrefix);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "legacy-title-main" }));
    /** @type {__VLS_StyleScopedClasses['legacy-title-main']} */ ;
    (__VLS_ctx.titleBase);
    if (__VLS_ctx.emphasizeText) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "title-for" }));
        /** @type {__VLS_StyleScopedClasses['title-for']} */ ;
    }
    if (__VLS_ctx.emphasizeText) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)(__assign({ class: "title-emphasis" }));
        /** @type {__VLS_StyleScopedClasses['title-emphasis']} */ ;
        (__VLS_ctx.emphasizeText);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)(__assign(__assign(__assign(__assign(__assign({ onInput: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('update:findModel', $event.target.value);
            // @ts-ignore
            [emit, setRootRef, computedTitlePrefix, computedTitlePrefix, titleBase, emphasizeText, emphasizeText, emphasizeText,];
        } }, { onKeydown: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('apply-find');
            // @ts-ignore
            [emit,];
        } }), { onFocus: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('activate');
            // @ts-ignore
            [emit,];
        } }), { class: "win-input find-input" }), { class: (__VLS_ctx.findClass) }), { value: (__VLS_ctx.findModel), placeholder: "예: RECIPE13" }));
    /** @type {__VLS_StyleScopedClasses['win-input']} */ ;
    /** @type {__VLS_StyleScopedClasses['find-input']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('apply-find');
            // @ts-ignore
            [emit, findClass, findModel,];
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
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('update:listMode', 'name');
            // @ts-ignore
            [emit,];
        } }, { class: "view-btn" }), { class: ({ active: __VLS_ctx.listMode === 'name' }) }), { type: "button", 'aria-label': "name mode", title: "Name Only" }));
    /** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('update:listMode', 'detail');
            // @ts-ignore
            [emit, listMode,];
        } }, { class: "view-btn" }), { class: ({ active: __VLS_ctx.listMode === 'detail' }) }), { type: "button", 'aria-label': "detail mode", title: "Details" }));
    /** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "spacer" }));
    /** @type {__VLS_StyleScopedClasses['spacer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "okhide" }));
    /** @type {__VLS_StyleScopedClasses['okhide']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit, listMode,];
        } }, { class: "win-btn" }), { type: "button" }));
    /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit,];
        } }, { class: "win-btn" }), { type: "button" }));
    /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "list-head" }));
    /** @type {__VLS_StyleScopedClasses['list-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "list-head-track" }, { style: ({ transform: "translateX(".concat(-__VLS_ctx.scrollLeft, "px)") }) }));
    /** @type {__VLS_StyleScopedClasses['list-head-track']} */ ;
    for (var _i = 0, _d = __VLS_vFor((__VLS_ctx.headerCount)); _i < _d.length; _i++) {
        var idx = _d[_i][0];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ key: ("recipe-head-".concat(idx)) }, { class: "w97-col list-col-wide head-wide" }), { style: ({ width: __VLS_ctx.columnBlockWidth + 'px' }) }));
        /** @type {__VLS_StyleScopedClasses['w97-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['list-col-wide']} */ ;
        /** @type {__VLS_StyleScopedClasses['head-wide']} */ ;
        if (__VLS_ctx.listMode === 'detail') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "head-cell name-col" }, { style: ({ width: __VLS_ctx.colWidths.name + 'px' }) }));
            /** @type {__VLS_StyleScopedClasses['head-cell']} */ ;
            /** @type {__VLS_StyleScopedClasses['name-col']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "head-label" }));
            /** @type {__VLS_StyleScopedClasses['head-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ onMousedown: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.open))
                        return;
                    if (!(__VLS_ctx.listMode === 'detail'))
                        return;
                    __VLS_ctx.emit('start-resize', { colKey: 'name', event: $event });
                    // @ts-ignore
                    [emit, listMode, scrollLeft, headerCount, columnBlockWidth, colWidths,];
                } }, { class: "col-resizer" }));
            /** @type {__VLS_StyleScopedClasses['col-resizer']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "head-cell time-col" }, { style: ({ width: __VLS_ctx.colWidths.modifiedAt + 'px' }) }));
            /** @type {__VLS_StyleScopedClasses['head-cell']} */ ;
            /** @type {__VLS_StyleScopedClasses['time-col']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "head-label" }));
            /** @type {__VLS_StyleScopedClasses['head-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ onMousedown: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.open))
                        return;
                    if (!(__VLS_ctx.listMode === 'detail'))
                        return;
                    __VLS_ctx.emit('start-resize', { colKey: 'modifiedAt', event: $event });
                    // @ts-ignore
                    [emit, colWidths,];
                } }, { class: "col-resizer" }));
            /** @type {__VLS_StyleScopedClasses['col-resizer']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "head-cell name-col only-name-head" }, { style: ({ width: __VLS_ctx.colWidths.name + 'px' }) }));
            /** @type {__VLS_StyleScopedClasses['head-cell']} */ ;
            /** @type {__VLS_StyleScopedClasses['name-col']} */ ;
            /** @type {__VLS_StyleScopedClasses['only-name-head']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "head-label" }));
            /** @type {__VLS_StyleScopedClasses['head-label']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ onMousedown: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.open))
                        return;
                    if (!!(__VLS_ctx.listMode === 'detail'))
                        return;
                    __VLS_ctx.emit('start-resize', { colKey: 'name', event: $event });
                    // @ts-ignore
                    [emit, colWidths,];
                } }, { class: "col-resizer" }));
            /** @type {__VLS_StyleScopedClasses['col-resizer']} */ ;
        }
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign(__assign({ onScroll: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('body-scroll');
            // @ts-ignore
            [emit,];
        } }, { class: "recipe-scroll" }), { class: ({ compact: __VLS_ctx.listMode === 'name' }) }), { ref: (__VLS_ctx.setScrollRef) }));
    /** @type {__VLS_StyleScopedClasses['recipe-scroll']} */ ;
    /** @type {__VLS_StyleScopedClasses['compact']} */ ;
    for (var _e = 0, _f = __VLS_vFor((__VLS_ctx.recipeCols)); _e < _f.length; _e++) {
        var _g = _f[_e], col = _g[0], idx = _g[1];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ class: "recipe-col list-col-wide" }, { key: (idx) }), { style: ({ width: __VLS_ctx.columnBlockWidth + 'px' }) }));
        /** @type {__VLS_StyleScopedClasses['recipe-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['list-col-wide']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)(__assign({ class: "list-ul" }));
        /** @type {__VLS_StyleScopedClasses['list-ul']} */ ;
        var _loop_1 = function (r) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)(__assign(__assign(__assign(__assign(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.open))
                        return;
                    __VLS_ctx.emit('pick', { recipeId: r.id, event: $event });
                    // @ts-ignore
                    [emit, listMode, columnBlockWidth, setScrollRef, recipeCols,];
                } }, { onContextmenu: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.open))
                        return;
                    __VLS_ctx.emit('item-contextmenu', { recipeId: r.id, event: $event });
                    // @ts-ignore
                    [emit,];
                } }), { key: (r.id) }), { class: "list-li" }), { class: ({ active: __VLS_ctx.selectedRecipeIds.includes(r.id), 'detail-row': __VLS_ctx.listMode === 'detail' }) }), { ref: (function (el) { return __VLS_ctx.setItemRef(r.id, el); }) }));
            /** @type {__VLS_StyleScopedClasses['list-li']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
            if (__VLS_ctx.listMode === 'detail') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign(__assign({ class: "cell-name name-col" }, { style: ({ width: __VLS_ctx.colWidths.name + 'px' }) }), { title: (__VLS_ctx.displayListName(r.name)) }));
                /** @type {__VLS_StyleScopedClasses['cell-name']} */ ;
                /** @type {__VLS_StyleScopedClasses['name-col']} */ ;
                (__VLS_ctx.displayListName(r.name));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-time time-col" }, { style: ({ width: __VLS_ctx.colWidths.modifiedAt + 'px' }) }));
                /** @type {__VLS_StyleScopedClasses['cell-time']} */ ;
                /** @type {__VLS_StyleScopedClasses['time-col']} */ ;
                (r.modifiedAt || '');
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign(__assign({ class: "name-only" }, { style: ({ width: __VLS_ctx.colWidths.name + 'px' }) }), { title: (__VLS_ctx.displayListName(r.name)) }));
                /** @type {__VLS_StyleScopedClasses['name-only']} */ ;
                (__VLS_ctx.displayListName(r.name));
            }
            // @ts-ignore
            [listMode, listMode, colWidths, colWidths, colWidths, selectedRecipeIds, setItemRef, displayListName, displayListName, displayListName, displayListName,];
        };
        for (var _h = 0, _j = __VLS_vFor((col)); _h < _j.length; _h++) {
            var r = _j[_h][0];
            _loop_1(r);
        }
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.selectedRecipeSingle) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "grid-wrap" }));
        /** @type {__VLS_StyleScopedClasses['grid-wrap']} */ ;
        if (__VLS_ctx.selectedRecipeSingle.modifiedAt) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "recipe-meta" }));
            /** @type {__VLS_StyleScopedClasses['recipe-meta']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.selectedRecipeSingle.modifiedAt);
        }
        if (__VLS_ctx.displayPreviewColumns.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)(__assign({ class: "legacy-table preview-table-large" }, { class: ({
                    'jobish-table': __VLS_ctx.richRecipeKinds.includes(((_a = __VLS_ctx.selectedRecipeSingle) === null || _a === void 0 ? void 0 : _a.sourceKind) || ''),
                    'pol-preview': __VLS_ctx.isPolPreview,
                    'polcon-preview': __VLS_ctx.isPolConPreview,
                }) }));
            /** @type {__VLS_StyleScopedClasses['legacy-table']} */ ;
            /** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
            /** @type {__VLS_StyleScopedClasses['jobish-table']} */ ;
            /** @type {__VLS_StyleScopedClasses['pol-preview']} */ ;
            /** @type {__VLS_StyleScopedClasses['polcon-preview']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign({ class: "recipe-index-head" }, { style: (__VLS_ctx.previewColumnStyle('__index__')) }));
            /** @type {__VLS_StyleScopedClasses['recipe-index-head']} */ ;
            for (var _k = 0, _l = __VLS_vFor((__VLS_ctx.displayPreviewColumns)); _k < _l.length; _k++) {
                var c = _l[_k][0];
                __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign(__assign({ key: (c) }, { class: (__VLS_ctx.recipeHeaderClass(c)) }), { style: (__VLS_ctx.previewColumnStyle(c)) }));
                (c);
                // @ts-ignore
                [selectedRecipeSingle, selectedRecipeSingle, selectedRecipeSingle, selectedRecipeSingle, displayPreviewColumns, displayPreviewColumns, richRecipeKinds, isPolPreview, isPolConPreview, previewColumnStyle, previewColumnStyle, recipeHeaderClass,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
            for (var _m = 0, _o = __VLS_vFor((__VLS_ctx.selectedRecipeSingle.rows)); _m < _o.length; _m++) {
                var _p = _o[_m], row = _p[0], i = _p[1];
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (i),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "recipe-index-cell" }, { style: (__VLS_ctx.previewColumnStyle('__index__')) }));
                /** @type {__VLS_StyleScopedClasses['recipe-index-cell']} */ ;
                (i + 1);
                for (var _q = 0, _r = __VLS_vFor((__VLS_ctx.displayPreviewColumns)); _q < _r.length; _q++) {
                    var c = _r[_q][0];
                    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign(__assign({ key: (c) }, { class: (__VLS_ctx.recipeCellClass(c, (_b = row[c]) !== null && _b !== void 0 ? _b : '', row)) }), { style: (__VLS_ctx.previewColumnStyle(c)) }));
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "recipe-cell-text" }));
                    __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, __assign(__assign({}, __VLS_directiveBindingRestFields), { value: (__VLS_ctx.recipeCellHtml(c, (_c = row[c]) !== null && _c !== void 0 ? _c : '', row)) }), null, null);
                    /** @type {__VLS_StyleScopedClasses['recipe-cell-text']} */ ;
                    // @ts-ignore
                    [selectedRecipeSingle, displayPreviewColumns, previewColumnStyle, previewColumnStyle, recipeCellClass, recipeCellHtml,];
                }
                // @ts-ignore
                [];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "legacy-empty preview-empty" }));
            /** @type {__VLS_StyleScopedClasses['legacy-empty']} */ ;
            /** @type {__VLS_StyleScopedClasses['preview-empty']} */ ;
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "legacy-empty" }));
        /** @type {__VLS_StyleScopedClasses['legacy-empty']} */ ;
        if (__VLS_ctx.selectedRecipeIds.length > 1) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "recipe-bottom-pad" }));
    /** @type {__VLS_StyleScopedClasses['recipe-bottom-pad']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "page-bottom-pad" }));
    /** @type {__VLS_StyleScopedClasses['page-bottom-pad']} */ ;
}
// @ts-ignore
[selectedRecipeIds,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    props: {
        open: { type: Boolean, default: false },
        activePlaten: { type: Number, default: 1 },
        findModel: { type: String, default: '' },
        findClass: { type: String, default: '' },
        recipeCols: {
            type: Array,
            default: function () { return []; },
        },
        selectedRecipeIds: {
            type: Array,
            default: function () { return []; },
        },
        selectedRecipeSingle: {
            type: Object,
            default: null,
        },
        titleBase: { type: String, default: 'Recipe' },
        emphasizeText: { type: String, default: '' },
        editMode: { type: Boolean, default: false },
        listMode: {
            type: String,
            default: 'name',
        },
        scrollLeft: { type: Number, default: 0 },
        colWidths: {
            type: Object,
            default: function () { return ({ name: 240, modifiedAt: 120 }); },
        },
    },
});
exports.default = {};
