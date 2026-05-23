import { Framework } from "../types/project.js";

export interface FrameworkConfig {
  name: string;
  buildCmd: string;
  outputDir: string;
  installCmd: string;
  devCmd: string;
}

export const FRAMEWORK_CONFIGS: Record<Framework, FrameworkConfig> = {
  [Framework.NEXTJS]: {
    name: "Next.js",
    buildCmd: "next build",
    outputDir: ".next",
    installCmd: "npm install",
    devCmd: "next dev",
  },
  [Framework.NUXT]: {
    name: "Nuxt",
    buildCmd: "nuxt build",
    outputDir: ".output",
    installCmd: "npm install",
    devCmd: "nuxt dev",
  },
  [Framework.VITE]: {
    name: "Vite",
    buildCmd: "vite build",
    outputDir: "dist",
    installCmd: "npm install",
    devCmd: "vite",
  },
  [Framework.ASTRO]: {
    name: "Astro",
    buildCmd: "astro build",
    outputDir: "dist",
    installCmd: "npm install",
    devCmd: "astro dev",
  },
  [Framework.REMIX]: {
    name: "Remix",
    buildCmd: "remix build",
    outputDir: "build",
    installCmd: "npm install",
    devCmd: "remix dev",
  },
  [Framework.STATIC]: {
    name: "Static",
    buildCmd: "echo 'No build required'",
    outputDir: "public",
    installCmd: "npm install",
    devCmd: "npx serve public",
  },
  [Framework.NODE]: {
    name: "Node.js",
    buildCmd: "echo 'No build required'",
    outputDir: ".",
    installCmd: "npm install",
    devCmd: "npm run dev",
  },
};
