"use strict";
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
var recipeTestApi_1 = require("../api/recipeTestApi");
var RecipeTestHeader_vue_1 = require("../components/RecipeTestHeader.vue");
var LoadingOverlay_vue_1 = require("../components/LoadingOverlay.vue");
var CasFileListPanel_vue_1 = require("../components/CasFileListPanel.vue");
var CasContentPanel_vue_1 = require("../components/CasContentPanel.vue");
var JobFileListPanel_vue_1 = require("../components/JobFileListPanel.vue");
var JobContentPanel_vue_1 = require("../components/JobContentPanel.vue");
var RecipePanel_vue_1 = require("../components/RecipePanel.vue");
var RecipePickerDialog_vue_1 = require("../components/RecipePickerDialog.vue");
var Win97ContextMenu_vue_1 = require("../components/Win97ContextMenu.vue");
var Win97ConfirmDialog_vue_1 = require("../components/Win97ConfirmDialog.vue");
var TransferCartPanel_vue_1 = require("../components/TransferCartPanel.vue");
/** Per_Col */
var CAS_PER_COL = 25;
var JOB_PER_COL = 25;
var RECIPE_PER_COL = 8;
/** Heights */
var PANE_H = 662;
var LIST_EXTRA = 12;
var paneHeight = "".concat(PANE_H, "px");
var listPaneHeight = "".concat(PANE_H + LIST_EXTRA, "px");
/** Constants */
var NONE_LABEL = '(None)';
var NONE_RECIPE = {
    id: 'R_NONE',
    name: NONE_LABEL,
    columns: ['Info'],
    rows: [{ Info: 'No recipe selected.' }]
};
var CAS_NONE_ID = '__CAS_NONE__';
var JOB_NONE_ID = '__JOB_NONE__';
var DEFAULT_RECIPE_SOURCE = 'recipe';
var NO_PREVIEW_SOURCE_KINDS = new Set(['isrmAlgorithm', 'rtpcRecipe']);
var RECIPE_SOURCE_EXTS = {
    recipe: ['.br', '.meg', '.dryr', '.drpr', '.pol', '.con', '.alg', '.seg', '.scx', '.cln'],
    polishRecipe: ['.pol'],
    conditionRecipe: ['.con'],
    exSituCondition: ['.con'],
    specialExSitu: ['.con'],
    isrmAlgorithm: ['.alg', '.seg'],
    rtpcRecipe: ['.scx'],
    hcluPostLoad: ['.cln'],
    hcluPreUnload: ['.cln'],
    megasonics: ['.meg'],
    brush1: ['.br'],
    brush2: ['.br'],
    vaporDryer: ['.dryr', '.drpr'],
    metrologyRecipe: []
};
/** State */
var lineOptionsLocal = (0, vue_1.ref)([]);
var teamOptionsLocal = (0, vue_1.ref)([]);
var eqpOptionsLocal = (0, vue_1.ref)([]);
var eqpMasterItems = (0, vue_1.ref)([]);
var line = (0, vue_1.ref)('');
var team = (0, vue_1.ref)('');
var eqpId = (0, vue_1.ref)('');
var actorName = (0, vue_1.ref)('');
var actorNameModel = (0, vue_1.computed)({
    get: function () { return actorName.value; },
    set: function (value) {
        actorName.value = String(value || '');
        try {
            window.localStorage.setItem('recipe_test_actor_name', actorName.value);
        }
        catch (_a) { }
    }
});
var isLoading = (0, vue_1.ref)(false);
var hasLoadedFiles = (0, vue_1.ref)(false);
var loadingMessage = (0, vue_1.ref)('FTP 파일과 목록을 불러오는중...');
var casScrollLeft = (0, vue_1.ref)(0);
var jobScrollLeft = (0, vue_1.ref)(0);
var activePane = (0, vue_1.ref)('casList');
var keyboardControlMode = (0, vue_1.ref)('cas');
function activateArea(pane, mode) {
    activePane.value = pane;
    keyboardControlMode.value = mode;
}
function ensureActorName() {
    var value = String(actorName.value || '').trim();
    if (!value) {
        try {
            value = String(window.localStorage.getItem('recipe_test_actor_name') || '').trim();
        }
        catch (_a) { }
    }
    actorName.value = value;
    return value || 'Unknown';
}
function getActorName() { return ensureActorName(); }
function getActorTeam() { return String(team.value || '').trim(); }
/** Utils */
function naturalCompare(a, b) {
    if (a === NONE_LABEL && b === NONE_LABEL)
        return 0;
    if (a === NONE_LABEL)
        return -1;
    if (b === NONE_LABEL)
        return 1;
    return a.localeCompare(b, ['ko-KR', 'en-US'], { numeric: true, sensitivity: 'base', ignorePunctuation: true });
}
function stripFileExt(name, exts) {
    if (exts === void 0) { exts = []; }
    var text = String(name !== null && name !== void 0 ? name : '').trim();
    if (!text)
        return '';
    var lower = text.toLowerCase();
    for (var _i = 0, exts_1 = exts; _i < exts_1.length; _i++) {
        var ext = exts_1[_i];
        var extLower = String(ext).toLowerCase();
        if (lower.endswith(extLower))
            return text.slice(0, text.length - ext.length);
    }
    return text;
}
function displayCasName(name) {
    if (String(name !== null && name !== void 0 ? name : '').trim() === CAS_NONE_ID)
        return NONE_LABEL;
    return stripFileExt(name, ['.cas']);
}
function displayJobName(name) {
    if (String(name !== null && name !== void 0 ? name : '').trim() === JOB_NONE_ID)
        return NONE_LABEL;
    return stripFileExt(name, ['.job']);
}
function displayRecipeName(name, sourceKind) {
    var _a;
    if (sourceKind === void 0) { sourceKind = DEFAULT_RECIPE_SOURCE; }
    return stripFileExt(name, (_a = RECIPE_SOURCE_EXTS[sourceKind]) !== null && _a !== void 0 ? _a : RECIPE_SOURCE_EXTS.recipe);
}
function normalizeRecipeDisplayName(name, sourceKind) {
    if (sourceKind === void 0) { sourceKind = DEFAULT_RECIPE_SOURCE; }
    return normalizeSearchValue(displayRecipeName(name, sourceKind));
}
function recipeDisplayNameEquals(a, b, sourceKind) {
    if (sourceKind === void 0) { sourceKind = DEFAULT_RECIPE_SOURCE; }
    return normalizeRecipeDisplayName(a, sourceKind) === normalizeRecipeDisplayName(b, sourceKind);
}
function makeTempSourceRecipeId(kind, name) {
    return "RCP_TMP::".concat(kind, "::").concat(displayRecipeName(name, kind));
}
var tCas = null;
var tJob = null;
var tRec = null;
var tRecipePicker = null;
function isTempSourceRecipeId(recipeId) {
    return String(recipeId || '').startsWith('RCP_TMP::');
}
function parseTempSourceRecipeIdLocal(recipeId) {
    var raw = String(recipeId || '');
    if (!raw.startsWith('RCP_TMP::'))
        return null;
    var payload = raw.slice('RCP_TMP::'.length);
    var idx = payload.indexOf('::');
    if (idx < 0)
        return null;
    return { sourceKind: payload.slice(0, idx), recipeName: payload.slice(idx + 2) };
}
function findLoadedSourceRecipeByName(name, sourceKind) {
    var _a, _b;
    var pools = __spreadArray(__spreadArray([], ((_a = recipeSourceCache[sourceKind]) !== null && _a !== void 0 ? _a : []), true), allRecipes.value.filter(function (r) { var _a; return ((_a = r.sourceKind) !== null && _a !== void 0 ? _a : sourceKind) === sourceKind; }), true);
    var clean = displayRecipeName(name, sourceKind);
    var exact = pools.find(function (r) { return recipeDisplayNameEquals(r.name, clean, sourceKind); });
    if (exact)
        return exact;
    var normRaw = normalizeSearchValue(String(name || ''));
    var rawMatch = pools.find(function (r) { return normalizeSearchValue(String(r.name || '')) === normRaw; });
    if (rawMatch)
        return rawMatch;
    var exts = (_b = RECIPE_SOURCE_EXTS[sourceKind]) !== null && _b !== void 0 ? _b : [];
    var _loop_1 = function (ext) {
        var withExt = "".concat(clean).concat(ext);
        var hit = pools.find(function (r) { return normalizeSearchValue(String(r.name || '')) === normalizeSearchValue(withExt); });
        if (hit)
            return { value: hit };
    };
    for (var _i = 0, exts_2 = exts; _i < exts_2.length; _i++) {
        var ext = exts_2[_i];
        var state_1 = _loop_1(ext);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return null;
}
function syncResolvedRecipeId(oldId, newId) {
    if (!oldId || !newId || oldId === newId)
        return;
    if (selectedRecipes.has(oldId)) {
        selectedRecipes.delete(oldId);
        selectedRecipes.add(newId);
    }
    if (lastRecipe.value === oldId)
        lastRecipe.value = newId;
    if (recipePicker.previewId === oldId)
        recipePicker.previewId = newId;
    recipesData.value = recipesData.value.filter(function (r) { return r.id !== oldId; });
    for (var _i = 0, _a = Object.keys(recipeSourceCache); _i < _a.length; _i++) {
        var key = _a[_i];
        var sourceKind = key;
        var cached = recipeSourceCache[sourceKind];
        if (cached === null || cached === void 0 ? void 0 : cached.length) {
            recipeSourceCache[sourceKind] = cached.filter(function (r) { return r.id !== oldId; });
        }
    }
}
function deepClone(value) {
    return JSON.parse(JSON.stringify(value !== null && value !== void 0 ? value : null));
}
function parseModifiedTimeKey(value) {
    var text = String(value || '').trim();
    var m = text.match(/^(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(AM|PM)$/i);
    if (!m)
        return Number.MIN_SAFE_INTEGER;
    var mm = m[1], dd = m[2], yy = m[3], hh = m[4], mi = m[5], ap = m[6];
    var hour = Number(hh);
    if (ap.toUpperCase() === 'AM') {
        if (hour === 12)
            hour = 0;
    }
    else {
        if (hour !== 12)
            hour += 12;
    }
    var year = 2000 + Number(yy);
    var date = new Date(year, Number(mm) - 1, Number(dd), hour, Number(mi), 0, 0);
    return date.getTime();
}
function displayModifiedTime(value) {
    var text = String(value || '').trim();
    var raw12h = text.match(/^(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(AM|PM)$/i);
    if (raw12h) {
        var mm = raw12h[1], dd = raw12h[2], yy = raw12h[3], hh = raw12h[4], mi = raw12h[5], ap = raw12h[6];
        var hour = Number(hh);
        if (ap.toUpperCase() === 'AM') {
            if (hour === 12)
                hour = 0;
        }
        else {
            if (hour !== 12)
                hour += 12;
        }
        return "".concat(yy, "-").concat(mm, "-").concat(dd, " ").concat(String(hour).padStart(2, '0'), ":").concat(mi);
    }
    var raw24h = text.match(/^(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (raw24h) {
        var mm = raw24h[1], dd = raw24h[2], yy = raw24h[3], hh = raw24h[4], mi = raw24h[5];
        return "".concat(yy, "-").concat(mm, "-").concat(dd, " ").concat(hh, ":").concat(mi);
    }
    return text;
}
function sortCasData() { casData.value = __spreadArray([], casData.value, true); }
function sortJobsData() { jobsData.value = __spreadArray([], jobsData.value, true); }
function sortRecipesData() {
    recipesData.value = __spreadArray([], recipesData.value, true).sort(function (a, b) { return naturalCompare(a.name, b.name); });
}
function createPlaceholderRecipe(id, name, info, modifiedAt, sourceKind) {
    if (info === void 0) { info = 'Select a recipe.'; }
    if (modifiedAt === void 0) { modifiedAt = ''; }
    if (sourceKind === void 0) { sourceKind = 'recipe'; }
    var lower = String(name || '').toLowerCase();
    if (sourceKind === 'isrmAlgorithm' || sourceKind === 'rtpcRecipe' || lower.endswith('.alg') || lower.endswith('.seg') || lower.endswith('.scx')) {
        return createNoPreviewRecipe(id, name, modifiedAt, sourceKind);
    }
    return { id: id, name: name, modifiedAt: displayModifiedTime(modifiedAt), sourceKind: sourceKind, columns: ['Info'], rows: [{ Info: info }] };
}
function createNoPreviewRecipe(id, name, modifiedAt, sourceKind) {
    if (modifiedAt === void 0) { modifiedAt = ''; }
    if (sourceKind === void 0) { sourceKind = 'recipe'; }
    return { id: id, name: name, modifiedAt: displayModifiedTime(modifiedAt), sourceKind: sourceKind, columns: [], rows: [] };
}
function isPlaceholderRecipe(recipe) {
    if (!recipe)
        return true;
    return recipe.columns.length === 1 && recipe.columns[0] === 'Info';
}
function upsertRecipeInSourceCache(detail) {
    var _a;
    var sourceKind = ((_a = detail.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value);
    var cached = recipeSourceCache[sourceKind];
    if (!(cached === null || cached === void 0 ? void 0 : cached.length))
        return;
    var idx = cached.findIndex(function (r) { return r.id === detail.id; });
    var next = __assign(__assign({}, detail), { sourceKind: sourceKind });
    if (idx >= 0) {
        recipeSourceCache[sourceKind] = __spreadArray(__spreadArray(__spreadArray([], cached.slice(0, idx), true), [next], false), cached.slice(idx + 1), true);
        return;
    }
    var sameNameIdx = cached.findIndex(function (r) { return recipeDisplayNameEquals(r.name, next.name, sourceKind); });
    if (sameNameIdx >= 0) {
        recipeSourceCache[sourceKind] = __spreadArray(__spreadArray(__spreadArray([], cached.slice(0, sameNameIdx), true), [next], false), cached.slice(sameNameIdx + 1), true);
    }
}
function replaceRecipeDetail(detail) {
    var _a, _b;
    var normalized = __assign(__assign({}, detail), { modifiedAt: displayModifiedTime(String((_a = detail.modifiedAt) !== null && _a !== void 0 ? _a : '').trim()), sourceKind: ((_b = detail.sourceKind) !== null && _b !== void 0 ? _b : activeRecipeSourceKind.value) });
    var idx = recipesData.value.findIndex(function (r) { return r.id === normalized.id; });
    if (idx >= 0) {
        var prev = recipesData.value[idx];
        var nextModifiedAt = String(normalized.modifiedAt || '').trim() || String(prev.modifiedAt || '').trim();
        recipesData.value[idx] = __assign(__assign({}, normalized), { modifiedAt: displayModifiedTime(nextModifiedAt) });
    }
    else {
        var sameNameIdx = recipesData.value.findIndex(function (r) { var _a, _b; return ((_a = r.sourceKind) !== null && _a !== void 0 ? _a : normalized.sourceKind) === normalized.sourceKind && recipeDisplayNameEquals(r.name, normalized.name, (_b = normalized.sourceKind) !== null && _b !== void 0 ? _b : DEFAULT_RECIPE_SOURCE); });
        if (sameNameIdx >= 0) {
            recipesData.value[sameNameIdx] = __assign(__assign({}, recipesData.value[sameNameIdx]), normalized);
        }
        else {
            recipesData.value = __spreadArray(__spreadArray([], recipesData.value, true), [normalized], false);
        }
    }
    upsertRecipeInSourceCache(normalized);
    sortRecipesData();
}
function getErrorMessage(err) {
    return err instanceof Error ? err.message : String(err);
}
function clearObject(obj) {
    for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
        var key = _a[_i];
        delete obj[key];
    }
}
function openAsciiNamePrompt(title, initialValue, _placeholder) {
    if (_placeholder === void 0) { _placeholder = ''; }
    var input = window.prompt(title, initialValue);
    if (input == null)
        return Promise.resolve(null);
    return Promise.resolve(input);
}
function normalizeSearchValue(s) {
    return String(s !== null && s !== void 0 ? s : '').trim().toLowerCase().replace(/\s+/g, '');
}
function hasComma(s) { return s.includes(','); }
function isSelectableRecipeValue(value) {
    var v = String(value || '').trim();
    return v !== '' && v !== NONE_LABEL;
}
/** Base Arrays */
var casData = (0, vue_1.ref)([]);
var jobsData = (0, vue_1.ref)([]);
var recipesData = (0, vue_1.ref)([]);
var jobParsedMap = (0, vue_1.reactive)({});
var recipeSourceCache = (0, vue_1.reactive)({});
var recipeSourceTitleMap = (0, vue_1.reactive)({ recipe: 'Recipe' });
var activeRecipeSourceKind = (0, vue_1.ref)(DEFAULT_RECIPE_SOURCE);
var inventorySnapshotHash = (0, vue_1.ref)('');
var inventorySnapshotTimer = null;
/** Sorting / Layout Matrix */
var casSortKey = (0, vue_1.ref)(null);
var casSortDir = (0, vue_1.ref)(null);
var jobSortKey = (0, vue_1.ref)(null);
var jobSortDir = (0, vue_1.ref)(null);
function toggleSort(keyRef, dirRef, key) {
    if (keyRef.value !== key) {
        keyRef.value = key;
        dirRef.value = 'asc';
        return;
    }
    if (dirRef.value === 'asc') {
        dirRef.value = 'desc';
        return;
    }
    keyRef.value = null;
    dirRef.value = null;
}
var casListColWidths = (0, vue_1.reactive)({ name: 158, modifiedAt: 82 });
var jobListColWidths = (0, vue_1.reactive)({ name: 178, modifiedAt: 82 });
var recipeListColWidths = (0, vue_1.reactive)({ name: 150, modifiedAt: 92 });
var recipePickerColWidths = (0, vue_1.reactive)({ name: 254, modifiedAt: 139 });
var casListMode = (0, vue_1.ref)('name');
var jobListMode = (0, vue_1.ref)('name');
var recipeListMode = (0, vue_1.ref)('name');
var recipePickerListMode = (0, vue_1.ref)('name');
var casFindClass = (0, vue_1.ref)('');
var jobFindClass = (0, vue_1.ref)('');
var recipePickerFindClass = (0, vue_1.ref)('');
var listResizeState = (0, vue_1.reactive)({
    active: false,
    listKey: null,
    colKey: null,
    startX: 0,
    boxW: 0,
    startW: 0
});
function startListResize(listKey, colKey, e) {
    var target = listKey === 'cas' ? casListColWidths : jobListColWidths;
    listResizeState.active = true;
    listResizeState.listKey = listKey;
    listResizeState.colKey = colKey;
    listResizeState.startX = e.clientX;
    listResizeState.startW = target[colKey];
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onListResizeMove);
    window.addEventListener('mouseup', stopListResize);
}
function onListResizeMove(e) {
    if (!listResizeState.active || !listResizeState.listKey || !listResizeState.colKey)
        return;
    var delta = e.clientX - listResizeState.startX;
    var minW = listResizeState.colKey === 'modifiedAt' ? 82 : 70;
    var nextW = Math.max(minW, listResizeState.startW + delta);
    var target = listResizeState.listKey === 'cas' ? casListColWidths : jobListColWidths;
    target[listResizeState.colKey] = nextW;
}
function onListBodyScroll(kind) {
    if (kind === 'cas' && casScrollEl.value)
        casScrollLeft.value = casScrollEl.value.scrollLeft;
    if (kind === 'job' && jobScrollEl.value)
        jobScrollLeft.value = jobScrollEl.value.scrollLeft;
}
Pel백엔드;
포맷;
유지;
function stopListResize() {
    listResizeState.active = false;
    listResizeState.listKey = null;
    listResizeState.colKey = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onListResizeMove);
    window.removeEventListener('mouseup', stopListResize);
}
function onRecipeBodyScroll() {
    if (recipeScrollEl.value)
        recipeScrollLeft.value = recipeScrollEl.value.scrollLeft;
}
function onRecipePickerBodyScroll() {
    if (recipePickerScrollEl.value)
        recipePickerScrollLeft.value = recipePickerScrollEl.value.scrollLeft;
}
var recipeListResizeState = (0, vue_1.reactive)({
    active: false,
    target: null,
    colKey: null,
    startX: 0,
    startW: 0
});
function startRecipeResize(target, colKey, e) {
    var widths = target === 'panel' ? recipeListColWidths : recipePickerColWidths;
    recipeListResizeState.active = true;
    recipeListResizeState.target = target;
    recipeListResizeState.colKey = colKey;
    recipeListResizeState.startX = e.clientX;
    recipeListResizeState.startW = widths[colKey];
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onRecipeResizeMove);
    window.addEventListener('mouseup', stopRecipeResize);
}
function onRecipeResizeMove(e) {
    if (!recipeListResizeState.active || !recipeListResizeState.target || !recipeListResizeState.colKey)
        return;
    var widths = recipeListResizeState.target === 'panel' ? recipeListColWidths : recipePickerColWidths;
    var delta = e.clientX - recipeListResizeState.startX;
    var minW = recipeListResizeState.colKey === 'modifiedAt' ? 82 : 90;
    widths[recipeListResizeState.colKey] = Math.max(minW, recipeListResizeState.startW + delta);
}
function stopRecipeResize() {
    recipeListResizeState.active = false;
    recipeListResizeState.target = null;
    recipeListResizeState.colKey = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onRecipeResizeMove);
    window.removeEventListener('mouseup', stopRecipeResize);
}
function onRecipeListResize(payload) {
    startRecipeResize('panel', payload.colKey, payload.event);
}
function onRecipePickerListResize(payload) {
    startRecipeResize('picker', payload.colKey, payload.event);
}
/** Computed Sorted Lists Matrix */
var casItems = (0, vue_1.computed)(function () {
    var arr = __spreadArray([], casData.value, true);
    if (casSortKey.value && casSortDir.value) {
        arr.sort(function (a, b) {
            var cmp = casSortKey.value === 'name' ? naturalCompare(displayCasName(a.name), displayCasName(b.name)) : parseModifiedTimeKey(a.modifiedAt) - parseModifiedTimeKey(b.modifiedAt);
            return casSortDir.value === 'asc' ? cmp : -cmp;
        });
    }
    return arr;
});
var jobs = (0, vue_1.computed)(function () {
    var sorted = __spreadArray([], jobsData.value, true);
    if (jobSortKey.value && jobSortDir.value) {
        sorted.sort(function (a, b) {
            var cmp = jobSortKey.value === 'jobName' ? naturalCompare(displayJobName(a.jobName), displayJobName(b.jobName)) : parseModifiedTimeKey(a.modifiedAt) - parseModifiedTimeKey(b.modifiedAt);
            return jobSortDir.value === 'asc' ? cmp : -cmp;
        });
    }
    return sorted;
});
var allRecipes = (0, vue_1.computed)(function () {
    var sorted = __spreadArray([], recipesData.value, true).sort(function (a, b) { return naturalCompare(a.name, b.name); });
    return __spreadArray([NONE_RECIPE], sorted, true);
});
var casDisplayItems = (0, vue_1.computed)(function () { return hasLoadedFiles.value ? __spreadArray([{ name: CAS_NONE_ID, modifiedAt: '' }], casItems.value, true) : []; });
var jobDisplayItems = (0, vue_1.computed)(function () { return hasLoadedFiles.value ? __spreadArray([{ id: JOB_NONE_ID, jobName: NONE_LABEL, recipe: NONE_RECIPE, modifiedAt: '' }], jobs.value, true) : []; });
var filteredLineOptions = (0, vue_1.computed)(function () {
    var lines = eqpMasterItems.value.map(function (x) { return x.line; }).filter(Boolean);
    var unique = lines.filter(function (v, i, arr) { return arr.indexOf(v) === i; }).sort();
    return unique.length ? __spreadArray([], unique, true) : __spreadArray([], lineOptionsLocal.value, true);
});
var filteredTeamOptions = (0, vue_1.computed)(function () {
    var teams = eqpMasterItems.value.filter(function (x) { return !line.value || x.line === line.value; }).map(function (x) { return x.team; }).filter(Boolean);
    var unique = teams.filter(function (v, i, arr) { return arr.indexOf(v) === i; }).sort();
    if (unique.length)
        return unique;
    if (!eqpMasterItems.value.length)
        return __spreadArray([], teamOptionsLocal.value, true);
    var fallback = !line.value ? teamOptionsLocal.value : eqpMasterItems.value.filter(function (x) { return x.line === line.value; }).map(function (x) { return x.team; });
    return fallback.filter(function (v, i, arr) { return !!v && arr.indexOf(v) === i; }).sort();
});
var filteredEqpOptions = (0, vue_1.computed)(function () {
    var items = eqpMasterItems.value.filter(function (x) { return !line.value || x.line === line.value; }).filter(function (x) { return !team.value || x.team === team.value; });
    var eqps = items.map(function (x) { return x.eqpId; }).filter(Boolean);
    var unique = eqps.filter(function (v, i, arr) { return arr.indexOf(v) === i; }).sort();
    if (unique.length)
        return unique;
    return __spreadArray([], eqpOptionsLocal.value, true);
});
function loadEqpOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var cacheKey, res, err_1, cached, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cacheKey = 'recipe-test:eqp-options';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.getEqpOptions()];
                case 2:
                    res = _a.sent();
                    eqpMasterItems.value = res.items;
                    lineOptionsLocal.value = res.lineOptions;
                    teamOptionsLocal.value = res.teamOptions;
                    eqpOptionsLocal.value = res.eqpOptions;
                    window.localStorage.setItem(cacheKey, JSON.stringify(res));
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error('loadEqpOptions failed:', err_1);
                    try {
                        cached = window.localStorage.getItem(cacheKey);
                        if (cached) {
                            res = JSON.parse(cached);
                            eqpMasterItems.value = Array.isArray(res === null || res === void 0 ? void 0 : res.items) ? res.items : [];
                            lineOptionsLocal.value = Array.isArray(res === null || res === void 0 ? void 0 : res.lineOptions) ? res.lineOptions : [];
                            teamOptionsLocal.value = Array.isArray(res === null || res === void 0 ? void 0 : res.teamOptions) ? res.teamOptions : [];
                            eqpOptionsLocal.value = Array.isArray(res === null || res === void 0 ? void 0 : res.eqpOptions) ? res.eqpOptions : [];
                        }
                    }
                    catch (cacheErr) {
                        console.error('loadEqpOptions cache restore failed:', cacheErr);
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.watch)(line, function (nextLine) {
    if (team.value && !eqpMasterItems.value.some(function (x) { return (!nextLine || x.line === nextLine) && x.team === team.value; })) {
        team.value = '';
    }
    if (eqpId.value && !eqpMasterItems.value.some(function (x) { return x.eqpId === eqpId.value && (!nextLine || x.line === nextLine) && (!team.value || x.team === team.value); })) {
        eqpId.value = '';
    }
});
(0, vue_1.watch)(team, function (nextTeam) {
    var _a, _b;
    if (nextTeam && !line.value) {
        var matchedLine = (_b = (_a = eqpMasterItems.value.find(function (x) { return x.team === nextTeam; })) === null || _a === void 0 ? void 0 : _a.line) !== null && _b !== void 0 ? _b : '';
        if (matchedLine)
            line.value = matchedLine;
    }
    if (eqpId.value && !eqpMasterItems.value.some(function (x) { return x.eqpId === eqpId.value && (!line.value || x.line === line.value) && (!nextTeam || x.team === nextTeam); })) {
        eqpId.value = '';
    }
});
(0, vue_1.watch)(eqpId, function (nextEqpId) {
    if (!nextEqpId)
        return;
    var matched = eqpMasterItems.value.find(function (x) { return x.eqpId === nextEqpId; });
    if (!matched)
        return;
    if (matched.line && matched.line != line.value)
        line.value = matched.line;
    if (matched.team && matched.team != team.value)
        team.value = matched.team;
});
/** Core Context Map Matrix */
var casToJobs = (0, vue_1.ref)({});
var selectedCas = (0, vue_1.reactive)(new Set());
var selectedJobs = (0, vue_1.reactive)(new Set());
var selectedRecipes = (0, vue_1.reactive)(new Set(['R_NONE']));
var cartItems = (0, vue_1.ref)([]);
var selectedCartTargetEqpIdsSet = (0, vue_1.reactive)(new Set());
var cartFlyTokens = (0, vue_1.ref)([]);
var cartShakeToken = (0, vue_1.ref)(0);
var currentEqpMeta = (0, vue_1.computed)(function () { return eqpMasterItems.value.find(function (x) { return x.eqpId === eqpId.value; }) || null; });
var cartCount = (0, vue_1.computed)(function () { return cartItems.value.length; });
var cartMaker = (0, vue_1.computed)(function () { var _a; return ((_a = cartItems.value[0]) === null || _a === void 0 ? void 0 : _a.maker) || ''; });
var cartModelGroup = (0, vue_1.computed)(function () { var _a; return ((_a = cartItems.value[0]) === null || _a === void 0 ? void 0 : _a.modelGroup) || ''; });
var cartViewItems = (0, vue_1.computed)(function () { return cartItems.value; });
var cartTargetOptions = (0, vue_1.computed)(function () {
    if (!cartItems.value.length)
        return [];
    var excluded = new Set(cartItems.value.map(function (x) { return x.sourceEqpId; }));
    return eqpMasterItems.value.filter(function (x) { return !excluded.has(x.eqpId); }).filter(function (x) { return !cartMaker.value || x.maker === cartMaker.value; }).filter(function (x) { return !cartModelGroup.value || x.modelGroup === cartModelGroup.value; });
});
var selectedCartTargetEqpIds = (0, vue_1.computed)(function () { return Array.from(selectedCartTargetEqpIdsSet); });
/** Anchor / Navigation Metrics */
var casAnchorIdx = (0, vue_1.ref)(null);
var jobAnchorIdx = (0, vue_1.ref)(null);
var recipeAnchorIdx = (0, vue_1.ref)(null);
var recipePickerAnchorIdx = (0, vue_1.ref)(null);
var casCursorIdx = (0, vue_1.ref)(null);
var jobCursorIdx = (0, vue_1.ref)(null);
var recipeCursorIdx = (0, vue_1.ref)(null);
var lastCas = (0, vue_1.ref)('');
var lastJob = (0, vue_1.ref)('');
var lastRecipe = (0, vue_1.ref)('R_NONE');
var casScrollEl = (0, vue_1.ref)(null);
var legacyPanelEl = (0, vue_1.ref)(null);
var jobContentEl = (0, vue_1.ref)(null);
var recipeScrollEl = (0, vue_1.ref)(null);
var recipePickerScrollEl = (0, vue_1.ref)(null);
var casContentEl = (0, vue_1.ref)(null);
var cartAnchorEl = (0, vue_1.ref)(null);
var cartOverlayPos = (0, vue_1.reactive)({ top: 86, right: 20 });
function updateCartOverlayPos() {
    var _a;
    var rect = (_a = cartAnchorEl.value) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
    if (!rect) {
        cartOverlayPos.top = 86;
        cartOverlayPos.right = 20;
        return;
    }
    cartOverlayPos.top = Math.round(rect.bottom + 10);
    cartOverlayPos.right = Math.max(16, Math.round(window.innerWidth - rect.right));
}
var cartOverlayStyle = (0, vue_1.computed)(function () { return ({
    top: "".concat(cartOverlayPos.top, "px"),
    right: "".concat(cartOverlayPos.right, "px")
}); });
var casRefs = new Map();
var jobRefs = new Map();
var recipeRefs = new Map();
var recipePickerRefs = new Map();
function setCasRef(id, el) { if (el)
    casRefs.set(id, el); }
