"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var App_vue_1 = require("./App.vue");
var router_1 = require("./router");
require("./style.css");
console.log('main.ts start');
console.log('router =', router_1.default);
(0, vue_1.createApp)(App_vue_1.default).use(router_1.default).mount('#app');
