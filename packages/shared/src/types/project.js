"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitProvider = exports.Framework = void 0;
var Framework;
(function (Framework) {
    Framework["NEXTJS"] = "NEXTJS";
    Framework["NUXT"] = "NUXT";
    Framework["VITE"] = "VITE";
    Framework["ASTRO"] = "ASTRO";
    Framework["REMIX"] = "REMIX";
    Framework["STATIC"] = "STATIC";
    Framework["NODE"] = "NODE";
})(Framework || (exports.Framework = Framework = {}));
var GitProvider;
(function (GitProvider) {
    GitProvider["GITHUB"] = "GITHUB";
    GitProvider["GITLAB"] = "GITLAB";
    GitProvider["BITBUCKET"] = "BITBUCKET";
})(GitProvider || (exports.GitProvider = GitProvider = {}));
//# sourceMappingURL=project.js.map