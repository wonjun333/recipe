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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var props = defineProps({
    open: { type: Boolean, default: false },
    findClass: { type: String, default: '' },
    hint: { type: String, default: '' },
    query: { type: String, default: '' },
    platen: { type: Number, default: 1 },
    recipeCols: {
        type: Array,
        default: function () { return []; },
    },
    previewId: { type: String, default: '' },
    previewRecipe: {
        type: Object,
        default: null,
    },
    titleBase: { type: String, default: 'Recipe' },
    emphasizeText: { type: String, default: '' },
    listMode: {
        type: String,
        default: 'name',
    },
    scrollLeft: { type: Number, default: 0 },
    colWidths: {
        type: Object,
        default: function () { return ({ name: 300, modifiedAt: 82 }); },
    },
});
var emit = defineEmits();
var richRecipeKinds = ['megasonics', 'brush1', 'brush2', 'vaporDryer'];
var headerCount = (0, vue_1.computed)(function () { return Math.max(props.recipeCols.length, 1); });
var firstPickerKind = (0, vue_1.computed)(function () {
    var _a;
    var first = props.recipeCols.flat().find(Boolean);
    return (((_a = props.previewRecipe) === null || _a === void 0 ? void 0 : _a.sourceKind) || (first === null || first === void 0 ? void 0 : first.sourceKind) || '');
});
var isPolConPicker = (0, vue_1.computed)(function () { return ['polishRecipe', 'conditionRecipe', 'exSituCondition', 'specialExSitu'].includes(String(firstPickerKind.value)); });
var isPolPreview = (0, vue_1.computed)(function () { var _a, _b, _c; return String((_c = (_b = (_a = props.previewRecipe) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.sourceType) !== null && _c !== void 0 ? _c : '') === 'pol'; });
var columnBlockWidth = (0, vue_1.computed)(function () { return ((props.listMode === 'detail' ? props.colWidths.name + props.colWidths.modifiedAt : props.colWidths.name) + 8); });
var displayPreviewColumns = (0, vue_1.computed)(function () { var _a, _b; return ((_b = (_a = props.previewRecipe) === null || _a === void 0 ? void 0 : _a.columns) !== null && _b !== void 0 ? _b : []).filter(function (c) { return c !== '#' && c !== '__ui__'; }); });
function stripKnownRecipeExt(name, sourceKind) {
    var text = String(name !== null && name !== void 0 ? name : '').trim();
    if (!text)
        return '';
    if (sourceKind === 'isrmAlgorithm' || sourceKind === 'rtpcRecipe')
        return text;
    return text.replace(/\.(br|meg|dryr|drpr|pol|con|cln)$/i, '');
}
function displayListName(name, sourceKind) {
    return stripKnownRecipeExt(name, sourceKind);
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
    var sourceKind = (_b = (_a = props.previewRecipe) === null || _a === void 0 ? void 0 : _a.sourceKind) !== null && _b !== void 0 ? _b : '';
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
function previewColumnStyle(column) {
    var _a, _b, _c, _d, _e;
    var sourceKind = (_b = (_a = props.previewRecipe) === null || _a === void 0 ? void 0 : _a.sourceKind) !== null && _b !== void 0 ? _b : '';
    var sourceType = String((_e = (_d = (_c = props.previewRecipe) === null || _c === void 0 ? void 0 : _c.meta) === null || _d === void 0 ? void 0 : _d.sourceType) !== null && _e !== void 0 ? _e : '');
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
            return { width: '10%' };
        if (column === 'Platen RPM' || column === 'Head RPM')
            return { width: '8%' };
        if (column === 'Head Sweep')
            return { width: '10%' };
        if (column.startsWith('Z') || column === 'RR State')
            return { width: '7%' };
        if (column.startsWith('L'))
            return { width: '7%' };
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
function setScrollRef(el) {
    emit('register-scroll-el', el instanceof HTMLDivElement ? el : null);
}
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['list-head']} */ ;
/** @type {__VLS_StyleScopedClasses['head-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['col-resizer']} */ ;
/** @type {__VLS_StyleScopedClasses['polcon-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['list-li']} */ ;
/** @type {__VLS_StyleScopedClasses['polcon-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['polcon-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['head-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['polcon-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['head-label']} */ ;
/** @type {__VLS_StyleScopedClasses['list-li']} */ ;
/** @type {__VLS_StyleScopedClasses['list-li']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-time']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-name']} */ ;
/** @type {__VLS_StyleScopedClasses['cell-time']} */ ;
/** @type {__VLS_StyleScopedClasses['legacy-table']} */ ;
/** @type {__VLS_StyleScopedClasses['legacy-table']} */ ;
/** @type {__VLS_StyleScopedClasses['jobish-table']} */ ;
/** @type {__VLS_StyleScopedClasses['jobish-table']} */ ;
/** @type {__VLS_StyleScopedClasses['jobish-table']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['polcon-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['pol-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['polcon-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['picker-preview-title']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
/** @type {__VLS_StyleScopedClasses['pol-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['recipe-cell-text']} */ ;
/** @type {__VLS_StyleScopedClasses['recipe-cell-text']} */ ;
/** @type {__VLS_StyleScopedClasses['recipe-check-box']} */ ;
/** @type {__VLS_StyleScopedClasses['recipe-check-box']} */ ;
if (__VLS_ctx.open) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal-overlay" }));
    /** @type {__VLS_StyleScopedClasses['w97-modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal picker" }, { class: ({ 'polcon-picker': __VLS_ctx.isPolConPicker }) }));
    /** @type {__VLS_StyleScopedClasses['w97-modal']} */ ;
    /** @type {__VLS_StyleScopedClasses['picker']} */ ;
    /** @type {__VLS_StyleScopedClasses['polcon-picker']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal-titlebar" }));
    /** @type {__VLS_StyleScopedClasses['w97-modal-titlebar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal-title" }));
    /** @type {__VLS_StyleScopedClasses['w97-modal-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "title-prefix" }));
    /** @type {__VLS_StyleScopedClasses['title-prefix']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "title-main" }));
    /** @type {__VLS_StyleScopedClasses['title-main']} */ ;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal-body" }));
    /** @type {__VLS_StyleScopedClasses['w97-modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "legacy-titlebar picker-titlebar" }));
    /** @type {__VLS_StyleScopedClasses['legacy-titlebar']} */ ;
    /** @type {__VLS_StyleScopedClasses['picker-titlebar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "legacy-title" }));
    /** @type {__VLS_StyleScopedClasses['legacy-title']} */ ;
    (__VLS_ctx.titleBase);
    if (__VLS_ctx.emphasizeText) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)(__assign({ class: "legacy-strong" }));
        /** @type {__VLS_StyleScopedClasses['legacy-strong']} */ ;
        (__VLS_ctx.emphasizeText);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)(__assign(__assign(__assign(__assign({ onInput: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('update:query', $event.target.value);
            // @ts-ignore
            [open, isPolConPicker, titleBase, titleBase, emphasizeText, emphasizeText, emphasizeText, emphasizeText, emphasizeText, emit,];
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
        } }), { class: "win-input find-input" }), { class: (__VLS_ctx.findClass) }), { value: (__VLS_ctx.query), placeholder: "Find..." }));
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
            [emit, findClass, query,];
        } }, { class: "win-btn iconbtn" }), { 'aria-label': "search" }));
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
        } }, { class: "view-btn" }), { class: ({ active: __VLS_ctx.listMode === 'name' }) }), { type: "button", title: "Name Only" }));
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
        } }, { class: "view-btn" }), { class: ({ active: __VLS_ctx.listMode === 'detail' }) }), { type: "button", title: "Details" }));
    /** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "spacer" }));
    /** @type {__VLS_StyleScopedClasses['spacer']} */ ;
    if (__VLS_ctx.hint) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-hint picker-hint" }));
        /** @type {__VLS_StyleScopedClasses['w97-hint']} */ ;
        /** @type {__VLS_StyleScopedClasses['picker-hint']} */ ;
        (__VLS_ctx.hint);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "list-head picker-list-head" }));
    /** @type {__VLS_StyleScopedClasses['list-head']} */ ;
    /** @type {__VLS_StyleScopedClasses['picker-list-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "list-head-track" }, { style: ({ transform: "translateX(".concat(-__VLS_ctx.scrollLeft, "px)") }) }));
    /** @type {__VLS_StyleScopedClasses['list-head-track']} */ ;
    for (var _i = 0, _g = __VLS_vFor((__VLS_ctx.headerCount)); _i < _g.length; _i++) {
        var idx = _g[_i][0];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ key: ("picker-head-".concat(idx)) }, { class: "w97-col list-col-wide head-wide" }), { style: ({ width: __VLS_ctx.columnBlockWidth + 'px' }) }));
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
                    [emit, listMode, listMode, hint, hint, scrollLeft, headerCount, columnBlockWidth, colWidths,];
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "picker-grid" }));
    /** @type {__VLS_StyleScopedClasses['picker-grid']} */ ;
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
        } }, { class: "recipe-scroll picker-scroll" }), { class: ({ compact: __VLS_ctx.listMode === 'name' }) }), { ref: (__VLS_ctx.setScrollRef) }));
    /** @type {__VLS_StyleScopedClasses['recipe-scroll']} */ ;
    /** @type {__VLS_StyleScopedClasses['picker-scroll']} */ ;
    /** @type {__VLS_StyleScopedClasses['compact']} */ ;
    for (var _h = 0, _j = __VLS_vFor((__VLS_ctx.recipeCols)); _h < _j.length; _h++) {
        var _k = _j[_h], col = _k[0], idx = _k[1];
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
                    __VLS_ctx.emit('item-click', r.id);
                    // @ts-ignore
                    [emit, listMode, columnBlockWidth, setScrollRef, recipeCols,];
                } }, { onDblclick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.open))
                        return;
                    __VLS_ctx.previewRecipe && __VLS_ctx.emit('select', __VLS_ctx.previewRecipe);
                    // @ts-ignore
                    [emit, previewRecipe, previewRecipe,];
                } }), { key: (r.id) }), { class: "list-li" }), { class: ({ active: r.id === __VLS_ctx.previewId, 'detail-row': __VLS_ctx.listMode === 'detail' }) }), { ref: (function (el) { return __VLS_ctx.setItemRef(r.id, el); }) }));
            /** @type {__VLS_StyleScopedClasses['list-li']} */ ;
            /** @type {__VLS_StyleScopedClasses['active']} */ ;
            /** @type {__VLS_StyleScopedClasses['detail-row']} */ ;
            if (__VLS_ctx.listMode === 'detail') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign(__assign({ class: "cell-name name-col" }, { style: ({ width: __VLS_ctx.colWidths.name + 'px' }) }), { title: (__VLS_ctx.displayListName(r.name, r.sourceKind)) }));
                /** @type {__VLS_StyleScopedClasses['cell-name']} */ ;
                /** @type {__VLS_StyleScopedClasses['name-col']} */ ;
                (__VLS_ctx.displayListName(r.name, r.sourceKind));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-time time-col" }, { style: ({ width: __VLS_ctx.colWidths.modifiedAt + 'px' }) }));
                /** @type {__VLS_StyleScopedClasses['cell-time']} */ ;
                /** @type {__VLS_StyleScopedClasses['time-col']} */ ;
                (r.modifiedAt || '');
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign(__assign({ class: "name-only" }, { style: ({ width: __VLS_ctx.colWidths.name + 'px' }) }), { title: (__VLS_ctx.displayListName(r.name, r.sourceKind)) }));
                /** @type {__VLS_StyleScopedClasses['name-only']} */ ;
                (__VLS_ctx.displayListName(r.name, r.sourceKind));
            }
            // @ts-ignore
            [listMode, listMode, colWidths, colWidths, colWidths, previewId, setItemRef, displayListName, displayListName, displayListName, displayListName,];
        };
        for (var _l = 0, _m = __VLS_vFor((col)); _l < _m.length; _l++) {
            var r = _m[_l][0];
            _loop_1(r);
        }
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "picker-preview" }));
    /** @type {__VLS_StyleScopedClasses['picker-preview']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "picker-preview-title" }));
    /** @type {__VLS_StyleScopedClasses['picker-preview-title']} */ ;
    (__VLS_ctx.displayListName((_b = (_a = __VLS_ctx.previewRecipe) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '', (_c = __VLS_ctx.previewRecipe) === null || _c === void 0 ? void 0 : _c.sourceKind));
    if (__VLS_ctx.previewRecipe && __VLS_ctx.displayPreviewColumns.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "picker-preview-tablewrap" }));
        /** @type {__VLS_StyleScopedClasses['picker-preview-tablewrap']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)(__assign({ class: "legacy-table preview-table-large" }, { class: ({
                'jobish-table': __VLS_ctx.richRecipeKinds.includes(((_d = __VLS_ctx.previewRecipe) === null || _d === void 0 ? void 0 : _d.sourceKind) || ''),
                'polcon-preview': __VLS_ctx.isPolConPicker,
                'pol-preview': __VLS_ctx.isPolPreview,
            }) }));
        /** @type {__VLS_StyleScopedClasses['legacy-table']} */ ;
        /** @type {__VLS_StyleScopedClasses['preview-table-large']} */ ;
        /** @type {__VLS_StyleScopedClasses['jobish-table']} */ ;
        /** @type {__VLS_StyleScopedClasses['polcon-preview']} */ ;
        /** @type {__VLS_StyleScopedClasses['pol-preview']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign({ class: "recipe-index-head" }, { style: (__VLS_ctx.previewColumnStyle('__index__')) }));
        /** @type {__VLS_StyleScopedClasses['recipe-index-head']} */ ;
        for (var _o = 0, _p = __VLS_vFor((__VLS_ctx.displayPreviewColumns)); _o < _p.length; _o++) {
            var c = _p[_o][0];
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign(__assign({ key: (c) }, { class: (__VLS_ctx.recipeHeaderClass(c)) }), { style: (__VLS_ctx.previewColumnStyle(c)) }));
            (c);
            // @ts-ignore
            [isPolConPicker, previewRecipe, previewRecipe, previewRecipe, previewRecipe, displayListName, displayPreviewColumns, displayPreviewColumns, richRecipeKinds, isPolPreview, previewColumnStyle, previewColumnStyle, recipeHeaderClass,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (var _q = 0, _r = __VLS_vFor((__VLS_ctx.previewRecipe.rows)); _q < _r.length; _q++) {
            var _s = _r[_q], row = _s[0], i = _s[1];
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (i),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "recipe-index-cell" }, { style: (__VLS_ctx.previewColumnStyle('__index__')) }));
            /** @type {__VLS_StyleScopedClasses['recipe-index-cell']} */ ;
            (i + 1);
            for (var _t = 0, _u = __VLS_vFor((__VLS_ctx.displayPreviewColumns)); _t < _u.length; _t++) {
                var c = _u[_t][0];
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign(__assign({ key: (c) }, { class: (__VLS_ctx.recipeCellClass(c, (_e = row[c]) !== null && _e !== void 0 ? _e : '', row)) }), { style: (__VLS_ctx.previewColumnStyle(c)) }));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "recipe-cell-text" }));
                __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, __assign(__assign({}, __VLS_directiveBindingRestFields), { value: (__VLS_ctx.recipeCellHtml(c, (_f = row[c]) !== null && _f !== void 0 ? _f : '', row)) }), null, null);
                /** @type {__VLS_StyleScopedClasses['recipe-cell-text']} */ ;
                // @ts-ignore
                [previewRecipe, displayPreviewColumns, previewColumnStyle, previewColumnStyle, recipeCellClass, recipeCellHtml,];
            }
            // @ts-ignore
            [];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "legacy-empty" }));
        /** @type {__VLS_StyleScopedClasses['legacy-empty']} */ ;
        (__VLS_ctx.previewRecipe ? 'Preview not available for this file type.' : 'Select a recipe.');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "w97-modal-actions" }));
    /** @type {__VLS_StyleScopedClasses['w97-modal-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.previewRecipe && __VLS_ctx.emit('select', __VLS_ctx.previewRecipe);
            // @ts-ignore
            [emit, previewRecipe, previewRecipe, previewRecipe,];
        } }, { class: "win-btn" }), { disabled: (!__VLS_ctx.previewRecipe) }));
    /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('close');
            // @ts-ignore
            [emit, previewRecipe,];
        } }, { class: "win-btn" }));
    /** @type {__VLS_StyleScopedClasses['win-btn']} */ ;
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    props: {
        open: { type: Boolean, default: false },
        findClass: { type: String, default: '' },
        hint: { type: String, default: '' },
        query: { type: String, default: '' },
        platen: { type: Number, default: 1 },
        recipeCols: {
            type: Array,
            default: function () { return []; },
        },
        previewId: { type: String, default: '' },
        previewRecipe: {
            type: Object,
            default: null,
        },
        titleBase: { type: String, default: 'Recipe' },
        emphasizeText: { type: String, default: '' },
        listMode: {
            type: String,
            default: 'name',
        },
        scrollLeft: { type: Number, default: 0 },
        colWidths: {
            type: Object,
            default: function () { return ({ name: 300, modifiedAt: 82 }); },
        },
    },
});
exports.default = {};
