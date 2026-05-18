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
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeTestApi = void 0;
var API_BASE = '';
function http(path, init) {
    return __awaiter(this, void 0, void 0, function () {
        var controller, timer, res, text, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller = new AbortController();
                    timer = window.setTimeout(function () { return controller.abort(); }, 60000);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch("".concat(API_BASE).concat(path), __assign(__assign({ headers: {
                                'Content-Type': 'application/json',
                            } }, init), { signal: controller.signal }))];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.text()];
                case 3:
                    text = _a.sent();
                    throw new Error(text || 'API request failed');
                case 4: return [2 /*return*/, res.json()];
                case 5:
                    err_1 = _a.sent();
                    if ((err_1 === null || err_1 === void 0 ? void 0 : err_1.name) === 'AbortError') {
                        throw new Error('응답 대기시간이 초과되었습니다.');
                    }
                    throw err_1;
                case 6:
                    clearTimeout(timer);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.recipeTestApi = {
    getEqpOptions: function () {
        return http('/api/recipe-test/eqp-options');
    },
    load: function (body) {
        return http('/api/recipe-test/load', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },
    getCasContent: function (eqpId, casId) {
        var qs = new URLSearchParams({ eqpId: eqpId, casId: casId }).toString();
        return http("/api/recipe-test/cas-content?".concat(qs));
    },
    getJobContent: function (eqpId, jobId) {
        var qs = new URLSearchParams({ eqpId: eqpId, jobId: jobId }).toString();
        return http("/api/recipe-test/job-content?".concat(qs));
    },
    getRecipeContent: function (eqpId, recipeId) {
        var qs = new URLSearchParams({ eqpId: eqpId, recipeId: recipeId }).toString();
        return http("/api/recipe-test/recipe-content?".concat(qs));
    },
    getRecipeSourceList: function (eqpId, sourceKind) {
        var qs = new URLSearchParams({ eqpId: eqpId, sourceKind: sourceKind }).toString();
        return http("/api/recipe-test/recipe-source-list?".concat(qs));
    },
    saveCas: function (eqpId, casId, slots) {
        return http('/api/recipe-test/cas/save', {
            method: 'POST',
            body: JSON.stringify({ eqpId: eqpId, casId: casId, slots: slots }),
        });
    },
    persistCas: function (eqpId, sourceCasId, targetCasId, slots, actorName, actorTeam) {
        if (actorName === void 0) { actorName = ''; }
        if (actorTeam === void 0) { actorTeam = ''; }
        return http('/api/recipe-test/cas/persist', {
            method: 'POST',
            body: JSON.stringify({ eqpId: eqpId, sourceCasId: sourceCasId, targetCasId: targetCasId, slots: slots, actorName: actorName, actorTeam: actorTeam }),
        });
    },
    saveJob: function (eqpId, jobId, config) {
        return http('/api/recipe-test/job/save', {
            method: 'POST',
            body: JSON.stringify({ eqpId: eqpId, jobId: jobId, config: config }),
        });
    },
    persistJob: function (eqpId, sourceJobId, targetJobName, parsed, actorName, actorTeam) {
        if (actorName === void 0) { actorName = ''; }
        if (actorTeam === void 0) { actorTeam = ''; }
        return http('/api/recipe-test/job/persist', {
            method: 'POST',
            body: JSON.stringify({ eqpId: eqpId, sourceJobId: sourceJobId, targetJobName: targetJobName, parsed: parsed, actorName: actorName, actorTeam: actorTeam }),
        });
    },
    renameFile: function (body) {
        return http('/api/recipe-test/file/rename', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },
    deleteFiles: function (eqpId, items, actorName, actorTeam) {
        if (actorName === void 0) { actorName = ''; }
        if (actorTeam === void 0) { actorTeam = ''; }
        return http('/api/recipe-test/file/delete', {
            method: 'POST',
            body: JSON.stringify({ eqpId: eqpId, items: items, actorName: actorName, actorTeam: actorTeam }),
        });
    },
    transferFiles: function (body) {
        return http('/api/recipe-test/transfer', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },
    getInventoryRecipeSnapshot: function (eqpId) {
        var qs = new URLSearchParams({ eqpId: eqpId }).toString();
        return http("/api/recipe-inventory/snapshot?".concat(qs));
    },
    invalidateRuntimeCache: function (eqpId) {
        return http("/api/recipe-test/invalidate-runtime-cache", {
            method: 'POST',
            body: JSON.stringify({ eqpId: eqpId }),
        });
    },
    getHistory: function (limit) {
        if (limit === void 0) { limit = 500; }
        var qs = new URLSearchParams({ limit: String(limit) }).toString();
        return http("/api/recipe-test/history?".concat(qs));
    },
    cloneRecipe: function (eqpId, sourceRecipeName, targetRecipeName, sourceKind, actorName, actorTeam) {
        if (actorName === void 0) { actorName = ''; }
        if (actorTeam === void 0) { actorTeam = ''; }
        return http('/api/recipe-test/recipe/clone', {
            method: 'POST',
            body: JSON.stringify({ eqpId: eqpId, sourceRecipeName: sourceRecipeName, targetRecipeName: targetRecipeName, sourceKind: sourceKind, actorName: actorName, actorTeam: actorTeam }),
        });
    },
};
