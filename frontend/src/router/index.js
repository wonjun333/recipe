"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vue_router_1 = require("vue-router");
var routes = [
    {
        path: '/',
        redirect: '/recipe-test',
    },
    {
        path: '/recipe',
        redirect: '/recipe-test',
    },
    {
        path: '/recipe-test',
        component: function () { return Promise.resolve().then(function () { return require('../features/recipe_test/pages/RecipeTestPage.vue'); }); },
    },
    {
        path: '/history',
        component: function () { return Promise.resolve().then(function () { return require('../features/history/pages/MyHistoryPage.vue'); }); },
    },
];
var router = (0, vue_router_1.createRouter)({
    history: (0, vue_router_1.createWebHistory)(),
    routes: routes,
});
exports.default = router;
