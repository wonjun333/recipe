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
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
var props = withDefaults(defineProps(), {
    editable: false,
    noneLabel: '(None)',
    missingRecipeMap: function () { return ({}); },
});
var emit = defineEmits();
function isSelectableRecipeValue(value) {
    var v = String(value || '').trim();
    return v !== '' && v !== props.noneLabel;
}
function headMark(flag) {
    return flag ? '✔' : '□';
}
function jobMissingKey() {
    var parts = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parts[_i] = arguments[_i];
    }
    return parts.map(function (x) { return String(x); }).join('::');
}
function isMissingRecipe() {
    var _a, _b;
    var parts = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parts[_i] = arguments[_i];
    }
    if (parts.length === 1 && String(parts[0]).includes('::'))
        return !!((_a = props.missingRecipeMap) === null || _a === void 0 ? void 0 : _a[String(parts[0])]);
    return !!((_b = props.missingRecipeMap) === null || _b === void 0 ? void 0 : _b[jobMissingKey.apply(void 0, parts)]);
}
function jobValueCellClass(value, platen, rowLabel, missingKey) {
    return {
        clickable: !(missingKey && isMissingRecipe(missingKey)) && (props.editable || isSelectableRecipeValue(value)),
        'platen2-col': platen === 2,
        'non-polish-cell': rowLabel !== 'Polish Recipe',
        'missing-ref': !!(missingKey && isMissingRecipe(missingKey)),
    };
}
function normalizeModuleText(value) {
    return String(value || '').trim().toLowerCase().replace(/[_\-]+/g, ' ');
}
function cleanerModuleLabel(row, idx) {
    var _a;
    var displayText = normalizeModuleText(row.index);
    var moduleText = normalizeModuleText(row.module);
    var merged = "".concat(displayText, " ").concat(moduleText).trim();
    if (merged.includes('cleaner input') || merged.includes('cin'))
        return 'Cleaner Input';
    if (merged.includes('mega'))
        return 'Megasonics';
    if (merged.includes('brush 1') || merged.includes('brush1') || merged.includes('br1'))
        return 'Brush 1';
    if (merged.includes('brush 2') || merged.includes('brush2') || merged.includes('br2'))
        return 'Brush 2';
    if (merged.includes('vapor') || merged.includes('dryer') || merged.includes('drpr'))
        return 'Vapor Dryer';
    if (merged.includes('cleaner output') || merged.includes('cout'))
        return 'Cleaner Output';
    var fallback = ['Cleaner Input', 'Megasonics', 'Brush 1', 'Brush 2', 'Vapor Dryer', 'Cleaner Output'];
    return (_a = fallback[idx]) !== null && _a !== void 0 ? _a : (row.index || row.module || 'Cleaner');
}
function polisherSourceKind(rowLabel) {
    if (rowLabel === 'Polish Recipe')
        return 'polishRecipe';
    if (rowLabel === 'Condition Recipe')
        return 'conditionRecipe';
    if (rowLabel === 'Ex Situ Condition')
        return 'exSituCondition';
    if (rowLabel === 'Special Ex Situ')
        return 'specialExSitu';
    if (rowLabel === 'ISRM Algorithm')
        return 'isrmAlgorithm';
    if (rowLabel === 'RTPC Recipe')
        return 'rtpcRecipe';
    return 'recipe';
}
function cleanerSourceKind(label) {
    if (label === 'Megasonics')
        return 'megasonics';
    if (label === 'Brush 1')
        return 'brush1';
    if (label === 'Brush 2')
        return 'brush2';
    if (label === 'Vapor Dryer')
        return 'vaporDryer';
    return 'recipe';
}
function polisherTitleBase(rowLabel) {
    if (rowLabel === 'Polish Recipe')
        return 'Polish Recipe';
    if (rowLabel === 'Condition Recipe')
        return 'Condition Recipe';
    if (rowLabel === 'Ex Situ Condition')
        return 'Ex Situ Condition';
    if (rowLabel === 'Special Ex Situ')
        return 'Special Ex Situ';
    if (rowLabel === 'ISRM Algorithm')
        return 'ISRM Algorithm';
    if (rowLabel === 'RTPC Recipe')
        return 'RTPC Recipe';
    return rowLabel || 'Recipe';
}
function cleanerTitleBase(moduleLabel) {
    if (moduleLabel === 'Brush 1' || moduleLabel === 'Brush 2')
        return 'Brush Recipe';
    if (moduleLabel === 'Megasonics')
        return 'Megasonics Recipe';
    if (moduleLabel === 'Vapor Dryer')
        return 'Vapor Dryer Recipe';
    return 'Cleaner Recipe';
}
function emitRecipeClick(value, payload) {
    if (!props.editable && !isSelectableRecipeValue(value))
        return;
    var nextValue = isSelectableRecipeValue(value) ? value : props.noneLabel;
    emit('value-click', __assign({ value: nextValue }, payload));
}
function emitPolisherClick(rowLabel, value, platen) {
    emitRecipeClick(value, {
        sourceKind: polisherSourceKind(rowLabel),
        titleBase: polisherTitleBase(rowLabel),
        emphasizeText: "Platen ".concat(platen),
        platen: platen,
    });
}
function emitCleanerClick(row, idx) {
    var label = cleanerModuleLabel(row, idx);
    emitRecipeClick(row.recipe, {
        sourceKind: cleanerSourceKind(label),
        titleBase: cleanerTitleBase(label),
        emphasizeText: label,
        platen: null,
    });
}
var __VLS_defaults = {
    editable: false,
    noneLabel: '(None)',
    missingRecipeMap: function () { return ({}); },
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['recipe-box']} */ ;
/** @type {__VLS_StyleScopedClasses['recipe-box']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['job-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['job-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['job-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['use-head-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tbl-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['tight-tbl']} */ ;
/** @type {__VLS_StyleScopedClasses['tight-tbl']} */ ;
/** @type {__VLS_StyleScopedClasses['tbl']} */ ;
/** @type {__VLS_StyleScopedClasses['tbl']} */ ;
/** @type {__VLS_StyleScopedClasses['tbl']} */ ;
/** @type {__VLS_StyleScopedClasses['tbl']} */ ;
/** @type {__VLS_StyleScopedClasses['tbl']} */ ;
/** @type {__VLS_StyleScopedClasses['tbl']} */ ;
/** @type {__VLS_StyleScopedClasses['tbl']} */ ;
/** @type {__VLS_StyleScopedClasses['polished']} */ ;
/** @type {__VLS_StyleScopedClasses['cleaner-table']} */ ;
/** @type {__VLS_StyleScopedClasses['rowname']} */ ;
/** @type {__VLS_StyleScopedClasses['tbl-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['tight-tbl']} */ ;
/** @type {__VLS_StyleScopedClasses['cleaner-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['cleaner-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cleaner-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cleaner-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cleaner-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cleaner-table']} */ ;
/** @type {__VLS_StyleScopedClasses['cleaner-module-cell']} */ ;
if (__VLS_ctx.parsed) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "job-parsed" }));
    /** @type {__VLS_StyleScopedClasses['job-parsed']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bar" }));
    /** @type {__VLS_StyleScopedClasses['bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bar-left" }));
    /** @type {__VLS_StyleScopedClasses['bar-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)(__assign({ class: "checkline" }));
    /** @type {__VLS_StyleScopedClasses['checkline']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)(__assign(__assign({ onChange: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.parsed))
                return;
            __VLS_ctx.emit('toggle-flag', { section: 'preMetrology', key: 'enabled', checked: $event.target.checked });
            // @ts-ignore
            [parsed, emit,];
        } }, { class: (['job-checkbox', __VLS_ctx.editable ? 'editable' : 'readonly']) }), { type: "checkbox", checked: (__VLS_ctx.parsed.preMetrology.enabled), disabled: (!__VLS_ctx.editable) }));
    /** @type {__VLS_StyleScopedClasses['job-checkbox']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bar-right" }));
    /** @type {__VLS_StyleScopedClasses['bar-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "bar-label" }));
    /** @type {__VLS_StyleScopedClasses['bar-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onClick: function () {
            var _a;
            var _b = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _b[_i] = arguments[_i];
            }
            var $event = _b[0];
            if (!(__VLS_ctx.parsed))
                return;
            __VLS_ctx.emitRecipeClick((_a = __VLS_ctx.parsed.preMetrology.recipe) !== null && _a !== void 0 ? _a : __VLS_ctx.noneLabel, { sourceKind: 'metrologyRecipe', titleBase: 'Pre-Metrology Recipe', emphasizeText: 'Pre-Metrology' });
            // @ts-ignore
            [parsed, parsed, editable, editable, emitRecipeClick, noneLabel,];
        } }, { class: "recipe-box" }), { class: ({ disabled: !__VLS_ctx.parsed.preMetrology.enabled, clickable: __VLS_ctx.editable || __VLS_ctx.isSelectableRecipeValue(__VLS_ctx.parsed.preMetrology.recipe), 'missing-ref': __VLS_ctx.isMissingRecipe('preMetrology') }) }));
    /** @type {__VLS_StyleScopedClasses['recipe-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled']} */ ;
    /** @type {__VLS_StyleScopedClasses['clickable']} */ ;
    /** @type {__VLS_StyleScopedClasses['missing-ref']} */ ;
    (__VLS_ctx.parsed.preMetrology.recipe);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "group" }));
    /** @type {__VLS_StyleScopedClasses['group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "group-head group-head-split" }));
    /** @type {__VLS_StyleScopedClasses['group-head']} */ ;
    /** @type {__VLS_StyleScopedClasses['group-head-split']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)(__assign({ class: "checkline" }));
    /** @type {__VLS_StyleScopedClasses['checkline']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)(__assign(__assign({ onChange: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.parsed))
                return;
            __VLS_ctx.emit('toggle-flag', { section: 'polisher', key: 'route', checked: $event.target.checked });
            // @ts-ignore
            [parsed, parsed, parsed, emit, editable, isSelectableRecipeValue, isMissingRecipe,];
        } }, { class: (['job-checkbox', __VLS_ctx.editable ? 'editable' : 'readonly']) }), { type: "checkbox", checked: (__VLS_ctx.parsed.polisher.route), disabled: (!__VLS_ctx.editable) }));
    /** @type {__VLS_StyleScopedClasses['job-checkbox']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "use-heads" }));
    /** @type {__VLS_StyleScopedClasses['use-heads']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "use-heads-label" }));
    /** @type {__VLS_StyleScopedClasses['use-heads-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "use-head-item" }));
    /** @type {__VLS_StyleScopedClasses['use-head-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "mark" }));
    /** @type {__VLS_StyleScopedClasses['mark']} */ ;
    (__VLS_ctx.headMark((_a = __VLS_ctx.parsed.useHeads) === null || _a === void 0 ? void 0 : _a.head1));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "use-head-item" }));
    /** @type {__VLS_StyleScopedClasses['use-head-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "mark" }));
    /** @type {__VLS_StyleScopedClasses['mark']} */ ;
    (__VLS_ctx.headMark((_b = __VLS_ctx.parsed.useHeads) === null || _b === void 0 ? void 0 : _b.head2));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "use-head-item" }));
    /** @type {__VLS_StyleScopedClasses['use-head-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "mark" }));
    /** @type {__VLS_StyleScopedClasses['mark']} */ ;
    (__VLS_ctx.headMark((_c = __VLS_ctx.parsed.useHeads) === null || _c === void 0 ? void 0 : _c.head3));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "use-head-item" }));
    /** @type {__VLS_StyleScopedClasses['use-head-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "mark" }));
    /** @type {__VLS_StyleScopedClasses['mark']} */ ;
    (__VLS_ctx.headMark((_d = __VLS_ctx.parsed.useHeads) === null || _d === void 0 ? void 0 : _d.head4));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "hclu-row hclu-row-top" }));
    /** @type {__VLS_StyleScopedClasses['hclu-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['hclu-row-top']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "hclu-label" }));
    /** @type {__VLS_StyleScopedClasses['hclu-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onClick: function () {
            var _a, _b;
            var _c = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _c[_i] = arguments[_i];
            }
            var $event = _c[0];
            if (!(__VLS_ctx.parsed))
                return;
            __VLS_ctx.emitRecipeClick((_b = (_a = __VLS_ctx.parsed.hcluRecipes) === null || _a === void 0 ? void 0 : _a.postLoad) !== null && _b !== void 0 ? _b : __VLS_ctx.noneLabel, { sourceKind: 'hcluPostLoad', titleBase: 'HCLU Clean Recipe Post Load' });
            // @ts-ignore
            [parsed, parsed, parsed, parsed, parsed, parsed, editable, editable, emitRecipeClick, noneLabel, headMark, headMark, headMark, headMark,];
        } }, { class: "recipe-box hclu-box" }), { class: ({ clickable: (__VLS_ctx.editable || __VLS_ctx.isSelectableRecipeValue((_e = __VLS_ctx.parsed.hcluRecipes) === null || _e === void 0 ? void 0 : _e.postLoad)) && !__VLS_ctx.isMissingRecipe('hclu', 'postLoad'), 'missing-ref': __VLS_ctx.isMissingRecipe('hclu', 'postLoad') }) }));
    /** @type {__VLS_StyleScopedClasses['recipe-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['hclu-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['clickable']} */ ;
    /** @type {__VLS_StyleScopedClasses['missing-ref']} */ ;
    (((_f = __VLS_ctx.parsed.hcluRecipes) === null || _f === void 0 ? void 0 : _f.postLoad) || __VLS_ctx.noneLabel);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "tbl-wrap tight-tbl" }));
    /** @type {__VLS_StyleScopedClasses['tbl-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['tight-tbl']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)(__assign({ class: "tbl polished compact-polisher" }));
    /** @type {__VLS_StyleScopedClasses['tbl']} */ ;
    /** @type {__VLS_StyleScopedClasses['polished']} */ ;
    /** @type {__VLS_StyleScopedClasses['compact-polisher']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign({ class: "platen2-head" }));
    /** @type {__VLS_StyleScopedClasses['platen2-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign({ class: "platen2-head" }));
    /** @type {__VLS_StyleScopedClasses['platen2-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign({ class: "platen2-head" }));
    /** @type {__VLS_StyleScopedClasses['platen2-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    var _loop_1 = function (row) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (row.label),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "rowname" }));
        /** @type {__VLS_StyleScopedClasses['rowname']} */ ;
        (row.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.parsed))
                    return;
                __VLS_ctx.emitPolisherClick(row.label, row.p1, 1);
                // @ts-ignore
                [parsed, parsed, parsed, editable, noneLabel, isSelectableRecipeValue, isMissingRecipe, isMissingRecipe, emitPolisherClick,];
            } }, { class: "cell job-value-cell" }), { class: (__VLS_ctx.jobValueCellClass(row.p1, 1, row.label, __VLS_ctx.jobMissingKey('polisher', row.label, 'p1'))) }));
        /** @type {__VLS_StyleScopedClasses['cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['job-value-cell']} */ ;
        (row.p1);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.parsed))
                    return;
                __VLS_ctx.emitPolisherClick(row.label, row.p2, 2);
                // @ts-ignore
                [emitPolisherClick, jobValueCellClass, jobMissingKey,];
            } }, { class: "cell job-value-cell platen2-col" }), { class: (__VLS_ctx.jobValueCellClass(row.p2, 2, row.label, __VLS_ctx.jobMissingKey('polisher', row.label, 'p2'))) }));
        /** @type {__VLS_StyleScopedClasses['cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['job-value-cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['platen2-col']} */ ;
        (row.p2);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.parsed))
                    return;
                __VLS_ctx.emitPolisherClick(row.label, row.p3, 3);
                // @ts-ignore
                [emitPolisherClick, jobValueCellClass, jobMissingKey,];
            } }, { class: "cell job-value-cell" }), { class: (__VLS_ctx.jobValueCellClass(row.p3, 3, row.label, __VLS_ctx.jobMissingKey('polisher', row.label, 'p3'))) }));
        /** @type {__VLS_StyleScopedClasses['cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['job-value-cell']} */ ;
        (row.p3);
        // @ts-ignore
        [jobValueCellClass, jobMissingKey,];
    };
    for (var _i = 0, _j = __VLS_vFor((__VLS_ctx.parsed.polisher.rows)); _i < _j.length; _i++) {
        var row = _j[_i][0];
        _loop_1(row);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "hclu-row hclu-row-bottom" }));
    /** @type {__VLS_StyleScopedClasses['hclu-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['hclu-row-bottom']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "hclu-label" }));
    /** @type {__VLS_StyleScopedClasses['hclu-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onClick: function () {
            var _a, _b;
            var _c = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _c[_i] = arguments[_i];
            }
            var $event = _c[0];
            if (!(__VLS_ctx.parsed))
                return;
            __VLS_ctx.emitRecipeClick((_b = (_a = __VLS_ctx.parsed.hcluRecipes) === null || _a === void 0 ? void 0 : _a.preUnload) !== null && _b !== void 0 ? _b : __VLS_ctx.noneLabel, { sourceKind: 'hcluPreUnload', titleBase: 'HCLU Clean Recipe Pre Unload' });
            // @ts-ignore
            [parsed, emitRecipeClick, noneLabel,];
        } }, { class: "recipe-box hclu-box" }), { class: ({ clickable: (__VLS_ctx.editable || __VLS_ctx.isSelectableRecipeValue((_g = __VLS_ctx.parsed.hcluRecipes) === null || _g === void 0 ? void 0 : _g.preUnload)) && !__VLS_ctx.isMissingRecipe('hclu', 'preUnload'), 'missing-ref': __VLS_ctx.isMissingRecipe('hclu', 'preUnload') }) }));
    /** @type {__VLS_StyleScopedClasses['recipe-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['hclu-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['clickable']} */ ;
    /** @type {__VLS_StyleScopedClasses['missing-ref']} */ ;
    (((_h = __VLS_ctx.parsed.hcluRecipes) === null || _h === void 0 ? void 0 : _h.preUnload) || __VLS_ctx.noneLabel);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "group" }));
    /** @type {__VLS_StyleScopedClasses['group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "group-head" }));
    /** @type {__VLS_StyleScopedClasses['group-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)(__assign({ class: "checkline" }));
    /** @type {__VLS_StyleScopedClasses['checkline']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)(__assign(__assign({ onChange: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.parsed))
                return;
            __VLS_ctx.emit('toggle-flag', { section: 'cleaner', key: 'route', checked: $event.target.checked });
            // @ts-ignore
            [parsed, parsed, emit, editable, noneLabel, isSelectableRecipeValue, isMissingRecipe, isMissingRecipe,];
        } }, { class: (['job-checkbox', __VLS_ctx.editable ? 'editable' : 'readonly']) }), { type: "checkbox", checked: (__VLS_ctx.parsed.cleaner.route), disabled: (!__VLS_ctx.editable) }));
    /** @type {__VLS_StyleScopedClasses['job-checkbox']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "tbl-wrap tight-tbl cleaner-wrap" }));
    /** @type {__VLS_StyleScopedClasses['tbl-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['tight-tbl']} */ ;
    /** @type {__VLS_StyleScopedClasses['cleaner-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)(__assign({ class: "tbl small cleaner-table compact-cleaner" }));
    /** @type {__VLS_StyleScopedClasses['tbl']} */ ;
    /** @type {__VLS_StyleScopedClasses['small']} */ ;
    /** @type {__VLS_StyleScopedClasses['cleaner-table']} */ ;
    /** @type {__VLS_StyleScopedClasses['compact-cleaner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.colgroup, __VLS_intrinsics.colgroup)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.col)(__assign({ class: "cleaner-module-col" }));
    /** @type {__VLS_StyleScopedClasses['cleaner-module-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.col)(__assign({ class: "cleaner-recipe-col" }));
    /** @type {__VLS_StyleScopedClasses['cleaner-recipe-col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    var _loop_2 = function (row, idx) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: ("".concat(row.index, "-").concat(row.module, "-").concat(row.recipe)),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "cell cleaner-module-cell" }));
        /** @type {__VLS_StyleScopedClasses['cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['cleaner-module-cell']} */ ;
        (__VLS_ctx.cleanerModuleLabel(row, idx));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.parsed))
                    return;
                __VLS_ctx.emitCleanerClick(row, idx);
                // @ts-ignore
                [parsed, parsed, editable, editable, cleanerModuleLabel, emitCleanerClick,];
            } }, { class: "cell job-value-cell cleaner-recipe-cell" }), { class: (__VLS_ctx.jobValueCellClass(row.recipe, undefined, 'Cleaner', __VLS_ctx.jobMissingKey('cleaner', idx))) }));
        /** @type {__VLS_StyleScopedClasses['cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['job-value-cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['cleaner-recipe-cell']} */ ;
        (row.recipe);
        // @ts-ignore
        [jobValueCellClass, jobMissingKey,];
    };
    for (var _k = 0, _l = __VLS_vFor((__VLS_ctx.parsed.cleaner.rows)); _k < _l.length; _k++) {
        var _m = _l[_k], row = _m[0], idx = _m[1];
        _loop_2(row, idx);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bar" }));
    /** @type {__VLS_StyleScopedClasses['bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bar-left" }));
    /** @type {__VLS_StyleScopedClasses['bar-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)(__assign({ class: "checkline" }));
    /** @type {__VLS_StyleScopedClasses['checkline']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)(__assign(__assign({ onChange: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.parsed))
                return;
            __VLS_ctx.emit('toggle-flag', { section: 'postMetrology', key: 'enabled', checked: $event.target.checked });
            // @ts-ignore
            [emit,];
        } }, { class: (['job-checkbox', __VLS_ctx.editable ? 'editable' : 'readonly']) }), { type: "checkbox", checked: (__VLS_ctx.parsed.postMetrology.enabled), disabled: (!__VLS_ctx.editable) }));
    /** @type {__VLS_StyleScopedClasses['job-checkbox']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bar-right" }));
    /** @type {__VLS_StyleScopedClasses['bar-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "bar-label" }));
    /** @type {__VLS_StyleScopedClasses['bar-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onClick: function () {
            var _a;
            var _b = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _b[_i] = arguments[_i];
            }
            var $event = _b[0];
            if (!(__VLS_ctx.parsed))
                return;
            __VLS_ctx.emitRecipeClick((_a = __VLS_ctx.parsed.postMetrology.recipe) !== null && _a !== void 0 ? _a : __VLS_ctx.noneLabel, { sourceKind: 'metrologyRecipe', titleBase: 'Post-Metrology Recipe', emphasizeText: 'Post-Metrology' });
            // @ts-ignore
            [parsed, parsed, editable, editable, emitRecipeClick, noneLabel,];
        } }, { class: "recipe-box" }), { class: ({ disabled: !__VLS_ctx.parsed.postMetrology.enabled, clickable: __VLS_ctx.editable || __VLS_ctx.isSelectableRecipeValue(__VLS_ctx.parsed.postMetrology.recipe), 'missing-ref': __VLS_ctx.isMissingRecipe('postMetrology') }) }));
    /** @type {__VLS_StyleScopedClasses['recipe-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled']} */ ;
    /** @type {__VLS_StyleScopedClasses['clickable']} */ ;
    /** @type {__VLS_StyleScopedClasses['missing-ref']} */ ;
    (__VLS_ctx.parsed.postMetrology.recipe);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "job-parsed-empty" }));
    /** @type {__VLS_StyleScopedClasses['job-parsed-empty']} */ ;
}
// @ts-ignore
[parsed, parsed, parsed, editable, isSelectableRecipeValue, isMissingRecipe,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
exports.default = {};
