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
var vue_1 = require("vue");
var props = defineProps({
    open: { type: Boolean, default: false },
    items: { type: Array, default: function () { return []; } },
    targetOptions: { type: Array, default: function () { return []; } },
    selectedTargetEqpIds: { type: Array, default: function () { return []; } },
    moving: { type: Boolean, default: false },
    cartMaker: { type: String, default: '' },
    cartModelGroup: { type: String, default: '' },
});
var emit = defineEmits();
var sections = (0, vue_1.computed)(function () { return [
    { kind: 'cas', label: 'Cas', items: props.items.filter(function (x) { return x.kind === 'cas'; }) },
    { kind: 'job', label: 'Job', items: props.items.filter(function (x) { return x.kind === 'job'; }) },
    { kind: 'recipe', label: 'Recipe', items: props.items.filter(function (x) { return x.kind === 'recipe'; }) },
]; });
var totalCount = (0, vue_1.computed)(function () { return props.items.length; });
var lineOptions = (0, vue_1.computed)(function () { return Array.from(new Set(props.targetOptions.map(function (x) { return x.line; }).filter(Boolean))).sort(); });
var wideLayout = (0, vue_1.computed)(function () { return sections.value.some(function (section) { return section.items.length > 5; }) || rows.value.length > 5; });
var rows = (0, vue_1.ref)([]);
var rowUid = 1;
var normalizedSelectedTargetEqpIds = (0, vue_1.computed)(function () { return Array.from(new Set(rows.value.map(function (r) { return r.eqpId; }).filter(Boolean))); });
function makeEmptyRow() {
    return { uid: rowUid++, line: '', team: '', eqpId: '' };
}
function syncRowsFromProps() {
    var next = props.selectedTargetEqpIds
        .map(function (id) { return props.targetOptions.find(function (x) { return x.eqpId === id; }); })
        .filter(function (x) { return !!x; })
        .map(function (opt) { return ({ uid: rowUid++, line: opt.line || '', team: opt.team || '', eqpId: opt.eqpId }); });
    rows.value = next.length ? next : [makeEmptyRow()];
}
(0, vue_1.watch)([function () { return props.selectedTargetEqpIds.join('|'); }, function () { return props.targetOptions.length; }, function () { return props.open; }], function () { syncRowsFromProps(); }, { immediate: true });
function emitTargets() {
    emit('set-target-eqp-ids', normalizedSelectedTargetEqpIds.value);
}
function teamOptionsForRow(row) {
    var items = props.targetOptions.filter(function (x) { return !row.line || x.line === row.line; });
    return Array.from(new Set(items.map(function (x) { return x.team; }).filter(Boolean))).sort();
}
function eqpOptionsForRow(row) {
    var taken = new Set(rows.value.filter(function (r) { return r.uid !== row.uid; }).map(function (r) { return r.eqpId; }).filter(Boolean));
    return props.targetOptions
        .filter(function (x) { return !row.line || x.line === row.line; })
        .filter(function (x) { return !row.team || x.team === row.team; })
        .filter(function (x) { return !taken.has(x.eqpId) || x.eqpId === row.eqpId; })
        .sort(function (a, b) { return a.eqpId.localeCompare(b.eqpId, ['ko-KR', 'en-US'], { numeric: true, sensitivity: 'base' }); });
}
function onLineChange(uid, value) {
    var row = rows.value.find(function (r) { return r.uid === uid; });
    if (!row)
        return;
    row.line = value;
    if (row.team && !teamOptionsForRow(row).includes(row.team))
        row.team = '';
    if (row.eqpId && !eqpOptionsForRow(row).some(function (x) { return x.eqpId === row.eqpId; }))
        row.eqpId = '';
    emitTargets();
}
function onTeamChange(uid, value) {
    var row = rows.value.find(function (r) { return r.uid === uid; });
    if (!row)
        return;
    row.team = value;
    if (row.team && !row.line) {
        var matched = props.targetOptions.find(function (x) { return x.team === row.team; });
        if (matched === null || matched === void 0 ? void 0 : matched.line)
            row.line = matched.line;
    }
    if (row.eqpId && !eqpOptionsForRow(row).some(function (x) { return x.eqpId === row.eqpId; }))
        row.eqpId = '';
    emitTargets();
}
function onEqpChange(uid, value) {
    var row = rows.value.find(function (r) { return r.uid === uid; });
    if (!row)
        return;
    row.eqpId = value;
    var matched = props.targetOptions.find(function (x) { return x.eqpId === value; });
    if (matched) {
        row.line = matched.line || row.line;
        row.team = matched.team || row.team;
    }
    emitTargets();
}
function addRow() {
    rows.value = __spreadArray(__spreadArray([], rows.value, true), [makeEmptyRow()], false);
}
function removeRow(uid) {
    rows.value = rows.value.filter(function (r) { return r.uid !== uid; });
    if (!rows.value.length)
        rows.value = [makeEmptyRow()];
    emitTargets();
}
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['cart-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['section-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-file-name']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-file-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['x-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['target-rows']} */ ;
/** @type {__VLS_StyleScopedClasses['two-col']} */ ;
/** @type {__VLS_StyleScopedClasses['target-select']} */ ;
/** @type {__VLS_StyleScopedClasses['move-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['move-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['wide']} */ ;
/** @type {__VLS_StyleScopedClasses['section-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['two-col']} */ ;
/** @type {__VLS_StyleScopedClasses['target-rows']} */ ;
/** @type {__VLS_StyleScopedClasses['two-col']} */ ;
var __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    name: "cartDrop",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        name: "cartDrop",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = __VLS_3.slots.default;
if (__VLS_ctx.open) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)(__assign({ class: "cart-panel" }, { class: ({ wide: __VLS_ctx.wideLayout }) }));
    /** @type {__VLS_StyleScopedClasses['cart-panel']} */ ;
    /** @type {__VLS_StyleScopedClasses['wide']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cart-head" }));
    /** @type {__VLS_StyleScopedClasses['cart-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cart-title" }));
    /** @type {__VLS_StyleScopedClasses['cart-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cart-sub" }));
    /** @type {__VLS_StyleScopedClasses['cart-sub']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cart-meta" }));
    /** @type {__VLS_StyleScopedClasses['cart-meta']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.cartMaker || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.cartModelGroup || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cart-sections" }));
    /** @type {__VLS_StyleScopedClasses['cart-sections']} */ ;
    for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.sections)); _i < _a.length; _i++) {
        var section = _a[_i][0];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cart-section" }, { key: (section.kind) }));
        /** @type {__VLS_StyleScopedClasses['cart-section']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "section-head" }));
        /** @type {__VLS_StyleScopedClasses['section-head']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "section-title" }));
        /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
        (section.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "count" }));
        /** @type {__VLS_StyleScopedClasses['count']} */ ;
        (section.items.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "section-columns" }));
        /** @type {__VLS_StyleScopedClasses['section-columns']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "section-grid" }, { class: ({ 'two-col': section.items.length > 5 }) }));
        /** @type {__VLS_StyleScopedClasses['section-grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['two-col']} */ ;
        if (!section.items.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "empty-card" }));
            /** @type {__VLS_StyleScopedClasses['empty-card']} */ ;
        }
        var _loop_1 = function (item) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (item.key) }, { class: "cart-row-card" }));
            /** @type {__VLS_StyleScopedClasses['cart-row-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.open))
                        return;
                    __VLS_ctx.emit('remove-item', item.key);
                    // @ts-ignore
                    [open, wideLayout, cartMaker, cartModelGroup, sections, emit,];
                } }, { class: "x-btn" }), { type: "button", 'aria-label': "remove" }));
            /** @type {__VLS_StyleScopedClasses['x-btn']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cart-file-name" }, { title: (item.name) }));
            /** @type {__VLS_StyleScopedClasses['cart-file-name']} */ ;
            (item.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cart-file-meta" }));
            /** @type {__VLS_StyleScopedClasses['cart-file-meta']} */ ;
            (item.sourceEqpId);
            // @ts-ignore
            [];
        };
        for (var _b = 0, _c = __VLS_vFor((section.items)); _b < _c.length; _b++) {
            var item = _c[_b][0];
            _loop_1(item);
        }
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "target-wrap" }));
    /** @type {__VLS_StyleScopedClasses['target-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "target-head" }));
    /** @type {__VLS_StyleScopedClasses['target-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "target-title" }));
    /** @type {__VLS_StyleScopedClasses['target-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: (__VLS_ctx.addRow) }, { class: "mini-btn add-btn" }), { type: "button" }));
    /** @type {__VLS_StyleScopedClasses['mini-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['add-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "target-rows" }, { class: ({ 'two-col': __VLS_ctx.rows.length > 5 }) }));
    /** @type {__VLS_StyleScopedClasses['target-rows']} */ ;
    /** @type {__VLS_StyleScopedClasses['two-col']} */ ;
    var _loop_2 = function (row) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (row.uid) }, { class: "target-row" }));
        /** @type {__VLS_StyleScopedClasses['target-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)(__assign(__assign({ onChange: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.open))
                    return;
                __VLS_ctx.onLineChange(row.uid, $event.target.value);
                // @ts-ignore
                [addRow, rows, rows, onLineChange,];
            } }, { class: "target-select" }), { value: (row.line) }));
        /** @type {__VLS_StyleScopedClasses['target-select']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        for (var _f = 0, _g = __VLS_vFor((__VLS_ctx.lineOptions)); _f < _g.length; _f++) {
            var v = _g[_f][0];
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: ("line-".concat(row.uid, "-").concat(v)),
                value: (v),
            });
            (v);
            // @ts-ignore
            [lineOptions,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)(__assign(__assign({ onChange: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.open))
                    return;
                __VLS_ctx.onTeamChange(row.uid, $event.target.value);
                // @ts-ignore
                [onTeamChange,];
            } }, { class: "target-select" }), { value: (row.team) }));
        /** @type {__VLS_StyleScopedClasses['target-select']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        for (var _h = 0, _j = __VLS_vFor((__VLS_ctx.teamOptionsForRow(row))); _h < _j.length; _h++) {
            var v = _j[_h][0];
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: ("team-".concat(row.uid, "-").concat(v)),
                value: (v),
            });
            (v);
            // @ts-ignore
            [teamOptionsForRow,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)(__assign(__assign({ onChange: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.open))
                    return;
                __VLS_ctx.onEqpChange(row.uid, $event.target.value);
                // @ts-ignore
                [onEqpChange,];
            } }, { class: "target-select eqp-select" }), { value: (row.eqpId) }));
        /** @type {__VLS_StyleScopedClasses['target-select']} */ ;
        /** @type {__VLS_StyleScopedClasses['eqp-select']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            value: "",
        });
        for (var _k = 0, _l = __VLS_vFor((__VLS_ctx.eqpOptionsForRow(row))); _k < _l.length; _k++) {
            var opt = _l[_k][0];
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                key: ("eqp-".concat(row.uid, "-").concat(opt.eqpId)),
                value: (opt.eqpId),
            });
            (opt.eqpId);
            // @ts-ignore
            [eqpOptionsForRow,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.open))
                    return;
                __VLS_ctx.removeRow(row.uid);
                // @ts-ignore
                [removeRow,];
            } }, { class: "mini-btn remove-btn" }), { type: "button" }));
        /** @type {__VLS_StyleScopedClasses['mini-btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['remove-btn']} */ ;
        // @ts-ignore
        [];
    };
    for (var _d = 0, _e = __VLS_vFor((__VLS_ctx.rows)); _d < _e.length; _d++) {
        var row = _e[_d][0];
        _loop_2(row);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cart-actions" }));
    /** @type {__VLS_StyleScopedClasses['cart-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('clear');
            // @ts-ignore
            [emit,];
        } }, { class: "clear-btn" }), { type: "button" }));
    /** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            if (!(__VLS_ctx.open))
                return;
            __VLS_ctx.emit('move');
            // @ts-ignore
            [emit,];
        } }, { class: "move-btn" }), { type: "button", disabled: (__VLS_ctx.moving || !__VLS_ctx.totalCount || !__VLS_ctx.normalizedSelectedTargetEqpIds.length) }));
    /** @type {__VLS_StyleScopedClasses['move-btn']} */ ;
    (__VLS_ctx.moving ? 'Moving...' : 'Move Selected Files');
}
// @ts-ignore
[moving, moving, totalCount, normalizedSelectedTargetEqpIds,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    props: {
        open: { type: Boolean, default: false },
        items: { type: Array, default: function () { return []; } },
        targetOptions: { type: Array, default: function () { return []; } },
        selectedTargetEqpIds: { type: Array, default: function () { return []; } },
        moving: { type: Boolean, default: false },
        cartMaker: { type: String, default: '' },
        cartModelGroup: { type: String, default: '' },
    },
});
exports.default = {};
