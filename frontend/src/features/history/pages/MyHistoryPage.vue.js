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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var recipeTestApi_1 = require("../../recipe_test/api/recipeTestApi");
var filterOptions = [
    { value: 'actorName', label: '이름' },
    { value: 'actorTeam', label: '나의분임조' },
    { value: 'fromEqpId', label: 'From 설비' },
    { value: 'toEqpId', label: 'To 설비' },
    { value: 'action', label: 'Action' },
    { value: 'recipeName', label: 'Recipe Name' },
    { value: 'createdAt', label: '시간' },
];
var weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
var loading = (0, vue_1.ref)(false);
var items = (0, vue_1.ref)([]);
var filters = (0, vue_1.ref)([{ id: 1, field: 'fromEqpId', value: '', dateFrom: '', dateTo: '' }]);
var expandedRecipeKeys = (0, vue_1.ref)(new Set());
var expandedDetailKeys = (0, vue_1.ref)(new Set());
var openRangeFilterId = (0, vue_1.ref)(null);
var calendarCursor = (0, vue_1.ref)(new Date());
var filterSeq = 2;
function normalizeText(value) { return String(value !== null && value !== void 0 ? value : '').trim(); }
function lowerText(value) { return normalizeText(value).toLowerCase(); }
function labelByField(field) { var _a, _b; return (_b = (_a = filterOptions.find(function (x) { return x.value === field; })) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : field; }
function addFilter() { if (filters.value.length < 4)
    filters.value.push({ id: filterSeq++, field: 'recipeName', value: '', dateFrom: '', dateTo: '' }); }
function removeFilter(id) { filters.value = filters.value.filter(function (x) { return x.id !== id; }); if (!filters.value.length)
    filters.value = [{ id: filterSeq++, field: 'fromEqpId', value: '', dateFrom: '', dateTo: '' }]; }
function normalizeToEqp(row) { var from = normalizeText(row.fromEqpId); var to = normalizeText(row.toEqpId); return !to || to === from ? '-' : to; }
function effectiveRecipeName(row) { return normalizeText(row.recipeName) || normalizeText(row.targetName) || normalizeText(row.sourceName) || '-'; }
function toDatePart(v) { return normalizeText(v).slice(0, 10); }
function parseDetailEntry(raw) {
    var text = normalizeText(raw);
    if (!text)
        return { raw: '', chips: [] };
    var trimmed = text.replace(/\s+외\s+\d+건$/, '').trim();
    if (trimmed.includes(':') && trimmed.includes('→')) {
        var _a = trimmed.split(':', 2), lhs = _a[0], rhs = _a[1];
        var pair = rhs.split('→').map(function (s) { return normalizeText(s); }).filter(Boolean);
        return { raw: text, chips: __spreadArray([normalizeText(lhs)], pair, true) };
    }
    if (trimmed.includes('→')) {
        return { raw: text, chips: trimmed.split('→').map(function (s) { return normalizeText(s); }).filter(Boolean) };
    }
    var token = normalizeText(trimmed);
    return { raw: text, chips: token ? [token] : [] };
}
function loadHistory() {
    return __awaiter(this, void 0, void 0, function () {
        var res, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    loading.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.getHistory(3000)];
                case 2:
                    res = _a.sent();
                    items.value = Array.isArray(res.items) ? res.items : [];
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error(err_1);
                    items.value = [];
                    return [3 /*break*/, 5];
                case 4:
                    loading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
var filteredItems = (0, vue_1.computed)(function () { return items.value.filter(function (row) {
    for (var _i = 0, _a = filters.value; _i < _a.length; _i++) {
        var filter = _a[_i];
        if (filter.field === 'createdAt') {
            var day = toDatePart(row.createdAt || '');
            if (filter.dateFrom && day && day < filter.dateFrom)
                return false;
            if (filter.dateTo && day && day > filter.dateTo)
                return false;
            continue;
        }
        var q = lowerText(filter.value);
        if (!q)
            continue;
        var fieldValue = filter.field === 'recipeName' ? effectiveRecipeName(row) : filter.field === 'toEqpId' ? normalizeToEqp(row) : normalizeText(row[filter.field]);
        if (!lowerText(fieldValue).includes(q))
            return false;
    }
    return true;
}); });
var groupedItems = (0, vue_1.computed)(function () {
    var map = new Map();
    for (var _i = 0, _a = filteredItems.value; _i < _a.length; _i++) {
        var row = _a[_i];
        var actorName = normalizeText(row.actorName) || 'Unknown';
        var actorTeam = normalizeText(row.actorTeam);
        var fromEqpId = normalizeText(row.fromEqpId);
        var toEqpIdDisplay = normalizeToEqp(row);
        var action = normalizeText(row.action);
        var createdAt = normalizeText(row.createdAt);
        var key = [actorName, actorTeam, fromEqpId, toEqpIdDisplay, action, createdAt].join('||');
        var recipeName = effectiveRecipeName(row);
        var status_1 = normalizeText(row.status) || 'ok';
        var reason = normalizeText(row.reason);
        var detail = normalizeText(row.detail);
        var group = map.get(key);
        if (!group) {
            group = { key: key, actorName: actorName, actorTeam: actorTeam, fromEqpId: fromEqpId, toEqpIdDisplay: toEqpIdDisplay, action: action, createdAt: createdAt, recipeNames: [], recipeSummary: '-', hasFailure: false, failureTooltip: '', items: [], detailEntries: [], detailSummaryChips: [], detailHiddenCount: 0 };
            map.set(key, group);
        }
        if (recipeName && !group.recipeNames.includes(recipeName))
            group.recipeNames.push(recipeName);
        group.items.push({ displayName: recipeName, status: status_1, reason: reason, detail: detail });
        if (detail) {
            for (var _b = 0, _c = detail.split(';').map(function (s) { return normalizeText(s); }).filter(Boolean); _b < _c.length; _b++) {
                var part = _c[_b];
                group.detailEntries.push(parseDetailEntry(part));
            }
        }
        if (status_1 !== 'ok')
            group.hasFailure = true;
    }
    var out = Array.from(map.values()).map(function (group) {
        var failures = group.items.filter(function (x) { return x.status !== 'ok' && x.reason; }).map(function (x) { return x.reason; });
        group.failureTooltip = failures.length ? failures.join('\n') : '일부 작업이 실패했습니다.';
        group.recipeSummary = group.recipeNames.length <= 1 ? (group.recipeNames[0] || '-') : "".concat(group.recipeNames[0], " \uC678 ").concat(group.recipeNames.length - 1, "\uAC74");
        var first = group.detailEntries[0] || { chips: [], raw: '' };
        group.detailSummaryChips = first.chips.slice(0, 3);
        group.detailHiddenCount = Math.max(0, group.detailEntries.length - 1);
        return group;
    });
    out.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    return out;
});
function countByAction(action) { return groupedItems.value.filter(function (x) { return x.action === action; }).length; }
function actionClass(action) { var key = normalizeText(action).toLowerCase(); return { rename: key === 'rename', saveas: key === 'save as', edit: key === 'edit', delete: key === 'delete', transfer: key === 'transfer' }; }
function isExpanded(key, kind) { return (kind === 'recipe' ? expandedRecipeKeys.value : expandedDetailKeys.value).has(key); }
function toggleExpand(key, kind) { var set = kind === 'recipe' ? expandedRecipeKeys.value : expandedDetailKeys.value; set.has(key) ? set.delete(key) : set.add(key); if (kind === 'recipe')
    expandedRecipeKeys.value = new Set(set);
else
    expandedDetailKeys.value = new Set(set); }
function rangeLabel(filter) { return filter.dateFrom || filter.dateTo ? "".concat(filter.dateFrom || '시작', " ~ ").concat(filter.dateTo || '끝') : '날짜 범위 선택'; }
function toggleRangePicker(id) { openRangeFilterId.value = openRangeFilterId.value === id ? null : id; }
function moveMonth(delta) { var next = new Date(calendarCursor.value); next.setMonth(next.getMonth() + delta); calendarCursor.value = next; }
var rangeMonthLabel = (0, vue_1.computed)(function () { return "".concat(calendarCursor.value.getFullYear(), "-").concat(String(calendarCursor.value.getMonth() + 1).padStart(2, '0')); });
var calendarDays = (0, vue_1.computed)(function () {
    var first = new Date(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth(), 1);
    var last = new Date(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth() + 1, 0);
    var days = [];
    for (var i = 0; i < first.getDay(); i++)
        days.push({ key: "b-".concat(i), label: '', date: '', classes: 'blank' });
    for (var d = 1; d <= last.getDate(); d++) {
        var dt = new Date(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth(), d);
        var iso = dt.toISOString().slice(0, 10);
        var activeFilter = filters.value.find(function (f) { return f.id === openRangeFilterId.value; });
        var from = (activeFilter === null || activeFilter === void 0 ? void 0 : activeFilter.dateFrom) || '';
        var to = (activeFilter === null || activeFilter === void 0 ? void 0 : activeFilter.dateTo) || '';
        var inRange = from && to && iso >= from && iso <= to;
        var isEdge = iso === from || iso === to;
        days.push({ key: iso, label: String(d), date: iso, classes: "".concat(inRange ? 'in-range' : '', " ").concat(isEdge ? 'edge' : '').trim() });
    }
    return days;
});
function pickRangeDate(filter, iso) {
    if (!filter.dateFrom || (filter.dateFrom && filter.dateTo)) {
        filter.dateFrom = iso;
        filter.dateTo = '';
        return;
    }
    if (iso < filter.dateFrom) {
        filter.dateTo = filter.dateFrom;
        filter.dateFrom = iso;
    }
    else {
        filter.dateTo = iso;
    }
}
function clearRange(filter) { filter.dateFrom = ''; filter.dateTo = ''; }
function onWindowClick(ev) { var target = ev.target; if (!(target === null || target === void 0 ? void 0 : target.closest('.range-popover')) && !(target === null || target === void 0 ? void 0 : target.closest('.range-input')))
    openRangeFilterId.value = null; }
(0, vue_1.onMounted)(function () { loadHistory(); window.addEventListener('click', onWindowClick); });
(0, vue_1.onBeforeUnmount)(function () { return window.removeEventListener('click', onWindowClick); });
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-row']} */ ;
/** @type {__VLS_StyleScopedClasses['weekday-row']} */ ;
/** @type {__VLS_StyleScopedClasses['weekday-row']} */ ;
/** @type {__VLS_StyleScopedClasses['day-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['day-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['day-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['day-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['action-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['action-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['action-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['action-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['action-chip']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)(__assign({ class: "history-page" }));
/** @type {__VLS_StyleScopedClasses['history-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)(__assign({ class: "history-header" }));
/** @type {__VLS_StyleScopedClasses['history-header']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "history-header-main" }));
/** @type {__VLS_StyleScopedClasses['history-header-main']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "history-header-side" }));
/** @type {__VLS_StyleScopedClasses['history-header-side']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)(__assign({ class: "history-card filter-card" }));
/** @type {__VLS_StyleScopedClasses['history-card']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-card']} */ ;
var _loop_1 = function (filter, idx) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (filter.id) }, { class: "filter-row" }));
    /** @type {__VLS_StyleScopedClasses['filter-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)(__assign({ value: (filter.field) }, { class: "field-input select-input" }));
    /** @type {__VLS_StyleScopedClasses['field-input']} */ ;
    /** @type {__VLS_StyleScopedClasses['select-input']} */ ;
    for (var _e = 0, _f = __VLS_vFor((__VLS_ctx.filterOptions)); _e < _f.length; _e++) {
        var opt = _f[_e][0];
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: (opt.value),
            value: (opt.value),
        });
        (opt.label);
        // @ts-ignore
        [filters, filterOptions,];
    }
    if (filter.field === 'createdAt') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(filter.field === 'createdAt'))
                    return;
                __VLS_ctx.toggleRangePicker(filter.id);
                // @ts-ignore
                [toggleRangePicker,];
            } }, { class: "field-input range-input" }), { type: "button" }));
        /** @type {__VLS_StyleScopedClasses['field-input']} */ ;
        /** @type {__VLS_StyleScopedClasses['range-input']} */ ;
        (__VLS_ctx.rangeLabel(filter));
        if (__VLS_ctx.openRangeFilterId === filter.id) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "range-popover" }));
            /** @type {__VLS_StyleScopedClasses['range-popover']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "range-header" }));
            /** @type {__VLS_StyleScopedClasses['range-header']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(filter.field === 'createdAt'))
                        return;
                    if (!(__VLS_ctx.openRangeFilterId === filter.id))
                        return;
                    __VLS_ctx.moveMonth(-1);
                    // @ts-ignore
                    [rangeLabel, openRangeFilterId, moveMonth,];
                } }, { class: "mini-nav" }), { type: "button" }));
            /** @type {__VLS_StyleScopedClasses['mini-nav']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.rangeMonthLabel);
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(filter.field === 'createdAt'))
                        return;
                    if (!(__VLS_ctx.openRangeFilterId === filter.id))
                        return;
                    __VLS_ctx.moveMonth(1);
                    // @ts-ignore
                    [moveMonth, rangeMonthLabel,];
                } }, { class: "mini-nav" }), { type: "button" }));
            /** @type {__VLS_StyleScopedClasses['mini-nav']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "weekday-row" }));
            /** @type {__VLS_StyleScopedClasses['weekday-row']} */ ;
            for (var _g = 0, _h = __VLS_vFor((__VLS_ctx.weekdays)); _g < _h.length; _g++) {
                var day = _h[_g][0];
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    key: (day),
                });
                (day);
                // @ts-ignore
                [weekdays,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "calendar-grid" }));
            /** @type {__VLS_StyleScopedClasses['calendar-grid']} */ ;
            var _loop_3 = function (day) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign(__assign(__assign({ onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(filter.field === 'createdAt'))
                            return;
                        if (!(__VLS_ctx.openRangeFilterId === filter.id))
                            return;
                        __VLS_ctx.pickRangeDate(filter, day.date);
                        // @ts-ignore
                        [calendarDays, pickRangeDate,];
                    } }, { key: (day.key) }), { class: "day-cell" }), { class: (day.classes) }), { type: "button", disabled: (!day.date) }));
                /** @type {__VLS_StyleScopedClasses['day-cell']} */ ;
                (day.label);
                // @ts-ignore
                [];
            };
            for (var _j = 0, _k = __VLS_vFor((__VLS_ctx.calendarDays)); _j < _k.length; _j++) {
                var day = _k[_j][0];
                _loop_3(day);
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "range-actions" }));
            /** @type {__VLS_StyleScopedClasses['range-actions']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(filter.field === 'createdAt'))
                        return;
                    if (!(__VLS_ctx.openRangeFilterId === filter.id))
                        return;
                    __VLS_ctx.clearRange(filter);
                    // @ts-ignore
                    [clearRange,];
                } }, { class: "mini-btn" }), { type: "button" }));
            /** @type {__VLS_StyleScopedClasses['mini-btn']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(filter.field === 'createdAt'))
                        return;
                    if (!(__VLS_ctx.openRangeFilterId === filter.id))
                        return;
                    __VLS_ctx.openRangeFilterId = null;
                    // @ts-ignore
                    [openRangeFilterId,];
                } }, { class: "mini-btn" }), { type: "button" }));
            /** @type {__VLS_StyleScopedClasses['mini-btn']} */ ;
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)(__assign(__assign({ value: (filter.value) }, { class: "field-input text-input" }), { type: "text", placeholder: ("".concat(__VLS_ctx.labelByField(filter.field), " \uAC80\uC0C9")) }));
        /** @type {__VLS_StyleScopedClasses['field-input']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-input']} */ ;
    }
    if (__VLS_ctx.filters.length > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.filters.length > 1))
                    return;
                __VLS_ctx.removeFilter(filter.id);
                // @ts-ignore
                [filters, labelByField, removeFilter,];
            } }, { class: "mini-btn" }), { type: "button" }));
        /** @type {__VLS_StyleScopedClasses['mini-btn']} */ ;
    }
    if (idx === __VLS_ctx.filters.length - 1 && __VLS_ctx.filters.length < 4) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: (__VLS_ctx.addFilter) }, { class: "mini-btn" }), { type: "button" }));
        /** @type {__VLS_StyleScopedClasses['mini-btn']} */ ;
    }
    // @ts-ignore
    [filters, filters, addFilter,];
};
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.filters)); _i < _a.length; _i++) {
    var _b = _a[_i], filter = _b[0], idx = _b[1];
    _loop_1(filter, idx);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "history-actions" }));