function setJobRef(id, el) { if (el)
    jobRefs.set(id, el); }
function setRecipeRef(id, el) { if (el)
    recipeRefs.set(id, el); }
function setRecipePickerRef(id, el) { if (el)
    recipePickerRefs.set(id, el); }
function setCasScrollEl(el) { casScrollEl.value = el; }
function setJobScrollEl(el) { jobScrollEl.value = el; }
function setRecipeScrollEl(el) { recipeScrollEl.value = el; }
function setRecipePickerScrollEl(el) { recipePickerScrollEl.value = el; }
function setCartAnchor(el) {
    cartAnchorEl.value = el;
    updateCartOverlayPos();
}
function toggleCartPanel() {
    cartOpen.value = !cartOpen.value;
    if (cartOpen.value)
        (0, vue_1.nextTick)(function () { return updateCartOverlayPos(); });
}
function closeCartOverlay() { cartOpen.value = false; }
function setCasContentRoot(el) { casContentEl.value = el; }
function setJobContentRoot(el) { jobContentEl.value = el; }
function setRecipePanelRoot(el) { legacyPanelEl.value = el; }
function onCasItemRef(payload) { setCasRef(payload.id, payload.el); }
function onJobItemRef(payload) { setJobRef(payload.id, payload.el); }
function onRecipeItemRef(payload) { setRecipeRef(payload.id, payload.el); }
function onRecipePickerItemRef(payload) { setRecipePickerRef(payload.id, payload.el); }
function resetCasScrollToLeftTop() {
    if (casScrollEl.value) {
        casScrollEl.value.scrollLeft = 0;
        casScrollEl.value.scrollTop = 0;
    }
}
function findScrollableParent(el) {
    var _a;
    var cur = (_a = el === null || el === void 0 ? void 0 : el.parentElement) !== null && _a !== void 0 ? _a : null;
    while (cur) {
        var style = window.getComputedStyle(cur);
        var canScrollY = /(auto|scroll)/.test(style.overflowY) && cur.scrollHeight > cur.clientHeight;
        var canScrollX = /(auto|scroll)/.test(style.overflowX) && cur.scrollWidth > cur.clientWidth;
        if (canScrollX || canScrollY || cur.classList.contains('w97-scroll'))
            return cur;
        cur = cur.parentElement;
    }
    return null;
}
function scrollElementIntoPaddedView(el, padding) {
    if (padding === void 0) { padding = 8; }
    if (!el)
        return;
    var container = findScrollableParent(el);
    if (!container) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        return;
    }
    var style = window.getComputedStyle(container);
    var padX = Math.max(padding, parseFloat(style.paddingLeft || '0') || 0, parseFloat(style.paddingRight || '0') || 0);
    var padY = Math.max(padding, parseFloat(style.paddingTop || '0') || 0, parseFloat(style.paddingBottom || '0') || 0);
    var elRect = el.getBoundingClientRect();
    var boxRect = container.getBoundingClientRect();
    if (elRect.left < boxRect.left + padX) {
        container.scrollLeft -= (boxRect.left + padX) - elRect.left;
    }
    else if (elRect.right > boxRect.right - padX) {
        container.scrollLeft += elRect.right - (boxRect.right - padX);
    }
    if (elRect.top < boxRect.top + padY) {
        container.scrollTop -= (boxRect.top + padY) - elRect.top;
    }
    else if (elRect.bottom > boxRect.bottom - padY) {
        container.scrollTop += elRect.bottom - (boxRect.bottom - padY);
    }
}
function scrollIntoView(map_1, id_1) {
    return __awaiter(this, arguments, void 0, function (map, id, padding) {
        var _a;
        if (padding === void 0) { padding = 8; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, vue_1.nextTick)()];
                case 1:
                    _b.sent();
                    if (!id)
                        return [2 /*return*/];
                    scrollElementIntoPaddedView((_a = map.get(id)) !== null && _a !== void 0 ? _a : null, padding);
                    return [2 /*return*/];
            }
        });
    });
}
var scrollBottomTimer = null;
function scrollPageToBottom(delay) {
    if (delay === void 0) { delay = 80; }
    clearTimeout(scrollBottomTimer);
    scrollBottomTimer = setTimeout(function () {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }, delay);
}
function ensureRecipePanelVisibleOnOpen() {
    return __awaiter(this, arguments, void 0, function (delay) {
        if (delay === void 0) { delay = 50; }
        return __generator(this, function (_a) {
            clearTimeout(scrollBottomTimer);
            scrollBottomTimer = setTimeout(function () {
                var panel = legacyPanelEl.value;
                if (!panel) {
                    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                    return;
                }
                var rect = panel.getBoundingClientRect();
                var fullyVisible = rect.top >= 8 && rect.bottom <= window.innerHeight - 12;
                if (fullyVisible)
                    return;
                var targetTop = Math.max(0, window.scrollY + rect.top - 16);
                window.scrollTo({ top: targetTop, behavior: 'smooth' });
            }, delay);
            return [2 /*return*/];
        });
    });
}
function onRecipeAreaClick() { activateArea('recipeArea', 'recipe'); }
var casCols = (0, vue_1.computed)(function () {
    var arr = casDisplayItems.value;
    var out = [];
    for (var i = 0; i < arr.length; i += CAS_PER_COL)
        out.push(arr.slice(i, i + CAS_PER_COL));
    return out;
});
var jobCols = (0, vue_1.computed)(function () {
    var arr = jobDisplayItems.value;
    var out = [];
    for (var i = 0; i < arr.length; i += JOB_PER_COL)
        out.push(arr.slice(i, i + JOB_PER_COL));
    return out;
});
var recipeCols = (0, vue_1.computed)(function () {
    var arr = allRecipes.value;
    var out = [];
    for (var i = 0; i < arr.length; i += RECIPE_PER_COL)
        out.push(arr.slice(i, i + RECIPE_PER_COL));
    return out;
});
var selectedCasIds = (0, vue_1.computed)(function () { return Array.from(selectedCas); });
var selectedJobIds = (0, vue_1.computed)(function () { return Array.from(selectedJobs); });
var selectedRecipeIds = (0, vue_1.computed)(function () { return Array.from(selectedRecipes); });
var selectedSlotNumbers = (0, vue_1.computed)(function () { return Array.from(selectedSlotCells); });
var casSelectedSingleDisplay = (0, vue_1.computed)(function () { var _a; return displayCasName((_a = casSelectedSingle.value) !== null && _a !== void 0 ? _a : ''); });
var selectedJobDisplayName = (0, vue_1.computed)(function () { var _a, _b; return displayJobName((_b = (_a = selectedJobSingleReal.value) === null || _a === void 0 ? void 0 : _a.jobName) !== null && _b !== void 0 ? _b : ''); });
var casListViewCols = (0, vue_1.computed)(function () { return casCols.value.map(function (col) { return col.map(function (item) { return ({ name: item.name, displayName: displayCasName(item.name), displayModifiedAt: displayModifiedTime(item.modifiedAt) }); }); }); });
var jobListViewCols = (0, vue_1.computed)(function () { return jobCols.value.map(function (col) { return col.map(function (item) { var _a; return ({ id: item.id, jobName: item.jobName, displayName: displayJobName(item.jobName), displayModifiedAt: displayModifiedTime((_a = item.modifiedAt) !== null && _a !== void 0 ? _a : '') }); }); }); });
var casSelectedSingle = (0, vue_1.computed)(function () {
    if (selectedCas.size !== 1)
        return null;
    var id = Array.from(selectedCas)[0];
    return id === CAS_NONE_ID ? null : id;
});
var previewJobId = (0, vue_1.computed)(function () {
    if (selectedJobs.size === 1) {
        var id = Array.from(selectedJobs)[0];
        return id && id !== JOB_NONE_ID ? id : '';
    }
    var fallback = String(lastJob.value || '');
    if (fallback && fallback !== JOB_NONE_ID && selectedJobs.has(fallback))
        return fallback;
    return '';
});
var selectedJobSingleReal = (0, vue_1.computed)(function () {
    var _a;
    var id = previewJobId.value;
    if (!id)
        return null;
    return (_a = jobsData.value.find(function (j) { return j.id === id; })) !== null && _a !== void 0 ? _a : null;
});
var showJobContent = (0, vue_1.computed)(function () { return !selectedJobSingleReal.value; });
var selectedJobParsed = (0, vue_1.computed)(function () {
    var _a, _b;
    var jobId = (_a = selectedJobSingleReal.value) === null || _a === void 0 ? void 0 : _a.id;
    if (!jobId)
        return null;
    return (_b = jobParsedMap[jobId]) !== null && _b !== void 0 ? _b : null;
});
var jobMissingRecipeMapById = (0, vue_1.reactive)({});
var selectedJobMissingRecipeMap = (0, vue_1.computed)(function () {
    var _a, _b;
    var jobId = (_a = selectedJobSingleReal.value) === null || _a === void 0 ? void 0 : _a.id;
    if (!jobId)
        return {};
    return (_b = jobMissingRecipeMapById[jobId]) !== null && _b !== void 0 ? _b : {};
});
function jobMissingKey() {
    var parts = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parts[_i] = arguments[_i];
    }
    return parts.filter(function (v) { return v !== undefined && v !== null && String(v) !== ''; }).join('::');
}
function primeRecipeSourceCache(sourceKind) {
    return __awaiter(this, void 0, void 0, function () {
        var res_1, items, err_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!eqpId.value)
                        return [2 /*return*/];
                    if (sourceKind === 'recipe') {
                        if (!((_a = recipeSourceCache.recipe) === null || _a === void 0 ? void 0 : _a.length))
                            recipeSourceCache.recipe = __spreadArray([], recipesData.value, true);
                        return [2 /*return*/];
                    }
                    if ((_b = recipeSourceCache[sourceKind]) === null || _b === void 0 ? void 0 : _b.length)
                        return [2 /*return*/];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.getRecipeSourceList(eqpId.value, sourceKind)];
                case 2:
                    res_1 = _c.sent();
                    recipeSourceTitleMap[sourceKind] = res_1.titleBase;
                    items = res_1.items.map(function (item) { return NO_PREVIEW_SOURCE_KINDS.has(item.sourceKind) ? createNoPreviewRecipe(item.id, item.name, item.modifiedAt, item.sourceKind) : createPlaceholderRecipe(item.id, item.name, "".concat(res_1.titleBase, " preview placeholder"), item.modifiedAt, item.sourceKind); });
                    recipeSourceCache[sourceKind] = __spreadArray([], items, true);
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _c.sent();
                    console.warn('primeRecipeSourceCache failed:', sourceKind, err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function recipeExistsInSource(sourceKind, value) {
    var _a, _b;
    var clean = String(value || '').trim();
    if (!clean || clean === NONE_LABEL)
        return true;
    var list = sourceKind === 'recipe' ? (((_a = recipeSourceCache.recipe) === null || _a === void 0 ? void 0 : _a.length) ? recipeSourceCache.recipe : recipesData.value) : ((_b = recipeSourceCache[sourceKind]) !== null && _b !== void 0 ? _b : []);
    if (!list.length)
        return true;
    return list.some(function (r) { return recipeDisplayNameEquals(r.name, clean, sourceKind); });
}
function refreshJobMissingRecipeMap(jobId) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, kinds, addKind, _i, _a, row, _b, _c, row, _d, _e, row, next, _f, _g, row, label, kind;
        var _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9;
        return __generator(this, function (_10) {
            switch (_10.label) {
                case 0:
                    parsed = jobParsedMap[jobId];
                    if (!parsed) {
                        delete jobMissingRecipeMapById[jobId];
                        return [2 /*return*/];
                    }
                    kinds = new Set();
                    addKind = function (value, kind) {
                        var txt = String(value || '').trim();
                        if (!txt || txt === NONE_LABEL)
                            return;
                        kinds.add(kind);
                    };
                    addKind((_h = parsed.preMetrology) === null || _h === void 0 ? void 0 : _h.recipe, 'metrologyRecipe');
                    addKind((_j = parsed.postMetrology) === null || _j === void 0 ? void 0 : _j.recipe, 'metrologyRecipe');
                    addKind((_k = parsed.hcluRecipes) === null || _k === void 0 ? void 0 : _k.postLoad, 'hcluPostLoad');
                    addKind((_l = parsed.hcluRecipes) === null || _l === void 0 ? void 0 : _l.preUnload, 'hcluPreUnload');
                    for (_i = 0, _a = (_o = (_m = parsed.polisher) === null || _m === void 0 ? void 0 : _m.rows) !== null && _o !== void 0 ? _o : []; _i < _a.length; _i++) {
                        row = _a[_i];
                        addKind(row === null || row === void 0 ? void 0 : row.p1, polisherSourceKindForLabel((row === null || row === void 0 ? void 0 : row.label) || ''));
                    }
                    for (_b = 0, _c = (_q = (_p = parsed.polisher) === null || _p === void 0 ? void 0 : _p.rows) !== null && _q !== void 0 ? _q : []; _b < _c.length; _b++) {
                        row = _c[_b];
                        addKind(row === null || row === void 0 ? void 0 : row.p2, polisherSourceKindForLabel((row === null || row === void 0 ? void 0 : row.label) || ''));
                    }
                    for (_d = 0, _e = (_s = (_r = parsed.polisher) === null || _r === void 0 ? void 0 : _r.rows) !== null && _s !== void 0 ? _s : []; _d < _e.length; _d++) {
                        row = _e[_d];
                        addKind(row === null || row === void 0 ? void 0 : row.p3, polisherSourceKindForLabel((row === null || row === void 0 ? void 0 : row.label) || ''));
                    }
                    ((_u = (_t = parsed.cleaner) === null || _t === void 0 ? void 0 : _t.rows) !== null && _u !== void 0 ? _u : []).forEach(function (row, idx) { return addKind(row === null || row === void 0 ? void 0 : row.recipe, cleanerSourceKindForLabel(cleanerModuleLabelForRow(row, idx))); });
                    return [4 /*yield*/, Promise.all(Array.from(kinds).map(function (k) { return primeRecipeSourceCache(k); }))];
                case 1:
                    _10.sent();
                    next = {};
                    next[jobMissingKey('preMetrology')] = !recipeExistsInSource('metrologyRecipe', (_w = (_v = parsed.preMetrology) === null || _v === void 0 ? void 0 : _v.recipe) !== null && _w !== void 0 ? _w : '');
                    next[jobMissingKey('postMetrology')] = !recipeExistsInSource('metrologyRecipe', (_y = (_x = parsed.postMetrology) === null || _x === void 0 ? void 0 : _x.recipe) !== null && _y !== void 0 ? _y : '');
                    next[jobMissingKey('hclu', 'postLoad')] = !recipeExistsInSource('hcluPostLoad', (_0 = (_z = parsed.hcluRecipes) === null || _z === void 0 ? void 0 : _z.postLoad) !== null && _0 !== void 0 ? _0 : '');
                    next[jobMissingKey('hclu', 'preUnload')] = !recipeExistsInSource('hcluPreUnload', (_2 = (_1 = parsed.hcluRecipes) === null || _1 === void 0 ? void 0 : _1.preUnload) !== null && _2 !== void 0 ? _2 : '');
                    for (_f = 0, _g = (_4 = (_3 = parsed.polisher) === null || _3 === void 0 ? void 0 : _3.rows) !== null && _4 !== void 0 ? _4 : []; _f < _g.length; _f++) {
                        row = _g[_f];
                        label = (row === null || row === void 0 ? void 0 : row.label) || '';
                        kind = polisherSourceKindForLabel(label);
                        next[jobMissingKey('polisher', label, 'p1')] = !recipeExistsInSource(kind, (_5 = row === null || row === void 0 ? void 0 : row.p1) !== null && _5 !== void 0 ? _5 : '');
                        next[jobMissingKey('polisher', label, 'p2')] = !recipeExistsInSource(kind, (_6 = row === null || row === void 0 ? void 0 : row.p2) !== null && _6 !== void 0 ? _6 : '');
                        next[jobMissingKey('polisher', label, 'p3')] = !recipeExistsInSource(kind, (_7 = row === null || row === void 0 ? void 0 : row.p3) !== null && _7 !== void 0 ? _7 : '');
                    }
                    ;
                    ((_9 = (_8 = parsed.cleaner) === null || _8 === void 0 ? void 0 : _8.rows) !== null && _9 !== void 0 ? _9 : []).forEach(function (row, idx) {
                        var _a;
                        var moduleLabel = cleanerModuleLabelForRow(row, idx);
                        var kind = cleanerSourceKindForLabel(moduleLabel);
                        next[jobMissingKey('cleaner', idx)] = !recipeExistsInSource(kind, (_a = row === null || row === void 0 ? void 0 : row.recipe) !== null && _a !== void 0 ? _a : '');
                    });
                    jobMissingRecipeMapById[jobId] = next;
                    return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.watch)(function () { var _a; return (_a = selectedJobSingleReal.value) === null || _a === void 0 ? void 0 : _a.id; }, function (jobId) {
    if (jobId)
        void refreshJobMissingRecipeMap(jobId);
}, { immediate: true });
var casContentCanShow = (0, vue_1.computed)(function () {
    return casEditMode.value || activePane.value === 'casList' || activePane.value === 'casContent';
});
var casContentVisible = (0, vue_1.computed)(function () {
    return !casSelectedSingle.value && casContentCanShow.value;
});
var isJobFocused = (0, vue_1.computed)(function () { return activePane.value === 'jobContent' && showJobContent.value; });
var isCasInactive = (0, vue_1.computed)(function () { return activePane.value !== 'casList' && activePane.value !== 'casContent'; });
var singleLinkedJobMode = (0, vue_1.computed)(function () { return !casSelectedSingle.value && selectedJobs.size === 1; });
var casPanelStyle = (0, vue_1.computed)(function () {
    var w = 'clamp(390px, 25vw, 500px)';
    if (isCasInactive.value)
        w = 'clamp(280px, 18vw, 360px)';
    if (isJobFocused.value || activePane.value === 'recipeArea')
        w = 'clamp(280px, 18vw, 360px)';
    return { height: listPaneHeight, width: w, flexBasis: w };
});
var casContentStyle = (0, vue_1.computed)(function () {
    if (!casContentVisible.value) {
        return { height: listPaneHeight, width: '0px', flexBasis: '0px' };
    }
    var w = 'clamp(340px, 26vw, 460px)';
    return { height: listPaneHeight, width: w, flexBasis: w };
});
var jobPanelStyle = (0, vue_1.computed)(function () {
    var w = activePane.value === 'jobList' ? 'clamp(560px, 34vw, 700px)' : 'clamp(400px, 20vw, 500px)';
    if (singleLinkedJobMode.value && showJobContent.value) {
        w = 'clamp(500px, 30vw, 600px)';
    }
    return { height: listPaneHeight, width: w, flexBasis: w };
});
var contentPaneStyle = (0, vue_1.computed)(function () { return ({ flexGrow: activePane.value === 'jobContent' ? '2.1' : '1' }); });
var casTab = (0, vue_1.ref)('standard');
var casTabLabel = (0, vue_1.computed)(function () { return casTab.value === 'pre' ? 'Pre-Polish' : casTab.value === 'gating' ? 'Gating & Rework' : casTab.value === 'post' ? 'Post Rework' : 'Standard'; });
var casTableMap = (0, vue_1.reactive)({});
var casLoadingMap = (0, vue_1.reactive)({});
var jobLoadingMap = (0, vue_1.reactive)({});
var recipeLoadingMap = (0, vue_1.reactive)({});
var casTableRows = (0, vue_1.computed)(function () {
    var _a;
    var casId = casSelectedSingle.value;
    if (!casId)
        return [];
    return (_a = casTableMap[casId]) !== null && _a !== void 0 ? _a : [];
});
function normalizeJobNameForMatch(name) {
    return String(name || '').trim().toUpperCase().replace(/\.[A-Z0-9]+$/, '').replace(/\s+/g, '');
}
function findJobIdsByName(jobName) {
    var key = normalizeJobNameForMatch(jobName);
    return jobsData.value.filter(function (j) { return normalizeJobNameForMatch(j.jobName) === key; }).map(function (j) { return j.id; });
}
function cleanerModuleLabelForRow(row, idx) {
    var _a, _b, _c;
    var raw = String((_a = row.index) !== null && _a !== void 0 ? _a : '') + String((_b = row.module) !== null && _b !== void 0 ? _b : '').toLowerCase().replace(/\s+/g, ' ');
    if (raw.includes('cleaner input') || raw.includes('clean input') || raw.includes('cl input'))
        return 'Cleaner Input';
    if (raw.includes('megasonic'))
        return 'Megasonics';
    if (raw.includes('brush 1') || raw.includes('brush1'))
        return 'Brush 1';
    if (raw.includes('brush 2') || raw.includes('brush2'))
        return 'Brush 2';
    if (raw.includes('vapor dryer') || raw.includes('dryer'))
        return 'Vapor Dryer';
    if (raw.includes('cleaner output') || raw.includes('clean output') || raw.includes('cl output'))
        return 'Cleaner Output';
    return (_c = ['Cleaner Input', 'Megasonics', 'Brush 1', 'Brush 2', 'Vapor Dryer', 'Cleaner Output'][idx]) !== null && _c !== void 0 ? _c : 'Cleaner';
}
function extractJobIdsFromCasRows(rows) {
    var _a;
    var ids = new Set();
    var _loop_2 = function (row) {
        if (row.jobId && jobsData.value.find(function (j) { return j.id === row.jobId; })) {
            ids.add(row.jobId);
            return "continue";
        }
        var matches = findJobIdsByName((_a = row.jobName) !== null && _a !== void 0 ? _a : '');
        for (var _b = 0, matches_1 = matches; _b < matches_1.length; _b++) {
            var id = matches_1[_b];
            ids.add(id);
        }
    };
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        _loop_2(row);
    }
    return Array.from(ids);
}
function syncJobSelectionFromCasRows(rows) {
    var _a, _b;
    var ids = extractJobIdsFromCasRows(rows);
    if (!ids.length) {
        selectedJobs.clear();
        selectedJobs.add(JOB_NONE_ID);
        lastJob.value = JOB_NONE_ID;
        jobAnchorIdx.value = jobDisplayItems.value.findIndex(function (j) { return j.id === JOB_NONE_ID; });
        jobCursorIdx.value = jobAnchorIdx.value;
        setJobQueryProgram(NONE_LABEL);
        return;
    }
    selectedJobs.clear();
    ids.forEach(function (id) { return selectedJobs.add(id); });
    lastJob.value = ids[0];
    jobAnchorIdx.value = jobDisplayItems.value.findIndex(function (j) { return j.id === ids[0]; });
    jobCursorIdx.value = jobAnchorIdx.value;
    var matchedJobs = jobsData.value.filter(function (j) { return ids.includes(j.id); });
    setJobQueryProgram(ids.length === 1 ? displayJobName((_b = (_a = matchedJobs[0]) === null || _a === void 0 ? void 0 : _a.jobName) !== null && _b !== void 0 ? _b : NONE_LABEL) : matchedJobs.map(function (j) { return displayJobName(j.jobName); }).sort(naturalCompare).join(', '));
    void scrollIntoView(jobRefs, ids[0]);
    if (ids.length === 1) {
        void fetchJobContent(ids[0]);
    }
}
function ensureRecipeDetailById(recipeId) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, resolved, current, res, err_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!recipeId || recipeId === 'R_NONE')
                        return [2 /*return*/];
                    if (!isTempSourceRecipeId(recipeId)) return [3 /*break*/, 2];
                    parsed = parseTempSourceRecipeIdLocal(recipeId);
                    if (!parsed) return [3 /*break*/, 2];
                    resolved = findLoadedSourceRecipeByName(parsed.recipeName, parsed.sourceKind);
                    if (!(resolved && resolved.id !== recipeId)) return [3 /*break*/, 2];
                    syncResolvedRecipeId(recipeId, resolved.id);
                    return [4 /*yield*/, ensureRecipeDetailById(resolved.id)];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
                case 2:
                    if (recipeLoadingMap[recipeId])
                        return [2 /*return*/];
                    current = allRecipes.value.find(function (r) { return r.id === recipeId; });
                    if (!current || !isPlaceholderRecipe(current))
                        return [2 /*return*/];
                    recipeLoadingMap[recipeId] = true;
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, 6, 7]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.getRecipeContent(eqpId.value, recipeId)];
                case 4:
                    res = _b.sent();
                    replaceRecipeDetail(res.recipe);
                    if (((_a = res.recipe) === null || _a === void 0 ? void 0 : _a.id) && res.recipe.id !== recipeId) {
                        syncResolvedRecipeId(recipeId, res.recipe.id);
                    }
                    return [3 /*break*/, 7];
                case 5:
                    err_3 = _b.sent();
                    console.error('ensureRecipeDetailById failed:', err_3);
                    return [3 /*break*/, 7];
                case 6:
                    recipeLoadingMap[recipeId] = false;
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function ensureRecipeByName(name, sourceKind) {
    var _a, _b;
    if (sourceKind === void 0) { sourceKind = activeRecipeSourceKind.value; }
    var clean = displayRecipeName(name, sourceKind);
    if (!clean || clean === NONE_LABEL)
        return NONE_RECIPE;
    var sourceItems = ((_a = recipeSourceCache[sourceKind]) !== null && _a !== void 0 ? _a : []).filter(function (r) { return r.id !== 'R_NONE'; });
    var fallbackItems = allRecipes.value.filter(function (r) { return r.id !== 'R_NONE'; });
    var matcher = function (recipe) { return recipeDisplayNameEquals(recipe.name, clean, sourceKind); };
    var found = sourceItems.find(matcher);
    if (!found)
        found = fallbackItems.find(matcher);
    if (!found) {
        found = (_b = sourceItems.find(function (r) { return normalizeSearchValue(String(r.name)) === normalizeSearchValue(String(name)); })) !== null && _b !== void 0 ? _b : fallbackItems.find(function (r) { return normalizeSearchValue(String(r.name)) === normalizeSearchValue(String(name)); });
    }
    if (!found) {
        found = findLoadedSourceRecipeByName(clean, sourceKind);
    }
    if (found)
        return found;
    var id = makeTempSourceRecipeId(sourceKind, clean);
    found = recipesData.value.find(function (r) { return r.id === id; });
    if (!found) {
        found = NO_PREVIEW_SOURCE_KINDS.has(sourceKind) ? createNoPreviewRecipe(id, clean, '', sourceKind) : createPlaceholderRecipe(id, clean, "".concat(recipeSourceTitleMap[sourceKind] || 'Recipe', " preview placeholder"), '', sourceKind);
        recipesData.value = __spreadArray(__spreadArray([], recipesData.value.filter(function (r) { return r.id !== id; }), true), [found], false);
        recipeSourceCache[sourceKind] = __spreadArray(__spreadArray([], sourceItems, true), [found], false);
        sortRecipesData();
    }
    return found;
}
function setActiveRecipeSource(sourceKind, items) {
    activeRecipeSourceKind.value = sourceKind;
    recipeSourceCache[sourceKind] = __spreadArray([], items, true);
    recipesData.value = __spreadArray([], items, true);
    sortRecipesData();
}
function ensureRecipeSourceLoaded(sourceKind) {
    return __awaiter(this, void 0, void 0, function () {
        var res, items;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (sourceKind === 'recipe' && recipeSourceCache.recipe) {
                        setActiveRecipeSource('recipe', recipeSourceCache.recipe);
                        return [2 /*return*/];
                    }
                    if ((_a = recipeSourceCache[sourceKind]) === null || _a === void 0 ? void 0 : _a.length) {
                        setActiveRecipeSource(sourceKind, recipeSourceCache[sourceKind]);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.getRecipeSourceList(eqpId.value, sourceKind)];
                case 1:
                    res = _b.sent();
                    if (sourceKind === 'metrologyRecipe' && res.readError) {
                        console.warn('metrology source read failed:', res.readError);
                    }
                    recipeSourceTitleMap[sourceKind] = res.titleBase;
                    items = res.items.map(function (item) { return NO_PREVIEW_SOURCE_KINDS.has(item.sourceKind) ? createNoPreviewRecipe(item.id, item.name, item.modifiedAt, item.sourceKind) : createPlaceholderRecipe(item.id, item.name, "".concat(res.titleBase, " preview placeholder"), item.modifiedAt, item.sourceKind); });
                    setActiveRecipeSource(sourceKind, items);
                    return [2 /*return*/];
            }
        });
    });
}
function onJobParsedValueClick(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var recipe;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!jobEditMode.value) return [3 /*break*/, 2];
                    return [4 /*yield*/, openRecipePickerForPayload(payload)];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, ensureRecipeSourceLoaded(payload.sourceKind)];
                case 3:
                    _c.sent();
                    recipe = ensureRecipeByName(payload.value, payload.sourceKind);
                    void openRecipePanelWithRecipe(recipe, (_a = payload.platen) !== null && _a !== void 0 ? _a : 1, payload.titleBase, (_b = payload.emphasizeText) !== null && _b !== void 0 ? _b : '');
                    return [2 /*return*/];
            }
        });
    });
}
function toggleJobParsedFlag(section, key, checked) {
    var _a;
    var jobId = (_a = selectedJobSingleReal.value) === null || _a === void 0 ? void 0 : _a.id;
    if (!jobId || !jobEditMode.value)
        return;
    var parsed = jobParsedMap[jobId];
    if (!parsed || !parsed[section])
        return;
    parsed[section][key] = checked;
}
function fetchCasContent(casId) {
    return __awaiter(this, void 0, void 0, function () {
        var res, derivedIds, apiIds, merged, err_4;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!casId || casId === CAS_NONE_ID)
                        return [2 /*return*/];
                    if (casLoadingMap[casId])
                        return [2 /*return*/];
                    casLoadingMap[casId] = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.getCasContent(eqpId.value, casId)];
                case 2:
                    res = _b.sent();
                    casTableMap[casId] = res.slots.map(function (x) { return ({ slot: x.slot, jobId: x.jobId, jobName: x.jobName, recipeName: x.recipeName }); });
                    derivedIds = extractJobIdsFromCasRows(res.slots.map(function (x) { return ({ jobId: x.jobId, jobName: x.jobName }); }));
                    apiIds = ((_a = res.jobIds) !== null && _a !== void 0 ? _a : []).filter(function (id) { return jobsData.value.find(function (j) { return j.id === id; }); });
                    merged = Array.from(new Set(__spreadArray(__spreadArray([], apiIds, true), derivedIds, true)));
                    casToJobs.value[casId] = merged;
                    if (selectedCas.size === 1 && selectedCas.has(casId)) {
                        applyCasToJobsFromSelection();
                        syncJobSelectionFromCasRows(res.slots.map(function (x) { return ({ jobId: x.jobId, jobName: x.jobName }); }));
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _b.sent();
                    console.error('fetchCasContent failed:', err_4);
                    return [3 /*break*/, 4];
                case 4:
                    compress_output_matrix;
                    try {
                    }
                    finally {
                        casLoadingMap[casId] = false;
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function fetchJobContent(jobId) {
    return __awaiter(this, void 0, void 0, function () {
        var res_2, job, baseRecipePool, actualRecipe, err_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!jobId || jobId === JOB_NONE_ID)
                        return [2 /*return*/];
                    if (jobLoadingMap[jobId])
                        return [2 /*return*/];
                    jobLoadingMap[jobId] = true;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.getJobContent(eqpId.value, jobId)];
                case 2:
                    res_2 = _c.sent();
                    jobParsedMap[jobId] = deepClone(res_2.parsed);
                    return [4 /*yield*/, refreshJobMissingRecipeMap(jobId)];
                case 3:
                    _c.sent();
                    job = jobsData.value.find(function (j) { return j.id === jobId; });
                    if (job) {
                        baseRecipePool = __spreadArray([NONE_RECIPE], (((_a = recipeSourceCache.recipe) !== null && _a !== void 0 ? _a : recipesData.value).filter(function (r) { return r.id !== 'R_NONE'; })), true);
                        actualRecipe = (_b = baseRecipePool.find(function (r) { return r.name === res_2.baseRecipeName && r.id !== 'R_NONE'; })) !== null && _b !== void 0 ? _b : null;
                        job.recipe = actualRecipe !== null && actualRecipe !== void 0 ? actualRecipe : createPlaceholderRecipe("BASE_".concat(jobId), res_2.baseRecipeName || job.recipe.name, 'Base recipe summary', '', 'recipe');
                    }
                    return [3 /*break*/, 6];
                case 4:
                    err_5 = _c.sent();
                    console.error('fetchJobContent failed:', err_5);
                    return [3 /*break*/, 6];
                case 5:
                    jobLoadingMap[jobId] = false;
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
var casEditMode = (0, vue_1.ref)(false);
var selectedSlotCells = (0, vue_1.reactive)(new Set());
var casAnchorSlot = (0, vue_1.ref)(null);
function clearCasCellSelection() {
    selectedSlotCells.clear();
    casAnchorSlot.value = null;
}
function selectJobNameColumn() {
    if (!casEditMode.value)
        return;
    selectedSlotCells.clear();
    for (var s = 1; s <= 24; s++)
        selectedSlotCells.add(s);
    casAnchorSlot.value = 1;
}
function onCasTableHeaderClick(idx) {
    if (idx === 1) {
        selectJobNameColumn();
    }
}
var jobListAttention = (0, vue_1.ref)(false);
var jobAttentionTimer = null;
function triggerJobListAttention() {
    clearTimeout(jobAttentionTimer);
    jobListAttention.value = false;
    requestAnimationFrame(function () {
        jobListAttention.value = true;
        jobAttentionTimer = setTimeout(function () {
            jobListAttention.value = false;
        }, 900);
    });
}
function onCasCellClick(slot, jobName, e) {
    var _a;
    if (!casEditMode.value) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;
    if (!ctrl && !shift) {
        selectedSlotCells.clear();
        selectedSlotCells.add(slot);
        casAnchorSlot.value = slot;
    }
    else if (ctrl) {
        selectedSlotCells.has(slot) ? selectedSlotCells.delete(slot) : selectedSlotCells.add(slot);
        casAnchorSlot.value = slot;
    }
    else {
        var anchor = (_a = casAnchorSlot.value) !== null && _a !== void 0 ? _a : slot;
        var a = Math.min(anchor, slot), b = Math.max(anchor, slot);
        selectedSlotCells.clear();
        for (var s = a; s <= b; s++)
            selectedSlotCells.add(s);
    }
    triggerJobListAttention();
}
var casBaseline = (0, vue_1.reactive)({});
function snapshotCasBaseline(casId) {
    var _a;
    casBaseline[casId] = JSON.stringify((_a = casTableMap[casId]) !== null && _a !== void 0 ? _a : []);
}
function casDirty(casId) {
    var _a, _b;
    var cur = JSON.stringify((_a = casTableMap[casId]) !== null && _a !== void 0 ? _a : []);
    var base = (_b = casBaseline[casId]) !== null && _b !== void 0 ? _b : '[]';
    return cur !== base;
}
function revertCas(casId) {
    var base = casBaseline[casId];
    if (!base)
        return;
    casTableMap[casId] = JSON.parse(base);
}
function applyJobToSelectedSlots(jobId) {
    var _a;
    var casId = casSelectedSingle.value;
    if (!casId || !casEditMode.value || selectedSlotCells.size === 0)
        return;
    var rows = (_a = casTableMap[casId]) !== null && _a !== void 0 ? _a : [];
    var job = jobsData.value.find(function (j) { return j.id === jobId; });
    var jobName = job ? displayJobName(job.jobName) : NONE_LABEL;
    var recipeName = job ? job.recipe.name : '';
    var _loop_3 = function (slot) {
        var r = rows.find(function (x) { return x.slot === slot; });
        if (!r)
            return "continue";
        r.jobId = jobId;
        r.jobName = jobName;
        r.recipeName = recipeName;
    };
    for (var _i = 0, selectedSlotCells_1 = selectedSlotCells; _i < selectedSlotCells_1.length; _i++) {
        var slot = selectedSlotCells_1[_i];
        _loop_3(slot);
    }
}
var jobEditMode = (0, vue_1.ref)(false);
var jobConfigMap = (0, vue_1.reactive)({});
var jobBaseline = (0, vue_1.reactive)({});
function ensureJobConfig(jobId) {
    var _a, _b;
    if (!jobId || jobConfigMap[jobId])
        return;
    var base = jobsData.value.find(function (j) { return j.id === jobId; });
    var baseName = (_b = (_a = base === null || base === void 0 ? void 0 : base.recipe) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : NONE_LABEL;
    jobConfigMap[jobId] = { p1: baseName, p2: baseName, p3: baseName, piPre: 'NONE', piPost: 'DATA', unloadModule: 'DATA' };
}
function snapshotJobBaseline(jobId) {
    var _a;
    jobBaseline[jobId] = JSON.stringify((_a = jobParsedMap[jobId]) !== null && _a !== void 0 ? _a : {});
}
function jobDirty(jobId) {
    var _a, _b;
    var cur = JSON.stringify((_a = jobParsedMap[jobId]) !== null && _a !== void 0 ? _a : {});
    var base = (_b = jobBaseline[jobId]) !== null && _b !== void 0 ? _b : '{}';
    return cur !== base;
}
var __VLS_exposed = { stopRecipeResize: stopRecipeResize, onRecipeResizeMove: onRecipeResizeMove, stopListResize: stopListResize, onListResizeMove: onListResizeMove };
;
defineExpose();
__VLS_exposed;
function revertJob(jobId) {
    var base = jobBaseline[jobId];
    if (!base)
        return;
    jobParsedMap[jobId] = JSON.parse(base);
}
function jobPlatenRecipeName(p) {
    var _a, _b, _c;
    var jobId = (_a = selectedJobSingleReal.value) === null || _a === void 0 ? void 0 : _a.id;
    if (!jobId)
        return '';
    var parsed = jobParsedMap[jobId];
    if (!((_c = (_b = parsed === null || parsed === void 0 ? void 0 : parsed.polisher) === null || _b === void 0 ? void 0 : _b.rows) === null || _c === void 0 ? void 0 : _c.length))
        return '';
    var row = parsed.polisher.rows.find(function (x) { return x.label === 'Polish Recipe'; });
    if (!row)
        return '';
    return p === 1 ? row.p1 : p === 2 ? row.p2 : row.p3;
}
var recipePanelOpen = (0, vue_1.ref)(false);
var activePlaten = (0, vue_1.ref)(1);
var recipeEditMode = (0, vue_1.ref)(false);
var recipeFind = (0, vue_1.ref)('');
var recipeFindState = (0, vue_1.ref)('idle');
var recipeFindModel = (0, vue_1.computed)({
    get: function () { return recipeFind.value; },
    set: function (v) { recipeFind.value = v; }
});
var recipeFindClass = (0, vue_1.computed)(function () { return recipeFindState.value === 'ok' ? 'find-ok' : recipeFindState.value === 'bad' ? 'find-bad' : ''; });
var selectedRecipeSingle = (0, vue_1.computed)(function () {
    var _a;
    if (selectedRecipes.size !== 1)
        return null;
    var id = Array.from(selectedRecipes)[0];
    if (id === 'R_NONE')
        return null;
    return (_a = allRecipes.value.find(function (r) { return r.id === id; })) !== null && _a !== void 0 ? _a : null;
});
function closeRecipePanel() {
    recipePanelOpen.value = false;
    recipeEditMode.value = false;
    recipePanelTitleBase.value = 'Recipe';
    recipePanelEmphasizeText.value = '';
    selectedRecipes.clear();
    selectedRecipes.add('R_NONE');
    lastRecipe.value = 'R_NONE';
    setRecipeFindProgram('');
    recipeFindState.value = 'idle';
    if (recipeSourceCache.recipe) {
        setActiveRecipeSource('recipe', recipeSourceCache.recipe);
    }
}
function captureReloadRestoreSpec(overrides) {
    var currentPreviewName = (function () {
        var _a;
        var previewIdNow = previewJobId.value || lastJob.value;
        var job = jobsData.value.find(function (j) { return j.id === previewIdNow; });
        return (_a = job === null || job === void 0 ? void 0 : job.jobName) !== null && _a !== void 0 ? _a : '';
    })();
    return __assign({ casNames: Array.from(selectedCas).filter(Boolean), jobNames: Array.from(selectedJobs).map(function (id) { var _a, _b; return (_b = (_a = jobsData.value.find(function (j) { return j.id === id; })) === null || _a === void 0 ? void 0 : _a.jobName) !== null && _b !== void 0 ? _b : id; }).filter(Boolean), recipeNames: Array.from(selectedRecipes).map(function (id) {
            var _a, _b;
            var recipe = allRecipes.value.find(function (r) { return r.id === id; });
            return { name: (_a = recipe === null || recipe === void 0 ? void 0 : recipe.name) !== null && _a !== void 0 ? _a : '', sourceKind: ((_b = recipe === null || recipe === void 0 ? void 0 : recipe.sourceKind) !== null && _b !== void 0 ? _b : activeRecipeSourceKind.value) };
        }).filter(function (x) { return x.name; }), keepRecipePanel: recipePanelOpen.value, activePane: activePane.value, keyboardMode: keyboardControlMode.value, previewJobName: currentPreviewName }, overrides);
}
function reloadAndRestoreSelections(spec) {
    return __awaiter(this, void 0, void 0, function () {
        var _loop_4, _i, _a, name_1, casId, _loop_5, _b, _c, name_2, previewJob, _loop_6, _d, _e, token, previewJobIdAfterReload, recipeId;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, load(spec.keepRecipePanel)];
                case 1:
                    _f.sent();
                    selectedCas.clear();
                    _loop_4 = function (name_1) {
                        if (casData.value.some(function (item) { return item.name === name_1; }))
                            selectedCas.add(name_1);
                    };
                    for (_i = 0, _a = spec.casNames; _i < _a.length; _i++) {
                        name_1 = _a[_i];
                        _loop_4(name_1);
                    }
                    lastCas.value = selectedCas.size ? Array.from(selectedCas)[selectedCas.size - 1] || '' : '';
                    if (!(selectedCas.size === 1)) return [3 /*break*/, 3];
                    casId = Array.from(selectedCas)[0];
                    if (!casId) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetchCasContent(casId)];
                case 2:
                    _f.sent();
                    _f.label = 3;
                case 3:
                    selectedJobs.clear();
                    _loop_5 = function (name_2) {
                        var found = jobsData.value.find(function (item) { return item.jobName === name_2; });
                        if (found)
                            selectedJobs.add(found.id);
                    };
                    for (_b = 0, _c = spec.jobNames; _b < _c.length; _b++) {
                        name_2 = _c[_b];
                        _loop_5(name_2);
                    }
                    previewJob = spec.previewJobName ? jobsData.value.find(function (item) { return item.jobName === spec.previewJobName; }) : null;
                    if (previewJob && selectedJobs.has(previewJob.id)) {
                        lastJob.value = previewJob.id;
                    }
                    else {
                        lastJob.value = selectedJobs.size ? Array.from(selectedJobs)[selectedJobs.size - 1] || '' : '';
                    }
                    selectedRecipes.clear();
                    _loop_6 = function (token) {
                        var found = allRecipes.value.find(function (item) { var _a; return ((_a = item.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value) === token.sourceKind && String(item.name || '') === String(token.name || ''); });
                        if (found)
                            selectedRecipes.add(found.id);
                    };
                    for (_d = 0, _e = spec.recipeNames; _d < _e.length; _d++) {
                        token = _e[_d];
                        _loop_6(token);
                    }
                    if (!selectedRecipes.size)
                        selectedRecipes.add('R_NONE');
                    lastRecipe.value = Array.from(selectedRecipes)[selectedRecipes.size - 1] || 'R_NONE';
                    previewJobIdAfterReload = lastJob.value && selectedJobs.has(lastJob.value) ? lastJob.value : (selectedJobs.size ? Array.from(selectedJobs)[selectedJobs.size - 1] || '' : '');
                    if (!(previewJobIdAfterReload && previewJobIdAfterReload !== JOB_NONE_ID)) return [3 /*break*/, 5];
                    return [4 /*yield*/, fetchJobContent(previewJobIdAfterReload)];
                case 4:
                    _f.sent();
                    _f.label = 5;
                case 5:
                    if (!(spec.keepRecipePanel && selectedRecipes.size === 1)) return [3 /*break*/, 9];
                    recipeId = Array.from(selectedRecipes)[0];
                    if (!(recipeId && recipeId !== 'R_NONE')) return [3 /*break*/, 9];
                    return [4 /*yield*/, ensureRecipeDetailById(recipeId)];
                case 6:
                    _f.sent();
                    return [4 /*yield*/, (0, vue_1.nextTick)()];
                case 7:
                    _f.sent();
                    return [4 /*yield*/, scrollIntoView(recipeRefs, recipeId)];
                case 8:
                    _f.sent();
                    _f.label = 9;
                case 9:
                    activePane.value = spec.activePane;
                    keyboardControlMode.value = spec.keyboardMode;
                    return [2 /*return*/];
            }
        });
    });
}
var suppressOutsideCloseUntil = 0;
function openRecipePanelWithRecipe(recipe_1) {
    return __awaiter(this, arguments, void 0, function (recipe, platen, titleBase, emphasizeText) {
        var recipeSourceKind, preferred, found;
        var _a, _b, _c, _d;
        if (platen === void 0) { platen = 1; }
        if (titleBase === void 0) { titleBase = 'Recipe'; }
        if (emphasizeText === void 0) { emphasizeText = ''; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    activePlaten.value = platen;
                    recipePanelTitleBase.value = titleBase || 'Recipe';
                    recipePanelEmphasizeText.value = emphasizeText || '';
                    recipePanelOpen.value = true;
                    recipeEditMode.value = false;
                    activateArea('recipeArea', 'recipe');
                    recipeSourceKind = (_a = recipe.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value;
                    preferred = isTempSourceRecipeId(recipe.id) ? ((_b = findLoadedSourceRecipeByName(recipe.name, recipeSourceKind)) !== null && _b !== void 0 ? _b : recipe) : recipe;
                    found = (_c = allRecipes.value.find(function (r) { var _a; return r.id === preferred.id || (((_a = r.sourceKind) !== null && _a !== void 0 ? _a : recipeSourceKind) === recipeSourceKind && recipeDisplayNameEquals(r.name, preferred.name, recipeSourceKind)); })) !== null && _c !== void 0 ? _c : preferred;
                    selectedRecipes.clear();
                    selectedRecipes.add(found.id);
                    lastRecipe.value = found.id;
                    recipeCursorIdx.value = allRecipes.value.findIndex(function (r) { return r.id === found.id; });
                    setRecipeFindProgram(displayRecipeName(found.name, (_d = found.sourceKind) !== null && _d !== void 0 ? _d : activeRecipeSourceKind.value));
                    recipeFindState.value = 'ok';
                    return [4 /*yield*/, ensureRecipeDetailById(found.id)];
                case 1:
                    _e.sent();
                    return [4 /*yield*/, (0, vue_1.nextTick)()];
                case 2:
                    _e.sent();
                    return [4 /*yield*/, scrollIntoView(recipeRefs, lastRecipe.value || found.id)];
                case 3:
                    _e.sent();
                    return [4 /*yield*/, ensureRecipePanelVisibleOnOpen()];
                case 4:
                    _e.sent();
                    suppressOutsideCloseUntil = Date.now() + 350;
                    return [2 /*return*/];
            }
        });
    });
}
var recipePicker = (0, vue_1.reactive)({
    open: false,
    query: '',
    jobId: '',
    platen: 1,
    previewId: ''
});
var recipePickerTarget = (0, vue_1.ref)(null);
var recipePickerSourceKind = (0, vue_1.ref)('polishRecipe');
var recipePickerProgram = (0, vue_1.ref)(false);
var recipePickerState = (0, vue_1.ref)('idle');
var recipePickerHint = (0, vue_1.ref)('');
var recipePickerQueryModel = (0, vue_1.computed)({
    get: function () { return recipePicker.query; },
    set: function (v) { recipePicker.query = v; }
});
function openRecipePickerForPayload(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var jobId, currentName, current, resolvedCurrent;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    jobId = (_a = selectedJobSingleReal.value) === null || _a === void 0 ? void 0 : _a.id;
                    if (!jobId)
                        return [2 /*return*/];
                    recipePickerTarget.value = payload;
                    recipePickerSourceKind.value = payload.sourceKind;
                    recipePickerTitleBase.value = payload.titleBase || 'Recipe';
                    recipePickerEmphasizeText.value = (_b = payload.emphasizeText) !== null && _b !== void 0 ? _b : '';
                    recipePickerListMode.value = recipeListMode.value;
                    return [4 /*yield*/, ensureRecipeSourceLoaded(payload.sourceKind)];
                case 1:
                    _e.sent();
                    recipePicker.open = true;
                    recipePicker.query = '';
                    recipePicker.jobId = jobId;
                    recipePicker.platen = (_c = payload.platen) !== null && _c !== void 0 ? _c : 1;
                    recipePickerState.value = 'idle';
                    recipePickerHint.value = '';
                    currentName = payload.value || (payload.platen ? jobPlatenRecipeName(payload.platen) : '');
                    current = ensureRecipeByName(currentName || NONE_LABEL, payload.sourceKind);
                    resolvedCurrent = isTempSourceRecipeId(current.id) ? ((_d = findLoadedSourceRecipeByName(current.name, payload.sourceKind)) !== null && _d !== void 0 ? _d : current) : current;
                    recipePicker.previewId = resolvedCurrent.id;
                    recipePickerAnchorIdx.value = filteredRecipePickerList.value.findIndex(function (r) { return r.id === resolvedCurrent.id; });
                    (0, vue_1.nextTick)(function () { return scrollIntoView(recipePickerRefs, resolvedCurrent.id); });
                    void ensureRecipeDetailById(resolvedCurrent.id);
                    return [2 /*return*/];
            }
        });
    });
}
var activeRecipePickerPool = (0, vue_1.computed)(function () {
    var _a;
    var sourceItems = (_a = recipeSourceCache[recipePickerSourceKind.value]) !== null && _a !== void 0 ? _a : recipesData.value;
    return __spreadArray([NONE_RECIPE], __spreadArray([], sourceItems, true).sort(function (a, b) { return naturalCompare(a.name, b.name); }), true);
});
var filteredRecipePickerList = (0, vue_1.computed)(function () {
    var q = normalizeSearchValue(recipePicker.query);
    var pool = activeRecipePickerPool.value;
    if (!q)
        return pool;
    return pool.filter(function (r) { return normalizeSearchValue(displayRecipeName(r.name, recipePickerSourceKind.value)).includes(q); });
});
var previewRecipe = (0, vue_1.computed)(function () { var _a; return (_a = activeRecipePickerPool.value.find(function (r) { return r.id === recipePicker.previewId; })) !== null && _a !== void 0 ? _a : null; });
var recipePickerCols = (0, vue_1.computed)(function () {
    var arr = filteredRecipePickerList.value;
    var out = [];
    for (var i = 0; i < arr.length; i += RECIPE_PER_COL)
        out.push(arr.slice(i, i + RECIPE_PER_COL));
    return out;
});
(0, vue_1.watch)(filteredRecipePickerList, function (list) {
    if (!recipePicker.open)
        return;
    if (list.length && !list.find(function (x) { return x.id === recipePicker.previewId; })) {
        recipePicker.previewId = list[0].id;
        recipePickerAnchorIdx.value = 0;
        scrollIntoView(recipePickerRefs, list[0].id);
        void ensureRecipeDetailById(list[0].id);
    }
});
(0, vue_1.watch)(function () { return recipePicker.query; }, function () {
    if (!recipePicker.open || recipePickerProgram.value || hasComma(recipePicker.query))
        return;
    clearTimeout(tRecipePicker);
    if (!recipePicker.query.trim()) {
        recipePickerState.value = 'idle';
        recipePickerHint.value = '';
        return;
    }
    tRecipePicker = setTimeout(function () { return applyRecipePickerFind(false); }, 160);
});
function onRecipePickerItemClick(id) {
    recipePicker.previewId = id;
    recipePickerAnchorIdx.value = filteredRecipePickerList.value.findIndex(function (r) { return r.id === id; });
    void ensureRecipeDetailById(id);
}
function jobStoredRecipeValue(recipe, sourceKind) {
    if (!recipe || recipe.id === 'R_NONE')
        return NONE_LABEL;
    var rawName = String(recipe.name || '').trim();
    if (!rawName)
        return NONE_LABEL;
    if (sourceKind === 'isrmAlgorithm' || sourceKind === 'rtpcRecipe')
        return rawName;
    return displayRecipeName(rawName, sourceKind) || NONE_LABEL;
}
function applyRecipePickerFind(_byButton) {
    var _a;
    var raw = recipePicker.query;
    var q = normalizeSearchValue(raw);
    var list = activeRecipePickerPool.value;
    if (!q || !list.length)
        return;
    var matches = list.filter(function (r) { var _a; return normalizeSearchValue(displayRecipeName(r.name, (_a = r.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value)).includes(q); });
    if (!matches.length) {
        recipePickerState.value = 'bad';
        recipePickerHint.value = '검색 결과 없음';
        return;
    }
    var best = (_a = matches.find(function (r) { return normalizeSearchValue(displayRecipeName(r.name, recipePickerSourceKind.value)) === q; })) !== null && _a !== void 0 ? _a : matches[0];
    recipePicker.previewId = best.id;
    recipePickerAnchorIdx.value = filteredRecipePickerList.value.findIndex(function (r) { return r.id === best.id; });
    scrollIntoView(recipePickerRefs, best.id);
    void ensureRecipeDetailById(best.id);
    recipePickerState.value = 'ok';
    recipePickerHint.value = '';
    if (normalizeSearchValue(displayRecipeName(best.name, recipePickerSourceKind.value)) === q) {
        recipePickerProgram.value = true;
        recipePicker.query = displayRecipeName(best.name, recipePickerSourceKind.value);
        recipePickerProgram.value = false;
    }
}
function pickRecipeForJob(r) {
    var _a, _b, _c, _d;
    if (!r)
        return;
    var jobId = recipePicker.jobId;
    ensureJobConfig(jobId);
    var parsed = jobParsedMap[jobId];
    var target = recipePickerTarget.value;
    if (!parsed || !target)
        return;
    var polisherLabelMap = { polishRecipe: 'Polish Recipe', conditionRecipe: 'Condition Recipe', exSituCondition: 'Ex Situ Condition', specialExSitu: 'Special Ex Situ', isrmAlgorithm: 'ISRM Algorithm', rtpcRecipe: 'RTPC Recipe' };
    var cleanerKindMap = { megasonics: 'Megasonics', brush1: 'Brush 1', brush2: 'Brush 2', vaporDryer: 'Vapor Dryer' };
    if (target.sourceKind in polisherLabelMap) {
        var row = (_b = (_a = parsed === null || parsed === void 0 ? void 0 : parsed.polisher) === null || _a === void 0 ? void 0 : _a.rows) === null || _b === void 0 ? void 0 : _b.find(function (x) { return x.label === polisherLabelMap[target.sourceKind]; });
        if (row) {
            var nextValue = jobStoredRecipeValue(r, target.sourceKind);
            if (recipePicker.platen === 1)
                row.p1 = nextValue;
            if (recipePicker.platen === 2)
                row.p2 = nextValue;
            if (recipePicker.platen === 3)
                row.p3 = nextValue;
        }
    }
    else if (target.sourceKind === 'hcluPostLoad') {
        parsed.hcluRecipes = parsed.hcluRecipes || { postLoad: NONE_LABEL, preUnload: NONE_LABEL };
        parsed.hcluRecipes.postLoad = jobStoredRecipeValue(r, target.sourceKind);
    }
    else if (target.sourceKind === 'hcluPreUnload') {
        parsed.hcluRecipes = parsed.hcluRecipes || { postLoad: NONE_LABEL, preUnload: NONE_LABEL };
        parsed.hcluRecipes.preUnload = jobStoredRecipeValue(r, target.sourceKind);
    }
    else if (target.sourceKind === 'recipe' && /Pre-Metrology/i.test(target.titleBase)) {
        parsed.preMetrology.recipe = jobStoredRecipeValue(r, target.sourceKind);
    }
    else if (target.sourceKind === 'recipe' && /Post-Metrology/i.test(target.titleBase)) {
        parsed.postMetrology.recipe = jobStoredRecipeValue(r, target.sourceKind);
    }
    else if (target.sourceKind in cleanerKindMap) {
        var wanted_1 = cleanerKindMap[target.sourceKind];
        var row = (_d = (_c = parsed === null || parsed === void 0 ? void 0 : parsed.cleaner) === null || _c === void 0 ? void 0 : _c.rows) === null || _d === void 0 ? void 0 : _d.find(function (x, idx) { return cleanerModuleLabelForRow(x, idx) === wanted_1; });
        if (row)
            row.recipe = jobStoredRecipeValue(r, target.sourceKind);
    }
    recipePicker.open = false;
    recipePickerTarget.value = null;
}
function closeRecipePicker() {
    recipePicker.open = false;
    recipePickerTitleBase.value = 'Recipe';
    recipePickerEmphasizeText.value = '';
    recipePickerTarget.value = null;
}
function onCasListMenu(event) { openListMenu('cas', event); }
function onJobListMenu(event) { openListMenu('job', event); }
function onRecipeListMenu(event) { openListMenu('recipe', event); }
function onCasContentMenu(event) { openContentMenu('casContent', event); }
function onJobContentMenu(event) { openContentMenu('jobContent', event); }
function onCasSortToggle(key) { toggleSort(casSortKey, casSortDir, key); }
function onJobSortToggle(key) { toggleSort(jobSortKey, jobSortDir, key); }
function onCasListResize(payload) { startListResize('cas', payload.colKey, payload.event); }
function onJobListResize(payload) { startListResize('job', payload.colKey, payload.event); }
function onCasListItemClick(payload) { onCasClick(payload.id, payload.event); }
function onJobListItemClick(payload) { onJobClick(payload.id, payload.event); }
function onRecipePanelPick(payload) { onRecipePick(payload.recipeId, payload.event); }
function onCasContentCellClick(payload) { onCasCellClick(payload.slot, payload.jobName, payload.event); }
function onCasContentResize(payload) { startResize('cas', payload.index, payload.event); }
function onJobParsedToggleFlag(payload) { toggleJobParsedFlag(payload.section, payload.key, payload.checked); }
var casQuery = (0, vue_1.ref)('');
var jobQuery = (0, vue_1.ref)('');
var casState = (0, vue_1.ref)('idle');
var jobState = (0, vue_1.ref)('idle');
var casHint = (0, vue_1.ref)('');
var jobHint = (0, vue_1.ref)('');
var casProgram = (0, vue_1.ref)(false);
var jobProgram = (0, vue_1.ref)(false);
var recipeProgram = (0, vue_1.ref)(false);
var casQueryModel = (0, vue_1.computed)({
    get: function () { return casQuery.value; },
    set: function (v) { casQuery.value = v; }
});
var jobQueryModel = (0, vue_1.computed)({
    get: function () { return jobQuery.value; },
    set: function (v) { jobQuery.value = v; }
});
var casClass = (0, vue_1.computed)(function () { return casState.value === 'ok' ? 'find-ok' : casState.value === 'bad' ? 'find-bad' : ''; });
var jobClass = (0, vue_1.computed)(function () { return jobState.value === 'ok' ? 'find-ok' : jobState.value === 'bad' ? 'find-bad' : ''; });
var skipCasWatch = false;
var skipJobWatch = false;
var skipRecipeWatch = false;
function setCasQueryProgram(v) { skipCasWatch = true; casQuery.value = v; }
function setJobQueryProgram(v) { skipJobWatch = true; jobQuery.value = v; }
function setRecipeFindProgram(v) { skipRecipeWatch = true; recipeFind.value = v; }
function joinSelectedJobsStr() { return jobsData.value.filter(function (j) { return selectedJobs.has(j.id); }).map(function (j) { return displayJobName(j.jobName); }).sort(naturalCompare).join(', '); }
function joinSelectedCasStr() { return Array.from(selectedCas).slice().map(displayCasName).sort(naturalCompare).join(', '); }
function joinSelectedRecipesStr() { return allRecipes.value.filter(function (r) { return selectedRecipes.has(r.id); }).map(function (r) { var _a; return displayRecipeName(r.name, (_a = r.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value); }).sort(naturalCompare).join(', '); }
function applyCasToJobsFromSelection() {
    var _a;
    var jobSet = new Set();
    for (var _i = 0, selectedCas_1 = selectedCas; _i < selectedCas_1.length; _i++) {
        var cas = selectedCas_1[_i];
        var ids_3 = (_a = casToJobs.value[cas]) !== null && _a !== void 0 ? _a : [];
        var _loop_7 = function (id) {
            if (jobsData.value.find(function (j) { return j.id === id; }))
                jobSet.add(id);
        };
        for (var _b = 0, ids_1 = ids_3; _b < ids_1.length; _b++) {
            var id = ids_1[_b];
            _loop_7(id);
        }
    }
    selectedJobs.clear();
    if (jobSet.size === 0) {
        selectedJobs.add(JOB_NONE_ID);
        lastJob.value = JOB_NONE_ID;
        jobAnchorIdx.value = jobDisplayItems.value.findIndex(function (j) { return j.id === JOB_NONE_ID; });
        jobCursorIdx.value = jobAnchorIdx.value;
        setJobQueryProgram(NONE_LABEL);
        return;
    }
    var ids = Array.from(jobSet);
    for (var _c = 0, ids_2 = ids; _c < ids_2.length; _c++) {
        var id = ids_2[_c];
        selectedJobs.add(id);
    }
    lastJob.value = ids[0];
    jobAnchorIdx.value = jobDisplayItems.value.findIndex(function (j) { return j.id === ids[0]; });
    jobCursorIdx.value = jobAnchorIdx.value;
    setJobQueryProgram(joinSelectedJobsStr());
    void scrollIntoView(jobRefs, ids[0]);
    if (ids.length === 1) {
        void fetchJobContent(ids[0]);
    }
}
function selectRangeString(set, list, a, b) {
    set.clear();
    var lo = Math.min(a, b), hi = Math.max(a, b);
    for (var i = lo; i <= hi; i++)
        set.add(list[i]);
}
function selectRangeJob(set, list, a, b) {
    set.clear();
    var lo = Math.min(a, b), hi = Math.max(a, b);
    for (var i = lo; i <= hi; i++)
        set.add(list[i].id);
}
function selectRangeRecipe(set, list, a, b) {
    set.clear();
    var lo = Math.min(a, b), hi = Math.max(a, b);
    for (var i = lo; i <= hi; i++)
        set.add(list[i].id);
}
function getVisibleIndex(ids, selectedSet, lastId, cursorIdx) {
    if (cursorIdx !== null && cursorIdx >= 0 && cursorIdx < ids.length)
        return cursorIdx;
    var selectedIdx = ids.findIndex(function (id) { return selectedSet.has(id); });
    if (selectedIdx >= 0)
        return selectedIdx;
    var lastIdx = ids.indexOf(lastId);
    if (lastIdx >= 0)
        return lastIdx;
    return 0;
}
function onCasClick(casId, e) {
    activateArea('casList', 'cas');
    lastCas.value = casId;
    if (casId === CAS_NONE_ID) {
        selectedCas.clear();
        selectedCas.add(CAS_NONE_ID);
        casCursorIdx.value = casDisplayItems.value.findIndex(function (x) { return x.name === CAS_NONE_ID; });
        casAnchorIdx.value = casCursorIdx.value;
        setCasQueryProgram(NONE_LABEL);
        casState.value = 'ok';
        casHint.value = '';
        selectedJobs.clear();
        selectedJobs.add(JOB_NONE_ID);
        setJobQueryProgram(NONE_LABEL);
        jobCursorIdx.value = jobDisplayItems.value.findIndex(function (j) { return j.id === JOB_NONE_ID; });
        jobAnchorIdx.value = jobCursorIdx.value;
        activePane.value = 'casList';
        return;
    }
    if (casEditMode.value) {
        casEditMode.value = false;
        clearCasCellSelection();
    }
    var list = casDisplayItems.value.map(function (x) { return x.name; });
    var idx = list.indexOf(casId);
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;
    if (shift && casAnchorIdx.value !== null) {
        selectRangeString(selectedCas, list, casAnchorIdx.value, idx);
    }
    else if (ctrl) {
        if (selectedCas.has(casId))
            selectedCas.delete(casId);
        else
            selectedCas.add(casId);
        casAnchorIdx.value = idx;
    }
    else {
        selectedCas.clear();
        selectedCas.add(casId);
        casAnchorIdx.value = idx;
    }
    casCursorIdx.value = idx;
    setCasQueryProgram(selectedCas.size === 1 ? displayCasName(Array.from(selectedCas)[0]) : joinSelectedCasStr());
    casState.value = 'ok';
    casHint.value = '';
    scrollIntoView(casRefs, casId);
    applyCasToJobsFromSelection();
    if (selectedCas.size === 1) {
        activePane.value = 'casContent';
        void fetchCasContent(Array.from(selectedCas)[0]);
    }
}
function onJobClick(jobId, e) {
    var _a, _b, _c, _d;
    activateArea('jobList', 'job');
    lastJob.value = jobId;
    if (jobId === JOB_NONE_ID) {
        selectedJobs.clear();
        selectedJobs.add(JOB_NONE_ID);
        var noneIdx = jobDisplayItems.value.findIndex(function (j) { return j.id === JOB_NONE_ID; });
        jobCursorIdx.value = noneIdx;
        jobAnchorIdx.value = noneIdx;
        setJobQueryProgram(NONE_LABEL);
        jobState.value = 'ok';
        jobHint.value = '';
        activePane.value = 'jobList';
        return;
    }
    var list = jobDisplayItems.value;
    var idx = list.findIndex(function (j) { return j.id === jobId; });
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;
    if (casEditMode.value && selectedSlotCells.size > 0) {
        selectedJobs.clear();
        selectedJobs.add(jobId);
        setJobQueryProgram(displayJobName((_b = (_a = list.find(function (j) { return j.id === jobId; })) === null || _a === void 0 ? void 0 : _a.jobName) !== null && _b !== void 0 ? _b : ''));
        applyJobToSelectedSlots(jobId);
        scrollIntoView(jobRefs, jobId);
        jobListAttention.value = false;
        return;
    }
    if (shift && jobAnchorIdx.value !== null) {
        selectRangeJob(selectedJobs, list, jobAnchorIdx.value, idx);
    }
    else if (ctrl) {
        if (selectedJobs.has(jobId))
            selectedJobs.delete(jobId);
        else
            selectedJobs.add(jobId);
        jobAnchorIdx.value = idx;
    }
    else {
        selectedJobs.clear();
        selectedJobs.add(jobId);
        jobAnchorIdx.value = idx;
    }
    jobCursorIdx.value = idx;
    setJobQueryProgram(selectedJobs.size === 1 ? displayJobName((_d = (_c = list.find(function (j) { return j.id === Array.from(selectedJobs)[0]; })) === null || _c === void 0 ? void 0 : _c.jobName) !== null && _d !== void 0 ? _d : '') : jobsData.value.filter(function (j) { return selectedJobs.has(j.id); }).map(function (j) { return displayJobName(j.jobName); }).sort(naturalCompare).join(', '));
    jobState.value = 'ok';
    jobHint.value = '';
    scrollIntoView(jobRefs, jobId);
    if (selectedJobs.size === 1) {
        activePane.value = 'jobList';
        void fetchJobContent(Array.from(selectedJobs)[0]);
    }
}
function onRecipePick(recipeId, e) {
    var _a, _b, _c, _d;
    activateArea('recipeArea', 'recipe');
    lastRecipe.value = recipeId;
    var list = allRecipes.value;
    var idx = list.findIndex(function (r) { return r.id === recipeId; });
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;
    if (shift && recipeAnchorIdx.value !== null) {
        selectRangeRecipe(selectedRecipes, list, recipeAnchorIdx.value, idx);
    }
    else if (ctrl) {
        if (selectedRecipes.has(recipeId))
            selectedRecipes.delete(recipeId);
        else
            selectedRecipes.add(recipeId);
        if (selectedRecipes.size === 0)
            selectedRecipes.add('R_NONE');
        recipeAnchorIdx.value = idx;
    }
    else {
        selectedRecipes.clear();
        selectedRecipes.add(recipeId);
        recipeAnchorIdx.value = idx;
    }
    recipeCursorIdx.value = idx;
    setRecipeFindProgram(selectedRecipes.size === 1 ? displayRecipeName((_b = (_a = list.find(function (r) { return r.id === Array.from(selectedRecipes)[0]; })) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '', (_d = (_c = list.find(function (r) { return r.id === Array.from(selectedRecipes)[0]; })) === null || _c === void 0 ? void 0 : _c.sourceKind) !== null && _d !== void 0 ? _d : activeRecipeSourceKind.value) : joinSelectedRecipesStr());
    scrollIntoView(recipeRefs, recipeId);
    void ensureRecipeDetailById(recipeId);
}
function applyCasSearch(_byButton) {
    var _a;
    var raw = casQuery.value;
    var q = normalizeSearchValue(raw);
    var list = casDisplayItems.value;
    if (!q || !list.length)
        return;
    var matches = list.filter(function (x) { return normalizeSearchValue(displayCasName(x.name)).includes(q); });
    if (!matches.length) {
        casState.value = 'bad';
        casHint.value = '검색 결과 없음';
        return;
    }
    var best = (_a = matches.find(function (x) { return normalizeSearchValue(displayCasName(x.name)) === q; })) !== null && _a !== void 0 ? _a : matches[0];
    selectedCas.clear();
    selectedCas.add(best.name);
    lastCas.value = best.name;
    activateArea('casList', 'cas');
    casAnchorIdx.value = casDisplayItems.value.findIndex(function (x) { return x.name === best.name; });
    casCursorIdx.value = casAnchorIdx.value;
    scrollIntoView(casRefs, best.name);
    casState.value = 'ok';
    casHint.value = '';
    applyCasToJobsFromSelection();
    if (best.name !== CAS_NONE_ID) {
        void fetchCasContent(best.name);
    }
}
function applyJobSearch(_byButton) {
    var _a;
    var raw = jobQuery.value;
    var q = normalizeSearchValue(raw);
    var list = jobDisplayItems.value;
    if (!q || !list.length)
        return;
    var matches = list.filter(function (j) { return normalizeSearchValue(displayJobName(j.jobName)).includes(q); });
    if (!matches.length) {
        jobState.value = 'bad';
        jobHint.value = '검색 결과 없음';
        return;
    }
    var best = (_a = matches.find(function (j) { return normalizeSearchValue(displayJobName(j.jobName)) === q; })) !== null && _a !== void 0 ? _a : matches[0];
    selectedJobs.clear();
    selectedJobs.add(best.id);
    lastJob.value = best.id;
    activateArea('jobList', 'job');
    jobAnchorIdx.value = jobDisplayItems.value.findIndex(function (j) { return j.id === best.id; });
    jobCursorIdx.value = jobAnchorIdx.value;
    scrollIntoView(jobRefs, best.id);
    jobState.value = 'ok';
    jobHint.value = '';
    if (best.id !== JOB_NONE_ID) {
        void fetchJobContent(best.id);
    }
}
function applyRecipeFind(_byButton) {
    var _a, _b, _c;
    var raw = recipeFind.value;
    var q = normalizeSearchValue(raw);
    var list = allRecipes.value;
    if (!q || !list.length)
        return;
    var matches = list.filter(function (r) { var _a; return normalizeSearchValue(displayRecipeName(r.name, (_a = r.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value)).includes(q); });
    if (!matches.length) {
        recipeFindState.value = 'bad';
        return;
    }
    var best = (_a = matches.find(function (r) { var _a; return normalizeSearchValue(displayRecipeName(r.name, (_a = r.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value)) === q; })) !== null && _a !== void 0 ? _a : matches[0];
    selectedRecipes.clear();
    selectedRecipes.add(best.id);
    lastRecipe.value = best.id;
    activateArea('recipeArea', 'recipe');
    recipeCursorIdx.value = allRecipes.value.findIndex(function (r) { return r.id === best.id; });
    scrollIntoView(recipeRefs, best.id);
    void ensureRecipeDetailById(best.id);
    recipeFindState.value = 'ok';
    if (normalizeSearchValue(displayRecipeName(best.name, (_b = best.sourceKind) !== null && _b !== void 0 ? _b : activeRecipeSourceKind.value)) === q) {
        setRecipeFindProgram(displayRecipeName(best.name, (_c = best.sourceKind) !== null && _c !== void 0 ? _c : activeRecipeSourceKind.value));
    }
}
(0, vue_1.watch)(casQuery, function () {
    if (skipCasWatch) {
        skipCasWatch = false;
        return;
    }
    if (casProgram.value || hasComma(casQuery.value))
        return;
    clearTimeout(tCas);
    if (!casQuery.value.trim()) {
        casState.value = 'idle';
        casHint.value = '';
        return;
    }
    tCas = setTimeout(function () { return applyCasSearch(false); }, 160);
});
(0, vue_1.watch)(jobQuery, function () {
    if (skipJobWatch) {
        skipJobWatch = false;
        return;
    }
    if (jobProgram.value || hasComma(jobQuery.value))
        return;
    clearTimeout(tJob);
    if (!jobQuery.value.trim()) {
        jobState.value = 'idle';
        jobHint.value = '';
        return;
    }
    tJob = setTimeout(function () { return applyJobSearch(false); }, 160);
});
(0, vue_1.watch)(recipeFind, function () {
    if (skipRecipeWatch) {
        skipRecipeWatch = false;
        return;
    }
    if (recipeProgram.value || hasComma(recipeFind.value))
        return;
    clearTimeout(tRec);
    if (!recipeFind.value.trim()) {
        recipeFindState.value = 'idle';
        return;
    }
    tRec = setTimeout(function () { return applyRecipeFind(false); }, 160);
});
function jobContentEnterEdit() {
    var _a;
    var jobId = (_a = selectedJobSingleReal.value) === null || _a === void 0 ? void 0 : _a.id;
    if (!jobId)
        return;
    snapshotJobBaseline(jobId);
    jobEditMode.value = true;
    activateArea('jobContent', 'job');
}
function jobSaveClicked() {
    var _this = this;
    var _a;
    var jobId = (_a = selectedJobSingleReal.value) === null || _a === void 0 ? void 0 : _a.id;
    var job = selectedJobSingleReal.value;
    if (!jobId || !job || !jobEditMode.value)
        return;
    if (jobDirty(jobId)) {
        openConfirm({
            title: 'Confirm',
            tone: 'default',
            message: '기존 Job Edit 내용과 차이가 있습니다. 저장하시겠습니까?',
            onYes: function () { return __awaiter(_this, void 0, void 0, function () {
                var err_6;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, recipeTestApi_1.recipeTestApi.persistJob(eqpId.value, jobId, job.jobName, deepClone((_a = jobParsedMap[jobId]) !== null && _a !== void 0 ? _a : {}), getActorName(), getActorTeam())];
                        case 1:
                            _c.sent();
                            jobBaseline[jobId] = JSON.stringify((_b = jobParsedMap[jobId]) !== null && _b !== void 0 ? _b : {});
                            jobEditMode.value = false;
                            return [3 /*break*/, 3];
                        case 2:
                            err_6 = _c.sent();
                            window.alert("JOB \uC800\uC7A5 \uC2E4\uD328: ".concat(getErrorMessage(err_6)));
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); },
            onNo: function () {
                revertJob(jobId);
                jobEditMode.value = false;
            }
        });
    }
    else {
        jobEditMode.value = false;
    }
}
function jobCancelRequested() {
    var _a;
    var jobId = (_a = selectedJobSingleReal.value) === null || _a === void 0 ? void 0 : _a.id;
    if (!jobId)
        return;
    if (jobDirty(jobId)) {
        openConfirm({
            title: 'Warning',
            tone: 'warn',
            message: 'Job Edit을 종료하시겠습니까? 종료한다면 변경내용은 저장되지 않습니다.',
            onYes: function () {
                revertJob(jobId);
                jobEditMode.value = false;
            },
            onNo: function () { }
        });
    }
    else {
        jobEditMode.value = false;
    }
}
function animateCartFly(label, startX, startY) {
    var _a;
    var anchor = (_a = cartAnchorEl.value) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
    if (!anchor)
        return;
    var id = Date.now() + Math.floor(Math.random() * 1000);
    cartFlyTokens.value = __spreadArray(__spreadArray([], cartFlyTokens.value, true), [{ id: id, label: label, x: startX, y: startY, tx: startX, ty: startY }], false);
    requestAnimationFrame(function () {
        cartFlyTokens.value = cartFlyTokens.value.map(function (token) { return token.id === id ? __assign(__assign({}, token), { tx: anchor.left + anchor.width / 2, ty: anchor.top + anchor.height / 2 }) : token; });
    });
    window.setTimeout(function () {
        cartFlyTokens.value = cartFlyTokens.value.filter(function (token) { return token.id !== id; });
    }, 720);
}
function clearCart() {
    cartItems.value = [];
    selectedCartTargetEqpIdsSet.clear();
}
function removeCartItem(key) {
    cartItems.value = cartItems.value.filter(function (item) { return item.key !== key; });
    if (!cartItems.value.length)
        selectedCartTargetEqpIdsSet.clear();
}
function setCartTargetEqpIds(targetEqpIds) {
    selectedCartTargetEqpIdsSet.clear();
    for (var _i = 0, targetEqpIds_1 = targetEqpIds; _i < targetEqpIds_1.length; _i++) {
        var id = targetEqpIds_1[_i];
        if (id)
            selectedCartTargetEqpIdsSet.add(id);
    }
}
function pushCartItem(kind, name, sourceKind, event) {
    var _a, _b;
    var meta = currentEqpMeta.value;
    if (!meta) {
        window.alert('현재 설비 메타 정보를 찾을 수 없습니다.');
        return;
    }
    if (cartItems.value.length) {
        if (cartMaker.value && meta.maker !== cartMaker.value) {
            window.alert('기존 Cart와 다른 Maker 설비의 Content입니다. Cart를 비운 후 다시 담아주세요.');
            return;
        }
        if (cartModelGroup.value && meta.modelGroup !== cartModelGroup.value) {
            window.alert('기존 Cart와 다른 설비군(model_group)입니다. Cart를 비운 후 다시 담아주세요.');
            return;
        }
    }
    var key = "".concat(kind, ":").concat(meta.eqpId, ":").concat(sourceKind !== null && sourceKind !== void 0 ? sourceKind : '', ":").concat(name);
    if (cartItems.value.find(function (item) { return item.key === key; }))
        return;
    cartItems.value = __spreadArray(__spreadArray([], cartItems.value, true), [{ key: key, kind: kind, name: name, sourceEqpId: meta.eqpId, sourceKind: sourceKind, maker: (_a = meta.maker) !== null && _a !== void 0 ? _a : '', modelGroup: (_b = meta.modelGroup) !== null && _b !== void 0 ? _b : '' }], false);
    if (event)
        animateCartFly(name, event.clientX, event.clientY);
    cartShakeToken.value += 1;
}
function addSelectedCasToCart(event) {
    Array.from(selectedCas).filter(function (id) { return id && id !== CAS_NONE_ID; }).forEach(function (id) { return pushCartItem('cas', id, undefined, event); });
}
function addSelectedJobsToCart(event) {
    jobDisplayItems.value.filter(function (item) { return selectedJobs.has(item.id) && item.id !== JOB_NONE_ID; }).forEach(function (item) { return pushCartItem('job', item.jobName, undefined, event); });
}
function addSelectedRecipesToCart(event) {
    allRecipes.value.filter(function (item) { return selectedRecipes.has(item.id) && item.id !== 'R_NONE'; }).forEach(function (item) { var _a; return pushCartItem('recipe', item.name, (_a = item.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value, event); });
}
function moveCartItems() {
    return __awaiter(this, void 0, void 0, function () {
        var res, movedCount, failed, failedMessage, err_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!cartItems.value.length) {
                        window.alert('Cart가 비어 있습니다.');
                        return [2 /*return*/];
                    }
                    if (!selectedCartTargetEqpIds.value.length) {
                        window.alert('Move To 설비를 선택하세요.');
                        return [2 /*return*/];
                    }
                    cartMoving.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.transferFiles({
                            items: cartItems.value.map(function (item) { return ({ kind: item.kind, name: item.name, sourceEqpId: item.sourceEqpId, sourceKind: item.sourceKind }); }),
                            targetEqpIds: selectedCartTargetEqpIds.value,
                            actorName: getActorName(),
                            actorTeam: getActorTeam()
                        })];
                case 2:
                    res = _a.sent();
                    movedCount = Array.isArray(res.moved) ? res.moved.length : 0;
                    failed = Array.isArray(res.failed) ? res.failed : [];
                    failedMessage = failed.length ? "\n\uC2E4\uD328 ".concat(failed.length, "\uAC74\n") + failed.map(function (x) { return "- ".concat(x.targetEqpId, ": ").concat(x.name, " (").concat(x.reason, ")"); }).join('\n') : '';
                    void loadHistory();
                    window.alert("Transfer \uC644\uB8CC: ".concat(movedCount, "\uAC74").concat(failedMessage));
                    if (!failed.length) {
                        clearCart();
                        cartOpen.value = false;
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_7 = _a.sent();
                    window.alert("Transfer \uC2E4\uD328: ".concat(getErrorMessage(err_7)));
                    return [3 /*break*/, 5];
                case 4:
                    cartMoving.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function selectSingleCasForContext(casId) {
    selectedCas.clear();
    selectedCas.add(casId);
    lastCas.value = casId;
    casAnchorIdx.value = casDisplayItems.value.findIndex(function (x) { return x.name === casId; });
    casCursorIdx.value = casAnchorIdx.value;
    setCasQueryProgram(displayCasName(casId));
    casState.value = 'ok';
    casHint.value = '';
    activateArea('casList', 'cas');
    applyCasToJobsFromSelection();
    if (casId !== CAS_NONE_ID)
        void fetchCasContent(casId);
}
function selectSingleJobForContext(jobId) {
    var _a;
    selectedJobs.clear();
    selectedJobs.add(jobId);
    lastJob.value = jobId;
    jobAnchorIdx.value = jobDisplayItems.value.findIndex(function (x) { return x.id === jobId; });
    jobCursorIdx.value = jobAnchorIdx.value;
    var job = jobDisplayItems.value.find(function (x) { return x.id === jobId; });
    setJobQueryProgram(displayJobName((_a = job === null || job === void 0 ? void 0 : job.jobName) !== null && _a !== void 0 ? _a : ''));
    jobState.value = 'ok';
    jobHint.value = '';
    activateArea('jobList', 'job');
    if (jobId !== JOB_NONE_ID)
        void fetchJobContent(jobId);
}
function selectSingleRecipeForContext(recipeId) {
    var _a, _b;
    selectedRecipes.clear();
    selectedRecipes.add(recipeId);
    lastRecipe.value = recipeId;
    recipeAnchorIdx.value = allRecipes.value.findIndex(function (x) { return x.id === recipeId; });
    recipeCursorIdx.value = recipeAnchorIdx.value;
    var recipe = allRecipes.value.find(function (x) { return x.id === recipeId; });
    setRecipeFindProgram(displayRecipeName((_a = recipe === null || recipe === void 0 ? void 0 : recipe.name) !== null && _a !== void 0 ? _a : '', (_b = recipe === null || recipe === void 0 ? void 0 : recipe.sourceKind) !== null && _b !== void 0 ? _b : activeRecipeSourceKind.value));
    recipeFindState.value = 'ok';
    activateArea('recipeArea', 'recipe');
    if (recipeId !== 'R_NONE')
        void ensureRecipeDetailById(recipeId);
}
function onCasListItemContextMenu(payload) {
    if (!selectedCas.has(payload.id)) {
        selectSingleCasForContext(payload.id);
    }
    else {
        lastCas.value = payload.id;
        casCursorIdx.value = casDisplayItems.value.findIndex(function (x) { return x.name === payload.id; });
        activateArea('casList', 'cas');
    }
    openListMenu('cas', payload.event);
}
function onJobListItemContextMenu(payload) {
    if (!selectedJobs.has(payload.id)) {
        selectSingleJobForContext(payload.id);
    }
    else {
        lastJob.value = payload.id;
        jobCursorIdx.value = jobDisplayItems.value.findIndex(function (x) { return x.id === payload.id; });
        activateArea('jobList', 'job');
    }
    openListMenu('job', payload.event);
}
function onRecipeListItemContextMenu(payload) {
    if (!selectedRecipes.has(payload.recipeId)) {
        selectSingleRecipeForContext(payload.recipeId);
    }
    else {
        lastRecipe.value = payload.recipeId;
        recipeCursorIdx.value = allRecipes.value.findIndex(function (x) { return x.id === payload.recipeId; });
        activateArea('recipeArea', 'recipe');
    }
    openListMenu('recipe', payload.event);
}
function casListEnterEdit() {
    return __awaiter(this, void 0, void 0, function () {
        var casId, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    casId = casSelectedSingle.value;
                    if (!casId)
                        return [2 /*return*/];
                    if (!!casTableMap[casId]) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchCasContent(casId)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4:
                    activateArea('casContent', 'cas');
                    casContentEnterEdit();
                    return [2 /*return*/];
            }
        });
    });
}
function jobListEnterEdit() {
    return __awaiter(this, void 0, void 0, function () {
        var jobId, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    jobId = ((_b = selectedJobSingleReal.value) === null || _b === void 0 ? void 0 : _b.id) || previewJobId.value;
                    if (!jobId || jobId === JOB_NONE_ID)
                        return [2 /*return*/];
                    if (!!jobParsedMap[jobId]) return [3 /*break*/, 4];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchJobContent(jobId)];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 4:
                    activateArea('jobContent', 'job');
                    jobContentEnterEdit();
                    return [2 /*return*/];
            }
        });
    });
}
function openListMenu(kind, e) {
    ctxMenu.open = true;
    ctxMenu.x = e.clientX;
    ctxMenu.y = e.clientY;
    var items = [];
    if (kind === 'cas') {
        var multi = Array.from(selectedCas).length > 1;
        var singleEditable = !multi && !casSelectedSingle.value;
        items.push({ label: 'Add to Cart', action: function () { ctxMenu.open = false; addSelectedCasToCart(e); } });
        if (multi) {
            items.push({ label: 'Delete', action: function () { ctxMenu.open = false; casListDelete(); } });
        }
        else {
            if (singleEditable) {
                items.push({ label: 'Edit', action: function () { ctxMenu.open = false; void casListEnterEdit(); } });
            }
            items.push({ label: 'Rename', action: function () { ctxMenu.open = false; void casListEditRename(); } });
            items.push({ label: 'Save As', action: function () { ctxMenu.open = false; casListSaveAs(); } });
            items.push({ label: 'Delete', action: function () { ctxMenu.open = false; casListDelete(); } });
        }
    }
    if (kind === 'job') {
        var multi = Array.from(selectedJobs).length > 1;
        var singleEditable = !multi && !selectedJobSingleReal.value;
        items.push({ label: 'Add to Cart', action: function () { ctxMenu.open = false; addSelectedJobsToCart(e); } });
        if (multi) {
            items.push({ label: 'Delete', action: function () { ctxMenu.open = false; jobListDelete(); } });
        }
        else {
            if (singleEditable) {
                items.push({ label: 'Edit', action: function () { ctxMenu.open = false; void jobListEnterEdit(); } });
            }
            items.push({ label: 'Rename', action: function () { ctxMenu.open = false; void jobListEditRename(); } });
            items.push({ label: 'Save As', action: function () { ctxMenu.open = false; jobListSaveAs(); } });
            items.push({ label: 'Delete', action: function () { ctxMenu.open = false; jobListDelete(); } });
        }
    }
    if (kind === 'recipe') {
        var multi = Array.from(selectedRecipes).filter(function (x) { return x !== 'R_NONE'; }).length > 1;
        items.push({ label: 'Add to Cart', action: function () { ctxMenu.open = false; addSelectedRecipesToCart(e); } });
        if (multi) {
            items.push({ label: 'Delete', action: function () { ctxMenu.open = false; recipeListDelete(); } });
        }
        else {
            items.push({ label: 'Rename', action: function () { ctxMenu.open = false; void recipeListEditRename(); } });
            items.push({ label: 'Save As', action: function () { ctxMenu.open = false; recipeListSaveAs(); } });
            items.push({ label: 'Delete', action: function () { ctxMenu.open = false; recipeListDelete(); } });
        }
    }
    ctxMenu.items = items;
}
function openContentMenu(kind, e) {
    ctxMenu.open = true;
    ctxMenu.x = e.clientX;
    ctxMenu.y = e.clientY;
    if (kind === 'casContent') {
        ctxMenu.items = [
            { label: 'Add to Cart', action: function () { ctxMenu.open = false; addSelectedCasToCart(e); } },
            casEditMode.value ? { label: 'Edit Cancel', action: function () { ctxMenu.open = false; casCancelRequested(); } } : { label: 'Edit', action: function () { ctxMenu.open = false; casContentEnterEdit(); } },
            { label: 'Save As', action: function () { ctxMenu.open = false; casContentSaveAs(); } }
        ];
    }
    else {
        ctxMenu.items = [
            { label: 'Add to Cart', action: function () { ctxMenu.open = false; addSelectedJobsToCart(e); } },
            jobEditMode.value ? { label: 'Edit Cancel', action: function () { ctxMenu.open = false; jobCancelRequested(); } } : { label: 'Edit', action: function () { ctxMenu.open = false; jobContentEnterEdit(); } },
            { label: 'Save As', action: function () { ctxMenu.open = false; jobContentSaveAs(); } }
        ];
    }
}
/** Confirm Overlay Matrix */
var confirmModal = (0, vue_1.reactive)({
    open: false,
    title: 'Confirm',
    tone: 'default',
    message: '',
    onYes: null,
    onNo: null
});
function openConfirm(p) {
    confirmModal.open = true;
    confirmModal.title = p.title;
    confirmModal.tone = p.tone;
    confirmModal.message = p.message;
    confirmModal.onYes = p.onYes;
    confirmModal.onNo = p.onNo;
}
function confirmYes() {
    var fn = confirmModal.onYes;
    confirmModal.open = false;
    confirmModal.onYes = null;
    confirmModal.onNo = null;
    fn === null || fn === void 0 ? void 0 : fn();
}
function confirmNo() {
    var fn = confirmModal.onNo;
    confirmModal.open = false;
    confirmModal.onYes = null;
    confirmModal.onNo = null;
    fn === null || fn === void 0 ? void 0 : fn();
}
/** File Core Control Matrix Operations */
function makeRecipeIdByName(name, sourceKind) {
    if (sourceKind === void 0) { sourceKind = activeRecipeSourceKind.value; }
    return sourceKind === 'recipe' ? "RCP::".concat(name) : "RCP_SRC::".concat(sourceKind, "::").concat(name);
}
function syncRecipeCacheAfterRename(sourceKind, oldId, newId, newName) {
    recipesData.value = recipesData.value.map(function (r) { return r.id === oldId ? __assign(__assign({}, r), { id: newId, name: newName, sourceKind: sourceKind }) : r; });
    var cached = recipeSourceCache[sourceKind];
    if (cached === null || cached === void 0 ? void 0 : cached.length) {
        recipeSourceCache[sourceKind] = cached.map(function (r) { return r.id === oldId ? __assign(__assign({}, r), { id: newId, name: newName, sourceKind: sourceKind }) : r; });
    }
    sortRecipesData();
}
function syncRecipeCacheAfterDelete(deletedIds, sourceKindMap) {
    recipesData.value = recipesData.value.filter(function (r) { return !deletedIds.includes(r.id); });
    var _loop_8 = function (id, sourceKind) {
        var cached = recipeSourceCache[sourceKind];
        if (cached === null || cached === void 0 ? void 0 : cached.length) {
            recipeSourceCache[sourceKind] = cached.filter(function (r) { return r.id !== id; });
        }
    };
    for (var _i = 0, _a = Object.entries(sourceKindMap); _i < _a.length; _i++) {
        var _b = _a[_i], id = _b[0], sourceKind = _b[1];
        _loop_8(id, sourceKind);
    }
    sortRecipesData();
}
function casListEditRename() {
    return __awaiter(this, void 0, void 0, function () {
        var casId, newNameRaw, newName, res, newFullName_1, err_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (selectedCas.size !== 1)
                        return [2 /*return*/];
                    casId = Array.from(selectedCas)[0];
                    if (!casId || casId === CAS_NONE_ID)
                        return [2 /*return*/];
                    return [4 /*yield*/, openAsciiNamePrompt('Rename CAS', displayCasName(casId), 'New CAS name')];
                case 1:
                    newNameRaw = _a.sent();
                    newName = newNameRaw === null || newNameRaw === void 0 ? void 0 : newNameRaw.trim();
                    if (!newName || newName === displayCasName(casId))
                        return [2 /*return*/];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.renameFile({ eqpId: eqpId.value, kind: 'cas', sourceName: casId, targetName: newName })];
                case 3:
                    res = _a.sent();
                    newFullName_1 = res.name;
                    casData.value = casData.value.map(function (x) { return x.name === casId ? __assign(__assign({}, x), { name: newFullName_1 }) : x; });
                    casToJobs.value[newFullName_1] = casToJobs.value[casId] ? __spreadArray([], casToJobs.value[casId], true) : [];
                    delete casToJobs.value[casId];
                    if (casTableMap[casId]) {
                        casTableMap[newFullName_1] = casTableMap[casId];
                        delete casTableMap[casId];
                    }
                    if (casBaseline[casId]) {
                        casBaseline[newFullName_1] = casBaseline[casId];
                        delete casBaseline[casId];
                    }
                    sortCasData();
                    selectedCas.clear();
                    selectedCas.add(newFullName_1);
                    lastCas.value = newFullName_1;
                    setCasQueryProgram(displayCasName(newFullName_1));
                    return [4 /*yield*/, scrollIntoView(casRefs, newFullName_1)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    err_8 = _a.sent();
                    window.alert("CAS Rename \uC2E4\uD328: ".concat(getErrorMessage(err_8)));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function casListSaveAs() {
    return __awaiter(this, void 0, void 0, function () {
        var casId, src, newIdRaw, newId, ext, newFull, slots, err_9;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (selectedCas.size !== 1)
                        return [2 /*return*/];
                    casId = Array.from(selectedCas)[0];
                    src = casData.value.find(function (x) { return x.name === casId; });
                    if (!src)
                        return [2 /*return*/];
                    return [4 /*yield*/, openAsciiNamePrompt('Save As - New CAS ID', "".concat(displayCasName(casId), "_COPY"), 'New CAS ID')];
                case 1:
                    newIdRaw = _d.sent();
                    newId = newIdRaw === null || newIdRaw === void 0 ? void 0 : newIdRaw.trim();
                    if (!newId)
                        return [2 /*return*/];
                    ext = src.name.toLowerCase().endswith('.cas') ? '.cas' : '';
                    newFull = "".concat(newId).concat(ext);
                    slots = JSON.parse(JSON.stringify((_a = casTableMap[casId]) !== null && _a !== void 0 ? _a : []));
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.persistCas(eqpId.value, casId, newFull, slots, getActorName(), getActorTeam())];
                case 3:
                    _d.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_9 = _d.sent();
                    window.alert("CAS Save As \uC2E4\uD328: ".concat(getErrorMessage(err_9)));
                    return [2 /*return*/];
                case 5:
                    casData.value = __spreadArray(__spreadArray([], casData.value, true), [__assign(__assign({}, src), { name: newFull })], false);
                    casToJobs.value[newFull] = __spreadArray([], ((_b = casToJobs.value[casId]) !== null && _b !== void 0 ? _b : []), true);
                    casTableMap[newFull] = slots;
                    casBaseline[newFull] = JSON.stringify((_c = casTableMap[newFull]) !== null && _c !== void 0 ? _c : []);
                    sortCasData();
                    selectedCas.clear();
                    selectedCas.add(newFull);
                    lastCas.value = newFull;
                    setCasQueryProgram(displayCasName(newFull));
                    return [4 /*yield*/, scrollIntoView(casRefs, newFull)];
                case 6:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function casListDelete() {
    var _this = this;
    var ids = Array.from(selectedCas).filter(function (id) { return id && id !== CAS_NONE_ID; });
    if (ids.length === 0)
        return;
    openConfirm({
        title: 'Confirm',
        tone: 'default',
        message: '정말 삭제하시겠습니까?',
        onYes: function () { return __awaiter(_this, void 0, void 0, function () {
            var res, deletedNames, _loop_9, _i, deletedNames_1, id, err_10;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, recipeTestApi_1.recipeTestApi.deleteFiles(eqpId.value, ids.map(function (name) { return ({ kind: 'cas', name: name }); }))];
                    case 1:
                        res = _c.sent();
                        deletedNames = ((_a = res.deleted) !== null && _a !== void 0 ? _a : []).map(function (x) { return x.name; });
                        _loop_9 = function (id) {
                            casData.value = casData.value.filter(function (x) { return x.name !== id; });
                            delete casToJobs.value[id];
                            delete casTableMap[id];
                            delete casBaseline[id];
                        };
                        for (_i = 0, deletedNames_1 = deletedNames; _i < deletedNames_1.length; _i++) {
                            id = deletedNames_1[_i];
                            _loop_9(id);
                        }
                        sortCasData();
                        resetCasSelectionOnly();
                        applyCasToJobsFromSelection();
                        if ((_b = res.failed) === null || _b === void 0 ? void 0 : _b.length) {
                            window.alert("CAS \uC0AD\uC81C \uBD80\uBD84 \uC2E4\uD328\n".concat(res.failed.map(function (x) { return "- ".concat(x.name, ": ").concat(x.reason); }).join('\n')));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        err_10 = _c.sent();
                        window.alert("CAS \uC0AD\uC81C \uC2E4\uD328: ".concat(getErrorMessage(err_10)));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        onNo: function () { }
    });
}
/** CAS Content Actions */
function casContentEnterEdit() {
    var casId = casSelectedSingle.value;
    if (!casId)
        return;
    snapshotCasBaseline(casId);
    casEditMode.value = true;
    clearCasCellSelection();
    activateArea('casContent', 'cas');
}
function casSaveClicked() {
    var _this = this;
    var casId = casSelectedSingle.value;
    if (!casId || !casEditMode.value)
        return;
    if (casDirty(casId)) {
        openConfirm({
            title: 'Confirm',
            tone: 'default',
            message: '기존 Cas Content와 차이가 있습니다. 이대로 저장하시겠습니까?',
            onYes: function () { return __awaiter(_this, void 0, void 0, function () {
                var err_11;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, recipeTestApi_1.recipeTestApi.persistCas(eqpId.value, casId, casId, (_a = casTableMap[casId]) !== null && _a !== void 0 ? _a : [], getActorName(), getActorTeam())];
                        case 1:
                            _c.sent();
                            casBaseline[casId] = JSON.stringify((_b = casTableMap[casId]) !== null && _b !== void 0 ? _b : []);
                            casEditMode.value = false;
                            clearCasCellSelection();
                            return [3 /*break*/, 3];
                        case 2:
                            err_11 = _c.sent();
                            window.alert("CAS \uC800\uC7A5 \uC2E4\uD328: ".concat(getErrorMessage(err_11)));
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); },
            onNo: function () {
                revertCas(casId);
                casEditMode.value = false;
                clearCasCellSelection();
            }
        });
    }
    else {
        casEditMode.value = false;
        clearCasCellSelection();
    }
}
function casCancelRequested() {
    var casId = casSelectedSingle.value;
    if (!casId)
        return;
    if (casDirty(casId)) {
        openConfirm({
            title: 'Warning',
            tone: 'warn',
            message: 'Cas Edit을 종료하시겠습니까? 종료한다면 변경내용은 저장되지 않습니다.',
            onYes: function () {
                revertCas(casId);
                casEditMode.value = false;
                clearCasCellSelection();
            },
            onNo: function () { }
        });
    }
    else {
        casEditMode.value = false;
        clearCasCellSelection();
    }
}
function casContentSaveAs() {
    return __awaiter(this, void 0, void 0, function () {
        var casId, src, newIdRaw, newId, ext, newFull, slots, err_12;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    casId = casSelectedSingle.value;
                    if (!casId)
                        return [2 /*return*/];
                    src = casData.value.find(function (x) { return x.name === casId; });
                    if (!src)
                        return [2 /*return*/];
                    return [4 /*yield*/, openAsciiNamePrompt('Save As - New CAS ID', "".concat(displayCasName(casId), "_COPY"), 'New CAS ID')];
                case 1:
                    newIdRaw = _d.sent();
                    newId = newIdRaw === null || newIdRaw === void 0 ? void 0 : newIdRaw.trim();
                    if (!newId)
                        return [2 /*return*/];
                    ext = src.name.toLowerCase().endswith('.cas') ? '.cas' : '';
                    newFull = "".concat(newId).concat(ext);
                    slots = JSON.parse(JSON.stringify((_a = casTableMap[casId]) !== null && _a !== void 0 ? _a : []));
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.persistCas(eqpId.value, casId, newFull, slots, getActorName(), getActorTeam())];
                case 3:
                    _d.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_12 = _d.sent();
                    window.alert("CAS Save As \uC2E4\uD328: ".concat(getErrorMessage(err_12)));
                    return [2 /*return*/];
                case 5:
                    casData.value = __spreadArray(__spreadArray([], casData.value, true), [__assign(__assign({}, src), { name: newFull })], false);
                    casToJobs.value[newFull] = __spreadArray([], ((_b = casToJobs.value[casId]) !== null && _b !== void 0 ? _b : []), true);
                    casTableMap[newFull] = slots;
                    casBaseline[newFull] = JSON.stringify((_c = casTableMap[newFull]) !== null && _c !== void 0 ? _c : []);
                    sortCasData();
                    selectedCas.clear();
                    selectedCas.add(newFull);
                    lastCas.value = newFull;
                    setCasQueryProgram(displayCasName(newFull));
                    return [4 /*yield*/, scrollIntoView(casRefs, newFull)];
                case 6:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/** JOB Control Actions Matrix */
function jobListEditRename() {
    return __awaiter(this, void 0, void 0, function () {
        var oldJobId, job, newNameRaw, newName, res, renamedName_1, snapshot, restored, err_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (selectedJobs.size !== 1)
                        return [2 /*return*/];
                    oldJobId = Array.from(selectedJobs)[0];
                    if (!oldJobId || oldJobId === JOB_NONE_ID)
                        return [2 /*return*/];
                    job = jobsData.value.find(function (j) { return j.id === oldJobId; });
                    if (!job)
                        return [2 /*return*/];
                    return [4 /*yield*/, openAsciiNamePrompt('Rename JOB', displayJobName(job.jobName), 'New JOB name')];
                case 1:
                    newNameRaw = _a.sent();
                    newName = newNameRaw === null || newNameRaw === void 0 ? void 0 : newNameRaw.trim();
                    if (!newName || newName === displayJobName(job.jobName))
                        return [2 /*return*/];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 8, , 9]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.renameFile({ eqpId: eqpId.value, kind: 'job', sourceName: job.jobName, targetName: newName, actorName: getActorName(), actorTeam: getActorTeam() })];
                case 3:
                    res = _a.sent();
                    void loadHistory();
                    renamedName_1 = res.name;
                    snapshot = captureReloadRestoreSpec({ jobNames: [renamedName_1], previewJobName: renamedName_1 });
                    return [4 /*yield*/, reloadAndRestoreSelections(snapshot)];
                case 4:
                    _a.sent();
                    restored = jobsData.value.find(function (j) { return j.jobName === renamedName_1; });
                    if (!restored) return [3 /*break*/, 7];
                    selectedJobs.clear();
                    selectedJobs.add(restored.id);
                    lastJob.value = restored.id;
                    setJobQueryProgram(displayJobName(restored.jobName));
                    return [4 /*yield*/, fetchJobContent(restored.id)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, scrollIntoView(jobRefs, restored.id)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    err_13 = _a.sent();
                    window.alert("JOB Rename \uC2E4\uD328: ".concat(getErrorMessage(err_13)));
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function jobListSaveAs() {
    return __awaiter(this, void 0, void 0, function () {
        var jobId, job, newNameRaw, newName, ext, newJobName, parsedClone, snapshot, restored, err_14;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (selectedJobs.size !== 1)
                        return [2 /*return*/];
                    jobId = Array.from(selectedJobs)[0];
                    job = jobsData.value.find(function (j) { return j.id === jobId; });
                    if (!job)
                        return [2 /*return*/];
                    return [4 /*yield*/, openAsciiNamePrompt('Save As - New JOB Name', "".concat(displayJobName(job.jobName), "_COPY"), 'New JOB Name')];
                case 1:
                    newNameRaw = _b.sent();
                    newName = newNameRaw === null || newNameRaw === void 0 ? void 0 : newNameRaw.trim();
                    if (!newName)
                        return [2 /*return*/];
                    ext = job.jobName.toLowerCase().endswith('.job') ? '.job' : '';
                    newJobName = "".concat(newName).concat(ext);
                    parsedClone = JSON.parse(JSON.stringify((_a = jobParsedMap[jobId]) !== null && _a !== void 0 ? _a : {}));
                    snapshot = captureReloadRestoreSpec({ jobNames: [newJobName], previewJobName: newJobName });
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 8, , 9]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.persistJob(eqpId.value, jobId, newJobName, parsedClone, getActorName(), getActorTeam())];
                case 3:
                    _b.sent();
                    void loadHistory();
                    return [4 /*yield*/, reloadAndRestoreSelections(snapshot)];
                case 4:
                    _b.sent();
                    restored = jobsData.value.find(function (j) { return j.jobName === newJobName; });
                    if (!restored) return [3 /*break*/, 7];
                    selectedJobs.clear();
                    selectedJobs.add(restored.id);
                    lastJob.value = restored.id;
                    setJobQueryProgram(displayJobName(restored.jobName));
                    return [4 /*yield*/, fetchJobContent(restored.id)];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, scrollIntoView(jobRefs, restored.id)];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    err_14 = _b.sent();
                    window.alert("JOB Save As \uC2E4\uD328: ".concat(getErrorMessage(err_14)));
                    return [2 /*return*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function jobListDelete() {
    var _this = this;
    var ids = Array.from(selectedJobs).filter(function (id) { return id && id !== JOB_NONE_ID; });
    if (ids.length === 0)
        return;
    openConfirm({
        title: 'Confirm',
        tone: 'default',
        message: '정말 삭제하시겠습니까?',
        onYes: function () { return __awaiter(_this, void 0, void 0, function () {
            var items, res, deletedNames_2, deletedIds, _loop_10, _i, deletedIds_1, id, err_15;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        items = ids.map(function (id) {
                            var _a;
                            var job = jobsData.value.find(function (j) { return j.id === id; });
                            return { kind: 'job', name: (_a = job === null || job === void 0 ? void 0 : job.jobName) !== null && _a !== void 0 ? _a : id };
                        });
                        return [4 /*yield*/, recipeTestApi_1.recipeTestApi.deleteFiles(eqpId.value, items, getActorName(), getActorTeam())];
                    case 1:
                        res = _d.sent();
                        void loadHistory();
                        deletedNames_2 = ((_a = res.deleted) !== null && _a !== void 0 ? _a : []).map(function (x) { return x.name; });
                        deletedIds = jobsData.value.filter(function (job) { return deletedNames_2.includes(job.jobName); }).map(function (job) { return job.id; });
                        _loop_10 = function (id) {
                            jobsData.value = jobsData.value.filter(function (j) { return j.id !== id; });
                            delete jobParsedMap[id];
                            delete jobBaseline[id];
                            for (var _e = 0, _f = Object.keys(casTableMap); _e < _f.length; _e++) {
                                var casId = _f[_e];
                                for (var _g = 0, _h = casTableMap[casId]; _g < _h.length; _g++) {
                                    var row = _h[_g];
                                    if (row.jobId === id) {
                                        row.jobId = '';
                                        row.jobName = NONE_LABEL;
                                        row.recipeName = '';
                                    }
                                }
                            }
                            for (var _j = 0, _k = Object.keys(casToJobs.value); _j < _k.length; _j++) {
                                var casId = _k[_j];
                                casToJobs.value[casId] = ((_b = casToJobs.value[casId]) !== null && _b !== void 0 ? _b : []).filter(function (x) { return x !== id; });
                            }
                        };
                        for (_i = 0, deletedIds_1 = deletedIds; _i < deletedIds_1.length; _i++) {
                            id = deletedIds_1[_i];
                            _loop_10(id);
                        }
                        sortJobsData();
                        resetJobSelectionOnly();
                        if ((_c = res.failed) === null || _c === void 0 ? void 0 : _c.length) {
                            window.alert("JOB \uC0AD\uC81C \uBD80\uBD84 \uC2E4\uD328\n".concat(res.failed.map(function (x) { return "- ".concat(x.name, ": ").concat(x.reason); }).join('\n')));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        err_15 = _d.sent();
                        window.alert("JOB \uC0AD\uC81C \uC2E4\uD328: ".concat(getErrorMessage(err_15)));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        onNo: function () { }
    });
}
function jobContentSaveAs() {
    return __awaiter(this, void 0, void 0, function () {
        var job, newNameRaw, newName, ext, newJobName, parsedClone, snapshot, restored, err_16;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    job = selectedJobSingleReal.value;
                    if (!job)
                        return [2 /*return*/];
                    return [4 /*yield*/, openAsciiNamePrompt('Save As - New JOB Name', "".concat(displayJobName(job.jobName), "_COPY"), 'New JOB Name')];
                case 1:
                    newNameRaw = _b.sent();
                    newName = newNameRaw === null || newNameRaw === void 0 ? void 0 : newNameRaw.trim();
                    if (!newName)
                        return [2 /*return*/];
                    ext = job.jobName.toLowerCase().endswith('.job') ? '.job' : '';
                    newJobName = "".concat(newName).concat(ext);
                    parsedClone = JSON.parse(JSON.stringify((_a = jobParsedMap[job.id]) !== null && _a !== void 0 ? _a : {}));
                    snapshot = captureReloadRestoreSpec({ jobNames: [newJobName], previewJobName: newJobName });
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 8, , 9]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.persistJob(eqpId.value, job.id, newJobName, parsedClone, getActorName(), getActorTeam())];
                case 3:
                    _b.sent();
                    void loadHistory();
                    return [4 /*yield*/, reloadAndRestoreSelections(snapshot)];
                case 4:
                    _b.sent();
                    restored = jobsData.value.find(function (j) { return j.jobName === newJobName; });
                    if (!restored) return [3 /*break*/, 7];
                    selectedJobs.clear();
                    selectedJobs.add(restored.id);
                    lastJob.value = restored.id;
                    setJobQueryProgram(displayJobName(restored.jobName));
                    return [4 /*yield*/, fetchJobContent(restored.id)];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, scrollIntoView(jobRefs, restored.id)];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    err_16 = _b.sent();
                    window.alert("JOB Save As \uC2E4\uD328: ".concat(getErrorMessage(err_16)));
                    return [2 /*return*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
/** Recipe Source Storage Subroutines */
function recipeListEditRename() {
    return __awaiter(this, void 0, void 0, function () {
        var oldRecipeId, r, sourceKind, newNameRaw, newName, res, targetName, newRecipeId, err_17;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (selectedRecipes.size !== 1)
                        return [2 /*return*/];
                    oldRecipeId = Array.from(selectedRecipes)[0];
                    if (oldRecipeId === 'R_NONE')
                        return [2 /*return*/];
                    r = allRecipes.value.find(function (x) { return x.id === oldRecipeId; });
                    if (!r)
                        return [2 /*return*/];
                    sourceKind = (_a = r.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value;
                    return [4 /*yield*/, openAsciiNamePrompt('Rename RECIPE', displayRecipeName(r.name, sourceKind), 'New RECIPE name')];
                case 1:
                    newNameRaw = _b.sent();
                    newName = newNameRaw === null || newNameRaw === void 0 ? void 0 : newNameRaw.trim();
                    if (!newName || newName === displayRecipeName(r.name, sourceKind))
                        return [2 /*return*/];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.renameFile({ eqpId: eqpId.value, kind: 'recipe', sourceName: r.name, targetName: newName, sourceKind: sourceKind, actorName: getActorName(), actorTeam: getActorTeam() })];
                case 3:
                    res = _b.sent();
                    void loadHistory();
                    targetName = res.name;
                    newRecipeId = makeRecipeIdByName(targetName, sourceKind);
                    syncRecipeCacheAfterRename(sourceKind, oldRecipeId, newRecipeId, targetName);
                    selectedRecipes.clear();
                    selectedRecipes.add(newRecipeId);
                    lastRecipe.value = newRecipeId;
                    setRecipeFindProgram(displayRecipeName(targetName, sourceKind));
                    return [4 /*yield*/, scrollIntoView(recipeRefs, newRecipeId)];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    err_17 = _b.sent();
                    window.alert("RECIPE Rename \uC2E4\uD328: ".concat(getErrorMessage(err_17)));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function recipeListSaveAs() {
    return __awaiter(this, void 0, void 0, function () {
        var rid, r, sourceKind, newNameRaw, newName, res, actualName, newId, clone, cached, err_18;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (selectedRecipes.size !== 1)
                        return [2 /*return*/];
                    rid = Array.from(selectedRecipes)[0];
                    if (rid === 'R_NONE')
                        return [2 /*return*/];
                    r = allRecipes.value.find(function (x) { return x.id === rid; });
                    if (!r)
                        return [2 /*return*/];
                    sourceKind = (_a = r.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value;
                    return [4 /*yield*/, openAsciiNamePrompt('Save As - New RECIPE Name', "".concat(displayRecipeName(r.name, sourceKind), "_COPY"), 'New RECIPE Name')];
                case 1:
                    newNameRaw = _c.sent();
                    newName = newNameRaw === null || newNameRaw === void 0 ? void 0 : newNameRaw.trim();
                    if (!newName)
                        return [2 /*return*/];
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.cloneRecipe(eqpId.value, r.name, newName, sourceKind, getActorName(), getActorTeam())];
                case 3:
                    res = _c.sent();
                    void loadHistory();
                    actualName = res.savedAs || newName;
                    newId = makeRecipeIdByName(actualName, sourceKind);
                    clone = JSON.parse(JSON.stringify(r));
                    clone.id = newId;
                    clone.name = actualName;
                    clone.sourceKind = sourceKind;
                    recipesData.value = __spreadArray(__spreadArray([], recipesData.value, true), [clone], false);
                    cached = (_b = recipeSourceCache[sourceKind]) !== null && _b !== void 0 ? _b : recipesData.value.filter(function (item) { return item.id !== 'R_NONE'; });
                    recipeSourceCache[sourceKind] = __spreadArray(__spreadArray([], cached.filter(function (item) { return item.id !== rid; }), true), [r, clone], false);
                    sortRecipesData();
                    selectedRecipes.clear();
                    selectedRecipes.add(newId);
                    lastRecipe.value = newId;
                    setRecipeFindProgram(displayRecipeName(actualName, sourceKind));
                    return [4 /*yield*/, scrollIntoView(recipeRefs, newId)];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 5:
                    err_18 = _c.sent();
                    window.alert("RECIPE Save As \uC2E4\uD328: ".concat(getErrorMessage(err_18)));
                    return [2 /*return*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function recipeListDelete() {
    var _this = this;
    var ids = Array.from(selectedRecipes).filter(function (x) { return x !== 'R_NONE'; });
    if (ids.length === 0)
        return;
    openConfirm({
        title: 'Confirm',
        tone: 'default',
        message: '정말 삭제하시겠습니까?',
        onYes: function () { return __awaiter(_this, void 0, void 0, function () {
            var items, sourceKindMap, _loop_11, _i, ids_4, id, res, deletedNames_3, deletedIds, err_19;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        items = ids.map(function (id) { return allRecipes.value.find(function (r) { return r.id === id; }); }).filter(function (r) { return !r; }).map(function (r) { var _a; return ({ kind: 'recipe', name: r.name, sourceKind: (_a = r.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value }); });
                        sourceKindMap = {};
                        _loop_11 = function (id) {
                            var r = allRecipes.value.find(function (x) { return x.id === id; });
                            if (r)
                                sourceKindMap[id] = (_a = r.sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value;
                        };
                        for (_i = 0, ids_4 = ids; _i < ids_4.length; _i++) {
                            id = ids_4[_i];
                            _loop_11(id);
                        }
                        return [4 /*yield*/, recipeTestApi_1.recipeTestApi.deleteFiles(eqpId.value, items, getActorName(), getActorTeam())];
                    case 1:
                        res = _d.sent();
                        void loadHistory();
                        deletedNames_3 = new Set(((_b = res.deleted) !== null && _b !== void 0 ? _b : []).map(function (x) { return x.name; }));
                        deletedIds = ids.filter(function (id) {
                            var r = allRecipes.value.find(function (x) { return x.id === id; });
                            return !r && deletedNames_3.has(r.name);
                        });
                        syncRecipeCacheAfterDelete(deletedIds, sourceKindMap);
                        if (deletedIds.includes(lastRecipe.value)) {
                            selectedRecipes.clear();
                            selectedRecipes.add('R_NONE');
                            lastRecipe.value = 'R_NONE';
                            setRecipeFindProgram('');
                        }
                        if ((_c = res.failed) === null || _c === void 0 ? void 0 : _c.length) {
                            window.alert("RECIPE \uC0AD\uC81C \uBD80\uBD84 \uC2E4\uD328\n".concat(res.failed.map(function (x) { return "- ".concat(x.name, ": ").concat(x.reason); }).join('\n')));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        err_19 = _d.sent();
                        window.alert("RECIPE \uC0AD\uC81C \uC2E4\uD328: ".concat(getErrorMessage(err_19)));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        onNo: function () { }
    });
}
/** Reset Actions Layer */
function resetCasSelectionOnly() {
    selectedCas.clear();
    lastCas.value = '';
    setCasQueryProgram('');
    casCursorIdx.value = null;
    casAnchorIdx.value = null;
}
function resetJobSelectionOnly() {
    selectedJobs.clear();
    lastJob.value = '';
    setJobQueryProgram('');
    jobCursorIdx.value = null;
    jobAnchorIdx.value = null;
}
function resetPageToBlank() {
    resetCasSelectionOnly();
    resetJobSelectionOnly();
    selectedRecipes.clear();
    selectedRecipes.add('R_NONE');
    lastRecipe.value = 'R_NONE';
    setRecipeFindProgram('');
    recipeCursorIdx.value = null;
    recipeAnchorIdx.value = null;
    casTab.value = 'standard';
    activePane.value = 'casList';
    keyboardControlMode.value = 'cas';
    casEditMode.value = false;
    jobEditMode.value = false;
    recipeEditMode.value = false;
    clearCasCellSelection();
    recipePanelOpen.value = false;
    ctxMenu.open = false;
    jobListAttention.value = false;
}
/** Global Dom Clicks Context Interceptor */
function onGlobalClickCapture(ev) {
    var _a, _b, _c, _d;
    var target = ev.target;
    if (target.closest('.w97-menu') || target.closest('.w97-modal') || target.closest('.w97-modal-overlay'))
        return;
    ctxMenu.open = false;
    if (casEditMode.value) {
        var insideCasContent = (_a = casContentEl.value) === null || _a === void 0 ? void 0 : _a.contains(target);
        var insideJobList = (_c = (_b = jobScrollEl.value) === null || _b === void 0 ? void 0 : _b.closest('.job-panel')) === null || _c === void 0 ? void 0 : _c.contains(target);
        var insideJobContent = (_d = jobContentEl.value) === null || _d === void 0 ? void 0 : _d.contains(target);
        if (!insideCasContent && !insideJobList && !insideJobContent) {
            casCancelRequested();
            return;
        }
    }
    if (jobEditMode.value) {
        var box = jobContentEl.value;
        if (box && !box.contains(target)) {
            jobCancelRequested();
            return;
        }
    }
    if (recipePanelOpen.value) {
        if (Date.now() < suppressOutsideCloseUntil)
            return;
        var panel = legacyPanelEl.value;
        if (panel && panel.contains(target))
            return;
        closeRecipePanel();
    }
}
/** Keyboard Accelerator Interceptor Routing */
function isTypingTarget(ev) {
    var _a;
    var t = ev.target;
    if (!t)
        return false;
    if ((_a = t.classList) === null || _a === void 0 ? void 0 : _a.contains('w97-find'))
        return false;
    var tag = (t.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
}
function moveRecipePickerByArrow(ev) {
    var list = filteredRecipePickerList.value;
    if (!list.length)
        return;
    var vertical = (ev.key === 'ArrowUp' || ev.key === 'ArrowDown');
    var dir = (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') ? -1 : +1;
    var currentIdx = Math.max(0, list.findIndex(function (r) { return r.id === recipePicker.previewId; }));
    var step = vertical ? 1 : RECIPE_PER_COL;
    var nextIdx = Math.min(list.length - 1, Math.max(0, currentIdx + dir * step));
    var id = list[nextIdx].id;
    recipePicker.previewId = id;
    recipePickerAnchorIdx.value = nextIdx;
    scrollIntoView(recipePickerRefs, id);
    void ensureRecipeDetailById(id);
}
function onKeyDown(ev) {
    var _a;
    if (recipePicker.open) {
        if (ev.key === 'Escape') {
            ev.preventDefault();
            closeRecipePicker();
            return;
        }
        if (!isTypingTarget(ev) && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) {
            ev.preventDefault();
            moveRecipePickerByArrow(ev);
            return;
        }
        if (!isTypingTarget(ev) && ev.key === 'Enter') {
            ev.preventDefault();
            if (previewRecipe.value)
                pickRecipeForJob(previewRecipe.value);
            return;
        }
    }
    if (isTypingTarget(ev))
        return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key))
        return;
    ev.preventDefault();
    var vertical = (ev.key === 'ArrowUp' || ev.key === 'ArrowDown');
    var dir = (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') ? -1 : +1;
    if (keyboardControlMode.value === 'cas') {
        var list = casDisplayItems.value.map(function (x) { return x.name; });
        if (!list.length)
            return;
        var idx = getVisibleIndex(list, selectedCas, lastCas.value, casCursorIdx.value);
        var step = vertical ? 1 : CAS_PER_COL;
        var nextIdx = Math.min(list.length - 1, Math.max(0, idx + dir * step));
        var id = list[nextIdx];
        selectedCas.clear();
        selectedCas.add(id);
        lastCas.value = id;
        casCursorIdx.value = nextIdx;
        setCasQueryProgram(displayCasName(id));
        scrollIntoView(casRefs, id);
        applyCasToJobsFromSelection();
        activePane.value = 'casList';
        if (id !== CAS_NONE_ID)
            void fetchCasContent(id);
        keyboardControlMode.value = 'cas';
        return;
    }
    if (keyboardControlMode.value === 'job') {
        var list = jobDisplayItems.value;
        if (!list.length)
            return;
        var idx = getVisibleIndex(list.map(function (j) { return j.id; }), selectedJobs, lastJob.value, jobCursorIdx.value);
        var step = vertical ? 1 : JOB_PER_COL;
        var nextIdx = Math.min(list.length - 1, Math.max(0, idx + dir * step));
        var id = list[nextIdx].id;
        selectedJobs.clear();
        selectedJobs.add(id);
        lastJob.value = id;
        jobCursorIdx.value = nextIdx;
        setJobQueryProgram(displayJobName(list[nextIdx].jobName));
        scrollIntoView(jobRefs, id);
        activePane.value = 'jobList';
        if (id !== JOB_NONE_ID)
            void fetchJobContent(id);
        keyboardControlMode.value = 'job';
        return;
    }
    if (keyboardControlMode.value === 'recipe') {
        if (!recipePanelOpen.value)
            return;
        var list = allRecipes.value;
        var idx = recipeCursorIdx.value !== null ? recipeCursorIdx.value : Math.max(0, list.findIndex(function (r) { return r.id === lastRecipe.value; }));
        var step = vertical ? 1 : RECIPE_PER_COL;
        var nextIdx = Math.min(list.length - 1, Math.max(0, idx + dir * step));
        var id = list[nextIdx].id;
        selectedRecipes.clear();
        selectedRecipes.add(id);
        lastRecipe.value = id;
        recipeCursorIdx.value = nextIdx;
        setRecipeFindProgram(displayRecipeName(list[nextIdx].name, (_a = list[nextIdx].sourceKind) !== null && _a !== void 0 ? _a : activeRecipeSourceKind.value));
        scrollIntoView(recipeRefs, id);
        void ensureRecipeDetailById(id);
        keyboardControlMode.value = 'recipe';
        activePane.value = 'recipeArea';
    }
}
var casTableHeaders = ['Slot#', 'JobName'];
var tableColWidths = (0, vue_1.reactive)({ cas: [70, 190] });
var resizeState = (0, vue_1.reactive)({
    active: false,
    tableKey: null,
    colIndex: -1,
    startX: 0,
    startLeft: 0,
    startRight: 0
});
function startResize(tableKey, colIndex, e) {
    var widths = tableColWidths[tableKey];
    if (!widths[colIndex + 1])
        return;
    resizeState.active = true;
    resizeState.tableKey = tableKey;
    resizeState.colIndex = colIndex;
    resizeState.startX = e.clientX;
    resizeState.startLeft = widths[colIndex];
    resizeState.startRight = widths[colIndex + 1];
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', stopResize);
}
function onResizeMove(e) {
    if (!resizeState.active || !resizeState.tableKey)
        return;
    var widths = tableColWidths[resizeState.tableKey];
    var minW = 48;
    var delta = e.clientX - resizeState.startX;
    var left = resizeState.startLeft + delta;
    var right = resizeState.startRight - delta;
    if (left < minW) {
        right -= (minW - left);
        left = minW;
    }
    if (right < minW) {
        left -= (minW - right);
        right = minW;
    }
    widths[resizeState.colIndex] = left;
    widths[resizeState.colIndex + 1] = right;
}
function stopResize() {
    resizeState.active = false;
    resizeState.tableKey = null;
    resizeState.colIndex = -1;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', stopResize);
}
function clearLoadedDataState() {
    hasLoadedFiles.value = false;
    casData.value = [];
    jobsData.value = [];
    recipesData.value = [];
    casToJobs.value = {};
    clearObject(casTableMap);
    clearObject(casBaseline);
    clearObject(jobConfigMap);
    clearObject(jobBaseline);
    clearObject(jobParsedMap);
    clearObject(jobMissingRecipeMapById);
    clearObject(recipeSourceCache);
    clearObject(recipeSourceTitleMap);
    activeRecipeSourceKind.value = 'recipe';
    resetPageToBlank();
    closeRecipePanel();
    resetCasScrollToLeftTop();
    inventorySnapshotHash.value = '';
    stopInventorySnapshotPolling();
}
function buildRecipeFromSnapshotItem(item, sourceKindOverride) {
    var sourceKind = (sourceKindOverride || item.sourceKind || 'recipe');
    var id = String(item.id || "RCP_SRC::".concat(sourceKind, "::").concat(item.name || ''));
    var name = String(item.name || '');
    var modifiedAt = String(item.modifiedAt || '');
    return NO_PREVIEW_SOURCE_KINDS.has(sourceKind) ? createNoPreviewRecipe(id, name, modifiedAt, sourceKind) : createPlaceholderRecipe(id, name, "".concat(recipeSourceTitleMap[sourceKind] || 'Recipe', " preview placeholder"), modifiedAt, sourceKind);
}
var inventorySnapshotReloading = (0, vue_1.ref)(false);
function applyInventoryRecipeSnapshot(snapshot) {
    var _a;
    if (!snapshot || typeof snapshot !== 'object')
        return;
    inventorySnapshotHash.value = String(snapshot.snapshotHash || '');
    var titles = (snapshot.sourceTitles || {});
    Object.entries(titles).forEach(function (_a) {
        var k = _a[0], v = _a[1];
        recipeSourceTitleMap[k] = String(v || '');
    });
    var nextSourceCache = {};
    var sourceLists = (snapshot.sourceLists || {});
    Object.entries(sourceLists).forEach(function (_a) {
        var kind = _a[0], items = _a[1];
        nextSourceCache[kind] = (Array.isArray(items) ? items : []).map(function (item) { return buildRecipeFromSnapshotItem(item, kind); });
    });
    var recipeUnion = (Array.isArray(snapshot.items) ? snapshot.items : []).map(function (item) { return buildRecipeFromSnapshotItem(item, item.sourceKind || 'recipe'); });
    nextSourceCache.recipe = recipeUnion;
    Object.keys(recipeSourceCache).forEach(function (k) { if (!(k in nextSourceCache))
        delete recipeSourceCache[k]; });
    Object.entries(nextSourceCache).forEach(function (_a) {
        var k = _a[0], v = _a[1];
        recipeSourceCache[k] = v;
    });
    if (activeRecipeSourceKind.value === 'recipe') {
        recipesData.value = __spreadArray([], recipeUnion, true);
        sortRecipesData();
    }
    else if ((_a = recipeSourceCache[activeRecipeSourceKind.value]) === null || _a === void 0 ? void 0 : _a.length) {
        recipesData.value = __spreadArray([], recipeSourceCache[activeRecipeSourceKind.value], true);
        sortRecipesData();
    }
}
function pollInventoryRecipeSnapshot() {
    return __awaiter(this, void 0, void 0, function () {
        var snapshot, nextHash, spec, _a, err_20;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!eqpId.value || !hasLoadedFiles.value || inventorySnapshotReloading.value)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 12, , 13]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.getInventoryRecipeSnapshot(eqpId.value)];
                case 2:
                    snapshot = _b.sent();
                    nextHash = String(snapshot.snapshotHash || '');
                    if (!inventorySnapshotHash.value) {
                        applyInventoryRecipeSnapshot(snapshot);
                        return [2 /*return*/];
                    }
                    if (!(nextHash !== inventorySnapshotHash.value)) return [3 /*break*/, 11];
                    inventorySnapshotReloading.value = true;
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, , 9, 10]);
                    inventorySnapshotHash.value = nextHash;
                    spec = captureReloadRestoreSpec({ keepRecipePanel: recipePanelOpen.value });
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.invalidateRuntimeCache(eqpId.value)];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _a = _b.sent();
                    return [3 /*break*/, 7];
                case 7: return [4 /*yield*/, reloadAndRestoreSelections(spec)];
                case 8:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 9: return [7 /*endfinally*/];
                case 10:
                    {
                        inventorySnapshotReloading.value = false;
                    }
                    _b.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    err_20 = _b.sent();
                    console.warn('inventory snapshot poll failed', err_20);
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
function startInventorySnapshotPolling() {
    stopInventorySnapshotPolling();
    inventorySnapshotTimer = window.setInterval(function () { void pollInventoryRecipeSnapshot(); }, 3000);
}
function stopInventorySnapshotPolling() {
    if (inventorySnapshotTimer !== null) {
        window.clearInterval(inventorySnapshotTimer);
        inventorySnapshotTimer = null;
    }
}
/** Async FTP Remote Loader Execution */
function load(keepRecipePanel) {
    return __awaiter(this, void 0, void 0, function () {
        var res, baseRecipes, err_21;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!eqpId.value) {
                        window.alert('설비ID를 선택한후 Load를 실행하세요.');
                        return [2 /*return*/];
                    }
                    isLoading.value = true;
                    loadingMessage.value = 'FTP 파일과 목록을 불러오는중...';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, recipeTestApi_1.recipeTestApi.load({ line: line.value, team: team.value, eqpId: eqpId.value })];
                case 2:
                    res = _b.sent();
                    baseRecipes = res.recipeList.map(function (r) { var _a; return createPlaceholderRecipe(r.id, r.name, 'Recipe를 선택하면 preview를 불러옵니다.', (_a = r.modifiedAt) !== null && _a !== void 0 ? _a : '', 'recipe'); });
                    recipeSourceCache.recipe = __spreadArray([], baseRecipes, true);
                    recipeSourceTitleMap.recipe = 'Recipe';
                    recipesData.value = __spreadArray([], baseRecipes, true);
                    sortRecipesData();
                    jobsData.value = res.jobList.map(function (j) { var _a; return ({ id: j.id, jobName: j.jobName, modifiedAt: j.modifiedAt, recipe: recipesData.value.find(function (r) { return r.name === j.recipeName; }) || createPlaceholderRecipe("BASE_".concat(j.id), (_a = j.recipeName) !== null && _a !== void 0 ? _a : NONE_LABEL, 'Base recipe summary', '', 'recipe') }); });
                    sortJobsData();
                    casData.value = __spreadArray([], res.casList, true);
                    sortCasData();
                    casToJobs.value = (_a = res.casToJobs) !== null && _a !== void 0 ? _a : {};
                    hasLoadedFiles.value = true;
                    clearObject(casTableMap);
                    clearObject(casBaseline);
                    clearObject(jobConfigMap);
                    clearObject(jobBaseline);
                    clearObject(jobParsedMap);
                    clearObject(recipeSourceCache);
                    clearObject(recipeSourceTitleMap);
                    recipeSourceCache.recipe = __spreadArray([], baseRecipes, true);
                    recipeSourceTitleMap.recipe = 'Recipe';
                    activeRecipeSourceKind.value = 'recipe';
                    inventorySnapshotHash.value = '';
                    startInventorySnapshotPolling();
                    void pollInventoryRecipeSnapshot();
                    resetPageToBlank();
                    if (!keepRecipePanel)
                        closeRecipePanel();
                    resetCasScrollToLeftTop();
                    return [3 /*break*/, 5];
                case 3:
                    err_21 = _b.sent();
                    console.error('load failed:', err_21);
                    clearLoadedDataState();
                    window.alert("Load \uC2E4\uD328: ".concat(getErrorMessage(err_21)));
                    return [3 /*break*/, 5];
                case 4:
                    isLoading.value = false;
                    loadingMessage.value = '';
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/** Dom Lifecycles Context Bindings */
(0, vue_1.onMounted)(function () {
    try {
        actorName.value = window.localStorage.getItem('recipe_test_actor_name') || '';
    }
    catch (_a) { }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('click', onGlobalClickCapture, true);
    window.addEventListener('resize', updateCartOverlayPos);
    window.addEventListener('scroll', updateCartOverlayPos, true);
    void loadEqpOptions();
    resetPageToBlank();
    updateCartOverlayPos();
});
(0, vue_1.onBeforeUnmount)(function () {
    stopInventorySnapshotPolling();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('click', onGlobalClickCapture, true);
    window.removeEventListener('resize', updateCartOverlayPos);
    window.removeEventListener('scroll', updateCartOverlayPos, true);
    stopResize();
    stopListResize();
    stopRecipeResize();
    clearTimeout(scrollBottomTimer);
    clearTimeout(jobAttentionTimer);
});
(0, vue_1.watch)(cartOpen, function (open) {
    if (open)
        (0, vue_1.nextTick)(function () { return updateCartOverlayPos(); });
});
(0, vue_1.watch)(activePane, function () {
    if (lastCas.value && activePane.value !== 'casList') {
        void scrollIntoView(casRefs, lastCas.value);
    }
    if (lastJob.value && activePane.value !== 'jobList') {
        void scrollIntoView(jobRefs, lastJob.value);
    }
});
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['cas-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['job-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['cas-content']} */ ;
/** @type {__VLS_StyleScopedClasses['cas-content']} */ ;
/** @type {__VLS_StyleScopedClasses['content']} */ ;
/** @type {__VLS_StyleScopedClasses['cartDock-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['cartDock-leave-to']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['cartDock-enter-active']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['cartDock-leave-active']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['top-tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)(__assign({ class: "page" }, { tabindex: "0" }));
/** @type {__VLS_StyleScopedClasses['page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "recipe-test-shell" }));
/** @type {__VLS_StyleScopedClasses['recipe-test-shell']} */ ;
var __VLS_0 = RecipeTestHeader_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign(__assign({ 'onLoad': {} }, { 'onReset': {} }), { 'onToggleCart': {} }), { 'onRegisterCartAnchor': {} }), { line: (__VLS_ctx.line), team: (__VLS_ctx.team), eqpId: (__VLS_ctx.eqpId), filteredLineOptions: (__VLS_ctx.filteredLineOptions), filteredTeamOptions: (__VLS_ctx.filteredTeamOptions), filteredEqpOptions: (__VLS_ctx.filteredEqpOptions), isLoading: (__VLS_ctx.isLoading), cartCount: (__VLS_ctx.cartCount), cartOpen: (__VLS_ctx.cartOpen), cartShakeToken: (__VLS_ctx.cartShakeToken) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onLoad': {} }, { 'onReset': {} }), { 'onToggleCart': {} }), { 'onRegisterCartAnchor': {} }), { line: (__VLS_ctx.line), team: (__VLS_ctx.team), eqpId: (__VLS_ctx.eqpId), filteredLineOptions: (__VLS_ctx.filteredLineOptions), filteredTeamOptions: (__VLS_ctx.filteredTeamOptions), filteredEqpOptions: (__VLS_ctx.filteredEqpOptions), isLoading: (__VLS_ctx.isLoading), cartCount: (__VLS_ctx.cartCount), cartOpen: (__VLS_ctx.cartOpen), cartShakeToken: (__VLS_ctx.cartShakeToken) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ load: {} },
    { onLoad: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.load(false);
            // @ts-ignore
            [line, team, eqpId, filteredLineOptions, filteredTeamOptions, filteredEqpOptions, isLoading, cartCount, cartOpen, cartShakeToken, load,];
        } });
var __VLS_7 = ({ reset: {} },
    { onReset: (__VLS_ctx.resetPageToBlank) });
var __VLS_8 = ({ toggleCart: {} },
    { onToggleCart: (__VLS_ctx.toggleCartPanel) });
var __VLS_9 = ({ registerCartAnchor: {} },
    { onRegisterCartAnchor: (__VLS_ctx.setCartAnchor) });
var __VLS_3;
var __VLS_4;
var __VLS_10;
/** @ts-ignore @type { | typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    to: "body",
}));
var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([{
        to: "body",
    }], __VLS_functionalComponentArgsRest(__VLS_11), false));
var __VLS_15 = __VLS_13.slots.default;
var __VLS_16;
/** @ts-ignore @type { | typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
var __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    name: "cartDock",
}));
var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([{
        name: "cartDock",
    }], __VLS_functionalComponentArgsRest(__VLS_17), false));
var __VLS_21 = __VLS_19.slots.default;
if (__VLS_ctx.cartOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ onMousedown: (__VLS_ctx.closeCartOverlay) }, { class: "cart-dismiss-layer" }));
    /** @type {__VLS_StyleScopedClasses['cart-dismiss-layer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onMousedown: function () { } }, { class: "cart-overlay" }), { style: (__VLS_ctx.cartOverlayStyle) }));
    /** @type {__VLS_StyleScopedClasses['cart-overlay']} */ ;
    var __VLS_22 = TransferCartPanel_vue_1.default;
    // @ts-ignore
    var __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22(__assign(__assign(__assign(__assign({ 'onSetTargetEqpIds': {} }, { 'onRemoveItem': {} }), { 'onClear': {} }), { 'onMove': {} }), { open: (__VLS_ctx.cartOpen), items: (__VLS_ctx.cartViewItems), targetOptions: (__VLS_ctx.cartTargetOptions), selectedTargetEqpIds: (__VLS_ctx.selectedCartTargetEqpIds), moving: (__VLS_ctx.cartMoving), cartMaker: (__VLS_ctx.cartMaker), cartModelGroup: (__VLS_ctx.cartModelGroup) })));
    var __VLS_24 = __VLS_23.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onSetTargetEqpIds': {} }, { 'onRemoveItem': {} }), { 'onClear': {} }), { 'onMove': {} }), { open: (__VLS_ctx.cartOpen), items: (__VLS_ctx.cartViewItems), targetOptions: (__VLS_ctx.cartTargetOptions), selectedTargetEqpIds: (__VLS_ctx.selectedCartTargetEqpIds), moving: (__VLS_ctx.cartMoving), cartMaker: (__VLS_ctx.cartMaker), cartModelGroup: (__VLS_ctx.cartModelGroup) })], __VLS_functionalComponentArgsRest(__VLS_23), false));
    var __VLS_27 = void 0;
    var __VLS_28 = ({ setTargetEqpIds: {} },
        { onSetTargetEqpIds: (__VLS_ctx.setCartTargetEqpIds) });
    var __VLS_29 = ({ removeItem: {} },
        { onRemoveItem: (__VLS_ctx.removeCartItem) });
    var __VLS_30 = ({ clear: {} },
        { onClear: (__VLS_ctx.clearCart) });
    var __VLS_31 = ({ move: {} },
        { onMove: (__VLS_ctx.moveCartItems) });
    var __VLS_25;
    var __VLS_26;
}
// @ts-ignore
[cartOpen, cartOpen, resetPageToBlank, toggleCartPanel, setCartAnchor, closeCartOverlay, cartOverlayStyle, cartViewItems, cartTargetOptions, selectedCartTargetEqpIds, cartMoving, cartMaker, cartModelGroup, setCartTargetEqpIds, removeCartItem, clearCart, moveCartItems,];
var __VLS_19;
// @ts-ignore
[];
var __VLS_13;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cart-fly-layer" }));
/** @type {__VLS_StyleScopedClasses['cart-fly-layer']} */ ;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.cartFlyTokens)); _i < _a.length; _i++) {
    var token = _a[_i][0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ key: (token.id) }, { class: "cart-fly-token" }), { style: ({ transform: "translate(".concat(token.tx, "px, ").concat(token.ty, "px)") }) }));
    /** @type {__VLS_StyleScopedClasses['cart-fly-token']} */ ;
    (token.label);
    // @ts-ignore
    [cartFlyTokens,];
}
var __VLS_32 = LoadingOverlay_vue_1.default;
// @ts-ignore
var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    visible: (__VLS_ctx.isLoading),
    message: (__VLS_ctx.loadingMessage),
}));
var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([{
        visible: (__VLS_ctx.isLoading),
        message: (__VLS_ctx.loadingMessage),
    }], __VLS_functionalComponentArgsRest(__VLS_33), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "grid" }));
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
var __VLS_37 = CasFileListPanel_vue_1.default;
// @ts-ignore
var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onActivate': {} }, { 'onOpenMenu': {} }), { 'onSearch': {} }), { 'onToggleSort': {} }), { 'onStartResize': {} }), { 'onBodyScroll': {} }), { 'onItemClick': {} }), { 'onItemContextmenu': {} }), { 'onRegisterItemRef': {} }), { 'onRegisterScrollEl': {} }), { 'onUpdate:listMode': {} }), { modelValue: (__VLS_ctx.casQueryModel), paneFocus: (__VLS_ctx.activePane === 'casList'), panelStyle: (__VLS_ctx.casPanelStyle), queryClass: (__VLS_ctx.casClass), findClass: (__VLS_ctx.casFindClass), casCols: (__VLS_ctx.casCols), selectedIds: (__VLS_ctx.selectedCasIds), colWidths: (__VLS_ctx.casListColWidths), sortKey: (__VLS_ctx.casSortKey), sortDir: (__VLS_ctx.casSortDir) })));
var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onActivate': {} }, { 'onOpenMenu': {} }), { 'onSearch': {} }), { 'onToggleSort': {} }), { 'onStartResize': {} }), { 'onBodyScroll': {} }), { 'onItemClick': {} }), { 'onItemContextmenu': {} }), { 'onRegisterItemRef': {} }), { 'onRegisterScrollEl': {} }), { 'onUpdate:listMode': {} }), { modelValue: (__VLS_ctx.casQueryModel), paneFocus: (__VLS_ctx.activePane === 'casList'), panelStyle: (__VLS_ctx.casPanelStyle), queryClass: (__VLS_ctx.casClass), findClass: (__VLS_ctx.casFindClass), casCols: (__VLS_ctx.casCols), selectedIds: (__VLS_ctx.selectedCasIds), colWidths: (__VLS_ctx.casListColWidths), sortKey: (__VLS_ctx.casSortKey), sortDir: (__VLS_ctx.casSortDir) })], __VLS_functionalComponentArgsRest(__VLS_38), false));
var __VLS_42;
var __VLS_43 = ({ activate: {} },
    { onActivate: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.activateArea('casList', 'cas');
            // @ts-ignore
            [isLoading, loadingMessage, casQueryModel, activePane, casPanelStyle, casClass, casFindClass, casCols, selectedCasIds, casListColWidths, casSortKey, casSortDir, activateArea,];
        } });
