"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var plugin_vue_1 = require("@vitejs/plugin-vue");
var path_1 = require("path");
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_vue_1.default)()],
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, './src'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5174,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
});