/** @type {__VLS_StyleScopedClasses['history-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: (__VLS_ctx.loadHistory) }, { class: "refresh-btn" }), { type: "button" }));
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)(__assign({ class: "history-card stats-row" }));
/** @type {__VLS_StyleScopedClasses['history-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "stat-box" }));
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "stat-label" }));
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.groupedItems.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "stat-box" }));
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "stat-label" }));
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.countByAction('Rename'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "stat-box" }));
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "stat-label" }));
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.countByAction('Save As'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "stat-box" }));
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "stat-label" }));
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.countByAction('Edit'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "stat-box" }));
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "stat-label" }));
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.countByAction('Delete'));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "stat-box" }));
/** @type {__VLS_StyleScopedClasses['stat-box']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "stat-label" }));
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.countByAction('Transfer'));
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)(__assign({ class: "history-card history-table-wrap" }));
/** @type {__VLS_StyleScopedClasses['history-card']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table-wrap']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)(__assign({ class: "history-table" }));
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ colspan: "8" }, { class: "empty-row" }));
    /** @type {__VLS_StyleScopedClasses['empty-row']} */ ;
}
else if (__VLS_ctx.groupedItems.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ colspan: "8" }, { class: "empty-row" }));
    /** @type {__VLS_StyleScopedClasses['empty-row']} */ ;
}
var _loop_2 = function (group) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)(__assign({ key: (group.key) }, { class: "group-row" }));
    /** @type {__VLS_StyleScopedClasses['group-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (group.actorName || 'Unknown');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (group.actorTeam || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (group.fromEqpId || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "action-chip" }, { class: (__VLS_ctx.actionClass(group.action)) }));
    /** @type {__VLS_StyleScopedClasses['action-chip']} */ ;
    (group.action || '-');
    if (group.hasFailure) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "warn-icon" }, { title: (group.failureTooltip) }));
        /** @type {__VLS_StyleScopedClasses['warn-icon']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (group.toEqpIdDisplay);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (group.createdAt || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "recipe-name-td" }));
    /** @type {__VLS_StyleScopedClasses['recipe-name-td']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "recipe-name-cell" }));
    /** @type {__VLS_StyleScopedClasses['recipe-name-cell']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "recipe-summary" }));
    /** @type {__VLS_StyleScopedClasses['recipe-summary']} */ ;
    (group.recipeSummary);
    if (group.recipeNames.length > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "detail-anchor" }));
        /** @type {__VLS_StyleScopedClasses['detail-anchor']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(group.recipeNames.length > 1))
                    return;
                __VLS_ctx.toggleExpand(group.key, 'recipe');
                // @ts-ignore
                [loadHistory, groupedItems, groupedItems, groupedItems, countByAction, countByAction, countByAction, countByAction, countByAction, loading, actionClass, toggleExpand,];
            } }, { class: "expand-btn" }), { type: "button" }));
        /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
        (__VLS_ctx.isExpanded(group.key, 'recipe') ? '▲' : '▼');
        if (__VLS_ctx.isExpanded(group.key, 'recipe')) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "detail-popover recipe-popover" }));
            /** @type {__VLS_StyleScopedClasses['detail-popover']} */ ;
            /** @type {__VLS_StyleScopedClasses['recipe-popover']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)(__assign({ class: "detail-list" }));
            /** @type {__VLS_StyleScopedClasses['detail-list']} */ ;
            for (var _l = 0, _m = __VLS_vFor((group.items)); _l < _m.length; _l++) {
                var _o = _m[_l], item = _o[0], idx = _o[1];
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: ("".concat(group.key, "-recipe-").concat(idx)),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "detail-name" }));
                /** @type {__VLS_StyleScopedClasses['detail-name']} */ ;
                (item.displayName);
                if (item.status !== 'ok') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "detail-fail" }, { title: (item.reason || '실패') }));
                    /** @type {__VLS_StyleScopedClasses['detail-fail']} */ ;
                    (item.reason || '실패');
                }
                // @ts-ignore
                [isExpanded, isExpanded,];
            }
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "detail-td" }));
    /** @type {__VLS_StyleScopedClasses['detail-td']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "detail-summary-row" }));
    /** @type {__VLS_StyleScopedClasses['detail-summary-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "detail-chip-row" }));
    /** @type {__VLS_StyleScopedClasses['detail-chip-row']} */ ;
    for (var _p = 0, _q = __VLS_vFor((group.detailSummaryChips)); _p < _q.length; _p++) {
        var _r = _q[_p], chip = _r[0], idx = _r[1];
        __VLS_asFunctionalElement(__VLS_intrinsics.template)({
            key: ("".concat(group.key, "-chip-").concat(idx)),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "detail-chip" }));
        /** @type {__VLS_StyleScopedClasses['detail-chip']} */ ;
        (chip);
        if (idx < group.detailSummaryChips.length - 1) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "detail-relation" }));
            /** @type {__VLS_StyleScopedClasses['detail-relation']} */ ;
        }
        // @ts-ignore
        [];
    }
    if (group.detailHiddenCount > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "detail-more" }));
        /** @type {__VLS_StyleScopedClasses['detail-more']} */ ;
        (group.detailHiddenCount);
    }
    if (group.detailEntries.length > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "detail-anchor" }));
        /** @type {__VLS_StyleScopedClasses['detail-anchor']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)(__assign(__assign({ onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(group.detailEntries.length > 1))
                    return;
                __VLS_ctx.toggleExpand(group.key, 'detail');
                // @ts-ignore
                [toggleExpand,];
            } }, { class: "expand-btn" }), { type: "button" }));
        /** @type {__VLS_StyleScopedClasses['expand-btn']} */ ;
        (__VLS_ctx.isExpanded(group.key, 'detail') ? '▽' : '▼');
        if (__VLS_ctx.isExpanded(group.key, 'detail')) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "detail-popover detail-overlay" }));
            /** @type {__VLS_StyleScopedClasses['detail-popover']} */ ;
            /** @type {__VLS_StyleScopedClasses['detail-overlay']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "detail-groups" }));
            /** @type {__VLS_StyleScopedClasses['detail-groups']} */ ;
            for (var _s = 0, _t = __VLS_vFor((group.detailEntries)); _s < _t.length; _s++) {
                var _u = _t[_s], entry = _u[0], idx = _u[1];
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: ("".concat(group.key, "-detail-").concat(idx)) }, { class: "detail-group" }));
                /** @type {__VLS_StyleScopedClasses['detail-group']} */ ;
                for (var _v = 0, _w = __VLS_vFor((entry.chips)); _v < _w.length; _v++) {
                    var _x = _w[_v], chip = _x[0], cidx = _x[1];
                    __VLS_asFunctionalElement(__VLS_intrinsics.template)({
                        key: ("".concat(group.key, "-detail-").concat(idx, "-").concat(cidx)),
                    });
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "detail-chip" }));
                    /** @type {__VLS_StyleScopedClasses['detail-chip']} */ ;
                    (chip);
                    if (cidx < entry.chips.length - 1) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "detail-relation" }));
                        /** @type {__VLS_StyleScopedClasses['detail-relation']} */ ;
                    }
                    // @ts-ignore
                    [isExpanded, isExpanded,];
                }
                // @ts-ignore
                [];
            }
        }
    }
    // @ts-ignore
    [];
};
for (var _c = 0, _d = __VLS_vFor((__VLS_ctx.groupedItems)); _c < _d.length; _c++) {
    var group = _d[_c][0];
    _loop_2(group);
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