var __VLS_44 = ({ openMenu: {} },
    { onOpenMenu: (__VLS_ctx.onCasListMenu) });
var __VLS_45 = ({ search: {} },
    { onSearch: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.applyCasSearch(true);
            // @ts-ignore
            [onCasListMenu, applyCasSearch,];
        } });
var __VLS_46 = ({ toggleSort: {} },
    { onToggleSort: (__VLS_ctx.onCasSortToggle) });
var __VLS_47 = ({ startResize: {} },
    { onStartResize: (__VLS_ctx.onCasListResize) });
var __VLS_48 = ({ bodyScroll: {} },
    { onBodyScroll: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.onListBodyScroll('cas');
            // @ts-ignore
            [onCasSortToggle, onCasListResize, onListBodyScroll,];
        } });
var __VLS_49 = ({ itemClick: {} },
    { onItemClick: (__VLS_ctx.onCasListItemClick) });
var __VLS_50 = ({ itemContextmenu: {} },
    { onItemContextmenu: (__VLS_ctx.onCasListItemContextMenu) });
var __VLS_51 = ({ registerItemRef: {} },
    { onRegisterItemRef: (__VLS_ctx.onCasItemRef) });
var __VLS_52 = ({ registerScrollEl: {} },
    { onRegisterScrollEl: (__VLS_ctx.setCasScrollEl) });
