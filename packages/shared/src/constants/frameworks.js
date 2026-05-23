"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRAMEWORK_CONFIGS = void 0;
const project_1 = require("../types/project");
exports.FRAMEWORK_CONFIGS = {
    [project_1.Framework.NEXTJS]: {
        name: "Next.js",
        buildCmd: "next build",
        outputDir: ".next",
        installCmd: "npm install",
        devCmd: "next dev",
    },
    [project_1.Framework.NUXT]: {
        name: "Nuxt",
        buildCmd: "nuxt build",
        outputDir: ".output",
        installCmd: "npm install",
        devCmd: "nuxt dev",
    },
    [project_1.Framework.VITE]: {
        name: "Vite",
        buildCmd: "vite build",
        outputDir: "dist",
        installCmd: "npm install",
        devCmd: "vite",
    },
    [project_1.Framework.ASTRO]: {
        name: "Astro",
        buildCmd: "astro build",
        outputDir: "dist",
        installCmd: "npm install",
        devCmd: "astro dev",
    },
    [project_1.Framework.REMIX]: {
        name: "Remix",
        buildCmd: "remix build",
        outputDir: "build",
        installCmd: "npm install",
        devCmd: "remix dev",
    },
    [project_1.Framework.STATIC]: {
        name: "Static",
        buildCmd: "echo 'No build required'",
        outputDir: "public",
        installCmd: "npm install",
        devCmd: "npx serve public",
    },
    [project_1.Framework.NODE]: {
        name: "Node.js",
        buildCmd: "echo 'No build required'",
        outputDir: ".",
        installCmd: "npm install",
        devCmd: "npm run dev",
    },
};
//# sourceMappingURL=frameworks.js.map