var __VLS_53 = ({ 'update:listMode': {} },
    { 'onUpdate:listMode': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.casListMode = $event;
            // @ts-ignore
            [onCasListItemClick, onCasListItemContextMenu, onCasItemRef, setCasScrollEl, casListMode,];
        } });
var __VLS_40;
var __VLS_41;
var __VLS_54 = CasContentPanel_vue_1.default;
// @ts-ignore
var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onActivate': {} }, { 'onOpenMenu': {} }), { 'onRegisterRoot': {} }), { 'onUpdate:tab': {} }), { 'onSaveAs': {} }), { 'onEnterEdit': {} }), { 'onSave': {} }), { 'onCancel': {} }), { 'onHeaderClick': {} }), { 'onCellClick': {} }), { 'onStartResize': {} }), { visible: (__VLS_ctx.casContentVisible), paneFocus: (__VLS_ctx.activePane === 'casContent'), panelStyle: (__VLS_ctx.casContentStyle), casIdDisplay: (__VLS_ctx.casSelectedSingleDisplay), editMode: (__VLS_ctx.casEditMode), tab: (__VLS_ctx.casTab), tabLabel: (__VLS_ctx.casTabLabel), tableRows: (__VLS_ctx.casTableRows), tableHeaders: (__VLS_ctx.casTableHeaders), tableColWidths: (__VLS_ctx.tableColWidths.cas), selectedSlots: (__VLS_ctx.selectedSlotNumbers) })));
var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onActivate': {} }, { 'onOpenMenu': {} }), { 'onRegisterRoot': {} }), { 'onUpdate:tab': {} }), { 'onSaveAs': {} }), { 'onEnterEdit': {} }), { 'onSave': {} }), { 'onCancel': {} }), { 'onHeaderClick': {} }), { 'onCellClick': {} }), { 'onStartResize': {} }), { visible: (__VLS_ctx.casContentVisible), paneFocus: (__VLS_ctx.activePane === 'casContent'), panelStyle: (__VLS_ctx.casContentStyle), casIdDisplay: (__VLS_ctx.casSelectedSingleDisplay), editMode: (__VLS_ctx.casEditMode), tab: (__VLS_ctx.casTab), tabLabel: (__VLS_ctx.casTabLabel), tableRows: (__VLS_ctx.casTableRows), tableHeaders: (__VLS_ctx.casTableHeaders), tableColWidths: (__VLS_ctx.tableColWidths.cas), selectedSlots: (__VLS_ctx.selectedSlotNumbers) })], __VLS_functionalComponentArgsRest(__VLS_55), false));
var __VLS_59;
var __VLS_60 = ({ activate: {} },
    { onActivate: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.activateArea('casContent', 'cas');
            // @ts-ignore
            [activePane, activateArea, casContentVisible, casContentStyle, casSelectedSingleDisplay, casEditMode, casTab, casTabLabel, casTableRows, casTableHeaders, tableColWidths, selectedSlotNumbers,];
        } });
var __VLS_61 = ({ openMenu: {} },
    { onOpenMenu: (__VLS_ctx.onCasContentMenu) });
var __VLS_62 = ({ registerRoot: {} },
    { onRegisterRoot: (__VLS_ctx.setCasContentRoot) });
var __VLS_63 = ({ 'update:tab': {} },
    { 'onUpdate:tab': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.casTab = $event;
            // @ts-ignore
            [casTab, onCasContentMenu, setCasContentRoot,];
        } });
var __VLS_64 = ({ saveAs: {} },
    { onSaveAs: (__VLS_ctx.casContentSaveAs) });
var __VLS_65 = ({ enterEdit: {} },
    { onEnterEdit: (__VLS_ctx.casContentEnterEdit) });
var __VLS_66 = ({ save: {} },
    { onSave: (__VLS_ctx.casSaveClicked) });
var __VLS_67 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.casCancelRequested) });
var __VLS_68 = ({ headerClick: {} },
    { onHeaderClick: (__VLS_ctx.onCasTableHeaderClick) });
var __VLS_69 = ({ cellClick: {} },
    { onCellClick: (__VLS_ctx.onCasContentCellClick) });
var __VLS_70 = ({ startResize: {} },
    { onStartResize: (__VLS_ctx.onCasContentResize) });
var __VLS_57;
var __VLS_58;
var __VLS_71 = JobFileListPanel_vue_1.default;
// @ts-ignore
var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onActivate': {} }, { 'onOpenMenu': {} }), { 'onSearch': {} }), { 'onToggleSort': {} }), { 'onStartResize': {} }), { 'onBodyScroll': {} }), { 'onItemClick': {} }), { 'onItemContextmenu': {} }), { 'onRegisterItemRef': {} }), { 'onRegisterScrollEl': {} }), { 'onUpdate:listMode': {} }), { modelValue: (__VLS_ctx.jobQueryModel), paneFocus: (__VLS_ctx.activePane === 'jobList'), attention: (__VLS_ctx.jobListAttention), panelStyle: (__VLS_ctx.jobPanelStyle), queryClass: (__VLS_ctx.jobClass), findClass: (__VLS_ctx.jobFindClass), jobCols: (__VLS_ctx.jobCols), selectedIds: (__VLS_ctx.selectedJobIds), colWidths: (__VLS_ctx.jobListColWidths), sortKey: (__VLS_ctx.jobSortKey), sortDir: (__VLS_ctx.jobSortDir) })));
var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onActivate': {} }, { 'onOpenMenu': {} }), { 'onSearch': {} }), { 'onToggleSort': {} }), { 'onStartResize': {} }), { 'onBodyScroll': {} }), { 'onItemClick': {} }), { 'onItemContextmenu': {} }), { 'onRegisterItemRef': {} }), { 'onRegisterScrollEl': {} }), { 'onUpdate:listMode': {} }), { modelValue: (__VLS_ctx.jobQueryModel), paneFocus: (__VLS_ctx.activePane === 'jobList'), attention: (__VLS_ctx.jobListAttention), panelStyle: (__VLS_ctx.jobPanelStyle), queryClass: (__VLS_ctx.jobClass), findClass: (__VLS_ctx.jobFindClass), jobCols: (__VLS_ctx.jobCols), selectedIds: (__VLS_ctx.selectedJobIds), colWidths: (__VLS_ctx.jobListColWidths), sortKey: (__VLS_ctx.jobSortKey), sortDir: (__VLS_ctx.jobSortDir) })], __VLS_functionalComponentArgsRest(__VLS_72), false));
var __VLS_76;
var __VLS_77 = ({ activate: {} },
    { onActivate: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.activateArea('jobList', 'job');
            // @ts-ignore
            [activePane, activateArea, casContentSaveAs, casContentEnterEdit, casSaveClicked, casCancelRequested, onCasTableHeaderClick, onCasContentCellClick, onCasContentResize, jobQueryModel, jobListAttention, jobPanelStyle, jobClass, jobFindClass, jobCols, selectedJobIds, jobListColWidths, jobSortKey, jobSortDir,];
        } });
var __VLS_78 = ({ openMenu: {} },
    { onOpenMenu: (__VLS_ctx.onJobListMenu) });
var __VLS_79 = ({ search: {} },
    { onSearch: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.applyJobSearch(true);
            // @ts-ignore
            [onJobListMenu, applyJobSearch,];
        } });
var __VLS_80 = ({ toggleSort: {} },
    { onToggleSort: (__VLS_ctx.onJobSortToggle) });
var __VLS_81 = ({ startResize: {} },
    { onStartResize: (__VLS_ctx.onJobListResize) });
var __VLS_82 = ({ bodyScroll: {} },
    { onBodyScroll: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.onListBodyScroll('job');
            // @ts-ignore
            [onListBodyScroll, onJobSortToggle, onJobListResize,];
        } });
var __VLS_83 = ({ itemClick: {} },
    { onItemClick: (__VLS_ctx.onJobListItemClick) });
var __VLS_84 = ({ itemContextmenu: {} },
    { onItemContextmenu: (__VLS_ctx.onJobListItemContextMenu) });
var __VLS_85 = ({ registerItemRef: {} },
    { onRegisterItemRef: (__VLS_ctx.onJobItemRef) });
var __VLS_86 = ({ registerScrollEl: {} },
    { onRegisterScrollEl: (__VLS_ctx.setJobScrollEl) });
var __VLS_87 = ({ 'update:listMode': {} },
    { 'onUpdate:listMode': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.jobListMode = $event;
            // @ts-ignore
            [onJobListItemClick, onJobListItemContextMenu, onJobItemRef, setJobScrollEl, jobListMode,];
        } });
var __VLS_74;
var __VLS_75;
var __VLS_88 = JobContentPanel_vue_1.default;
// @ts-ignore
var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onActivate': {} }, { 'onOpenMenu': {} }), { 'onRegisterContentEl': {} }), { 'onEnterEdit': {} }), { 'onSave': {} }), { 'onCancel': {} }), { 'onToggleFlag': {} }), { 'onValueClick': {} }), { show: (__VLS_ctx.showJobContent), paneFocus: (__VLS_ctx.activePane === 'jobContent'), panelStyle: (__VLS_ctx.contentPaneStyle), paneHeight: (__VLS_ctx.paneHeight), jobName: (__VLS_ctx.selectedJobDisplayName), editMode: (__VLS_ctx.jobEditMode), parsed: (__VLS_ctx.selectedJobParsed), noneLabel: (__VLS_ctx.NONE_LABEL), missingRecipeMap: (__VLS_ctx.selectedJobMissingRecipeMap) })));
var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onActivate': {} }, { 'onOpenMenu': {} }), { 'onRegisterContentEl': {} }), { 'onEnterEdit': {} }), { 'onSave': {} }), { 'onCancel': {} }), { 'onToggleFlag': {} }), { 'onValueClick': {} }), { show: (__VLS_ctx.showJobContent), paneFocus: (__VLS_ctx.activePane === 'jobContent'), panelStyle: (__VLS_ctx.contentPaneStyle), paneHeight: (__VLS_ctx.paneHeight), jobName: (__VLS_ctx.selectedJobDisplayName), editMode: (__VLS_ctx.jobEditMode), parsed: (__VLS_ctx.selectedJobParsed), noneLabel: (__VLS_ctx.NONE_LABEL), missingRecipeMap: (__VLS_ctx.selectedJobMissingRecipeMap) })], __VLS_functionalComponentArgsRest(__VLS_89), false));
var __VLS_93;
var __VLS_94 = ({ activate: {} },
    { onActivate: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.activateArea('jobContent', 'job');
            // @ts-ignore
            [activePane, activateArea, showJobContent, contentPaneStyle, paneHeight, selectedJobDisplayName, jobEditMode, selectedJobParsed, NONE_LABEL, selectedJobMissingRecipeMap,];
        } });
var __VLS_95 = ({ openMenu: {} },
    { onOpenMenu: (__VLS_ctx.onJobContentMenu) });
var __VLS_96 = ({ registerContentEl: {} },
    { onRegisterContentEl: (__VLS_ctx.setJobContentRoot) });
var __VLS_97 = ({ enterEdit: {} },
    { onEnterEdit: (__VLS_ctx.jobContentEnterEdit) });
var __VLS_98 = ({ save: {} },
    { onSave: (__VLS_ctx.jobSaveClicked) });
var __VLS_99 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.jobCancelRequested) });
var __VLS_100 = ({ toggleFlag: {} },
    { onToggleFlag: (__VLS_ctx.onJobParsedToggleFlag) });
var __VLS_101 = ({ valueClick: {} },
    { onValueClick: (__VLS_ctx.onJobParsedValueClick) });
var __VLS_91;
var __VLS_92;
var __VLS_102 = RecipePanel_vue_1.default;
// @ts-ignore
var __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onActivate': {} }, { 'onAreaClick': {} }), { 'onOpenMenu': {} }), { 'onApplyFind': {} }), { 'onClose': {} }), { 'onPick': {} }), { 'onItemContextmenu': {} }), { 'onRegisterItemRef': {} }), { 'onRegisterRoot': {} }), { 'onUpdate:listMode': {} }), { 'onBodyScroll': {} }), { 'onStartResize': {} }), { 'onRegisterScrollEl': {} }), { open: (__VLS_ctx.recipePanelOpen), activePlaten: (__VLS_ctx.activePlaten), findModel: (__VLS_ctx.recipeFindModel), findClass: (__VLS_ctx.recipeFindClass), recipeCols: (__VLS_ctx.recipeCols), selectedRecipeIds: (__VLS_ctx.selectedRecipeIds), selectedRecipeSingle: (__VLS_ctx.selectedRecipeSingle), titleBase: (__VLS_ctx.recipePanelTitleBase), emphasizeText: (__VLS_ctx.recipePanelEmphasizeText), editMode: (__VLS_ctx.recipeEditMode), listMode: (__VLS_ctx.recipeListMode), scrollLeft: (__VLS_ctx.recipeScrollLeft), colWidths: (__VLS_ctx.recipeListColWidths) })));
var __VLS_104 = __VLS_103.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onActivate': {} }, { 'onAreaClick': {} }), { 'onOpenMenu': {} }), { 'onApplyFind': {} }), { 'onClose': {} }), { 'onPick': {} }), { 'onItemContextmenu': {} }), { 'onRegisterItemRef': {} }), { 'onRegisterRoot': {} }), { 'onUpdate:listMode': {} }), { 'onBodyScroll': {} }), { 'onStartResize': {} }), { 'onRegisterScrollEl': {} }), { open: (__VLS_ctx.recipePanelOpen), activePlaten: (__VLS_ctx.activePlaten), findModel: (__VLS_ctx.recipeFindModel), findClass: (__VLS_ctx.recipeFindClass), recipeCols: (__VLS_ctx.recipeCols), selectedRecipeIds: (__VLS_ctx.selectedRecipeIds), selectedRecipeSingle: (__VLS_ctx.selectedRecipeSingle), titleBase: (__VLS_ctx.recipePanelTitleBase), emphasizeText: (__VLS_ctx.recipePanelEmphasizeText), editMode: (__VLS_ctx.recipeEditMode), listMode: (__VLS_ctx.recipeListMode), scrollLeft: (__VLS_ctx.recipeScrollLeft), colWidths: (__VLS_ctx.recipeListColWidths) })], __VLS_functionalComponentArgsRest(__VLS_103), false));
var __VLS_107;
var __VLS_108 = ({ activate: {} },
    { onActivate: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.activateArea('recipeArea', 'recipe');
            // @ts-ignore
            [activateArea, onJobContentMenu, setJobContentRoot, jobContentEnterEdit, jobSaveClicked, jobCancelRequested, onJobParsedToggleFlag, onJobParsedValueClick, recipePanelOpen, activePlaten, recipeFindModel, recipeFindClass, recipeCols, selectedRecipeIds, selectedRecipeSingle, recipePanelTitleBase, recipePanelEmphasizeText, recipeEditMode, recipeListMode, recipeScrollLeft, recipeListColWidths,];
        } });
var __VLS_109 = ({ areaClick: {} },
    { onAreaClick: (__VLS_ctx.onRecipeAreaClick) });
var __VLS_110 = ({ openMenu: {} },
    { onOpenMenu: (__VLS_ctx.onRecipeListMenu) });
var __VLS_111 = ({ applyFind: {} },
    { onApplyFind: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.applyRecipeFind(true);
            // @ts-ignore
            [onRecipeAreaClick, onRecipeListMenu, applyRecipeFind,];
        } });
var __VLS_112 = ({ close: {} },
    { onClose: (__VLS_ctx.closeRecipePanel) });
var __VLS_113 = ({ pick: {} },
    { onPick: (__VLS_ctx.onRecipePanelPick) });
var __VLS_114 = ({ itemContextmenu: {} },
    { onItemContextmenu: (__VLS_ctx.onRecipeListItemContextMenu) });
var __VLS_115 = ({ registerItemRef: {} },
    { onRegisterItemRef: (__VLS_ctx.onRecipeItemRef) });
var __VLS_116 = ({ registerRoot: {} },
    { onRegisterRoot: (__VLS_ctx.setRecipePanelRoot) });
var __VLS_117 = ({ 'update:listMode': {} },
    { 'onUpdate:listMode': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.recipeListMode = $event;
            // @ts-ignore
            [recipeListMode, closeRecipePanel, onRecipePanelPick, onRecipeListItemContextMenu, onRecipeItemRef, setRecipePanelRoot,];
        } });
var __VLS_118 = ({ bodyScroll: {} },
    { onBodyScroll: (__VLS_ctx.onRecipeBodyScroll) });
var __VLS_119 = ({ startResize: {} },
    { onStartResize: (__VLS_ctx.onRecipeListResize) });
var __VLS_120 = ({ registerScrollEl: {} },
    { onRegisterScrollEl: (__VLS_ctx.setRecipeScrollEl) });
var __VLS_105;
var __VLS_106;
var __VLS_121 = Win97ContextMenu_vue_1.default;
// @ts-ignore
var __VLS_122 = __VLS_asFunctionalComponent1(__VLS_121, new __VLS_121({
    open: (__VLS_ctx.ctxMenu.open),
    x: (__VLS_ctx.ctxMenu.x),
    y: (__VLS_ctx.ctxMenu.y),
    items: (__VLS_ctx.ctxMenu.items),
}));
var __VLS_123 = __VLS_122.apply(void 0, __spreadArray([{
        open: (__VLS_ctx.ctxMenu.open),
        x: (__VLS_ctx.ctxMenu.x),
        y: (__VLS_ctx.ctxMenu.y),
        items: (__VLS_ctx.ctxMenu.items),
    }], __VLS_functionalComponentArgsRest(__VLS_122), false));
var __VLS_126 = Win97ConfirmDialog_vue_1.default;
// @ts-ignore
var __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126(__assign(__assign({ 'onYes': {} }, { 'onNo': {} }), { open: (__VLS_ctx.confirmModal.open), title: (__VLS_ctx.confirmModal.title), tone: (__VLS_ctx.confirmModal.tone), message: (__VLS_ctx.confirmModal.message) })));
var __VLS_128 = __VLS_127.apply(void 0, __spreadArray([__assign(__assign({ 'onYes': {} }, { 'onNo': {} }), { open: (__VLS_ctx.confirmModal.open), title: (__VLS_ctx.confirmModal.title), tone: (__VLS_ctx.confirmModal.tone), message: (__VLS_ctx.confirmModal.message) })], __VLS_functionalComponentArgsRest(__VLS_127), false));
var __VLS_131;
var __VLS_132 = ({ yes: {} },
    { onYes: (__VLS_ctx.confirmYes) });
var __VLS_133 = ({ no: {} },
    { onNo: (__VLS_ctx.confirmNo) });
var __VLS_129;
var __VLS_130;
var __VLS_134 = RecipePickerDialog_vue_1.default;
// @ts-ignore
var __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onApplyFind': {} }, { 'onItemClick': {} }), { 'onSelect': {} }), { 'onClose': {} }), { 'onRegisterItemRef': {} }), { 'onUpdate:listMode': {} }), { 'onBodyScroll': {} }), { 'onStartResize': {} }), { 'onRegisterScrollEl': {} }), { open: (__VLS_ctx.recipePicker.open), findClass: (__VLS_ctx.recipePickerFindClass), hint: (__VLS_ctx.recipePickerHint), query: (__VLS_ctx.recipePickerQueryModel), platen: (__VLS_ctx.recipePicker.platen), recipeCols: (__VLS_ctx.recipePickerCols), previewId: (__VLS_ctx.previewRecipe) })));
var __VLS_136 = __VLS_135.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onApplyFind': {} }, { 'onItemClick': {} }), { 'onSelect': {} }), { 'onClose': {} }), { 'onRegisterItemRef': {} }), { 'onUpdate:listMode': {} }), { 'onBodyScroll': {} }), { 'onStartResize': {} }), { 'onRegisterScrollEl': {} }), { open: (__VLS_ctx.recipePicker.open), findClass: (__VLS_ctx.recipePickerFindClass), hint: (__VLS_ctx.recipePickerHint), query: (__VLS_ctx.recipePickerQueryModel), platen: (__VLS_ctx.recipePicker.platen), recipeCols: (__VLS_ctx.recipePickerCols), previewId: (__VLS_ctx.previewRecipe) })], __VLS_functionalComponentArgsRest(__VLS_135), false));
var __VLS_139;
var __VLS_140 = ({ applyFind: {} },
    { onApplyFind: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.applyRecipePickerFind(true);
            // @ts-ignore
            [onRecipeBodyScroll, onRecipeListResize, setRecipeScrollEl, ctxMenu, ctxMenu, ctxMenu, ctxMenu, confirmModal, confirmModal, confirmModal, confirmModal, confirmYes, confirmNo, recipePicker, recipePicker, recipePickerFindClass, recipePickerHint, recipePickerQueryModel, recipePickerCols, previewRecipe, applyRecipePickerFind,];
        } });
var __VLS_141 = ({ itemClick: {} },
    { onItemClick: (__VLS_ctx.onRecipePickerItemClick) });
var __VLS_142 = ({ select: {} },
    { onSelect: (__VLS_ctx.pickRecipeForJob) });
var __VLS_143 = ({ close: {} },
    { onClose: (__VLS_ctx.closeRecipePicker) });
var __VLS_144 = ({ registerItemRef: {} },
    { onRegisterItemRef: (__VLS_ctx.onRecipePickerItemRef) });
var __VLS_145 = ({ 'update:listMode': {} },
    { 'onUpdate:listMode': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.recipePickerListMode = $event;
            // @ts-ignore
            [onRecipePickerItemClick, pickRecipeForJob, closeRecipePicker, onRecipePickerItemRef, recipePickerListMode,];
        } });
var __VLS_146 = ({ bodyScroll: {} },
    { onBodyScroll: (__VLS_ctx.onRecipePickerBodyScroll) });
var __VLS_147 = ({ startResize: {} },
    { onStartResize: (__VLS_ctx.onRecipePickerListResize) });
var __VLS_148 = ({ registerScrollEl: {} },
    { onRegisterScrollEl: (__VLS_ctx.setRecipePickerScrollEl) });
var __VLS_137;
var __VLS_138;
// @ts-ignore
[onRecipePickerBodyScroll, onRecipePickerListResize, setRecipePickerScrollEl,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () { return __VLS_exposed; },
});
exports.default = {};
