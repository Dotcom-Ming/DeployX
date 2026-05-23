import { CodeBlock } from "../../../components/code-block";
import { Callout } from "../../../components/callout";

export default function ViteGuidePage() {
  return (
    <div>
      <h1>Deploying Vite</h1>
      <p>
        DeployX supports Vite-based projects including React, Vue, Svelte,
        and other frameworks. This guide covers deploying static sites
        built with Vite.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>A Vite project</li>
        <li>The DeployX CLI installed (<code>npm install -g @deployx/cli</code>)</li>
        <li>A DeployX account</li>
      </ul>

      <h2>1. Framework Detection</h2>
      <p>
        DeployX detects Vite and the associated framework from your{" "}
        <code>package.json</code> and <code>vite.config</code>:
      </p>
      <CodeBlock language="bash">
{`dx deploy

# Output:
# ▸ Detected framework: Vite (React)
# ▸ Build command: vite build
# ▸ Output directory: dist`}
      </CodeBlock>

      <h2>2. Custom Configuration</h2>
      <p>
        Override default settings with a <code>deployx.json</code> file:
      </p>
      <CodeBlock language="json" filename="deployx.json">
{`{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "regions": ["us-east", "eu-west"]
}`}
      </CodeBlock>

      <h2>3. Environment Variables</h2>
      <p>
        Vite exposes environment variables prefixed with <code>VITE_</code>{" "}
        to your client-side code:
      </p>
      <CodeBlock language="bash">
{`# Add client-side variables
dx env add VITE_API_URL=https://api.example.com --project my-vite-app

# Add build-time variables (not exposed to client)
dx env add SENTRY_AUTH_TOKEN=xxx --project my-vite-app`}
      </CodeBlock>

      <Callout variant="warning" title="Client-Side Exposure">
        Only variables prefixed with <code>VITE_</code> are inlined into
        the client bundle at build time. Never put secrets in{" "}
        <code>VITE_</code> variables — they will be visible in the browser.
      </Callout>

      <h2>4. React + Vite</h2>
      <p>
        React projects are automatically detected. DeployX configures the
        build for optimal output:
      </p>
      <CodeBlock language="typescript" filename="vite.config.ts">
{`import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});`}
      </CodeBlock>

      <h2>5. Vue + Vite</h2>
      <p>
        Vue projects are detected from the <code>vue</code> dependency:
      </p>
      <CodeBlock language="typescript" filename="vite.config.ts">
{`import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "dist",
  },
});`}
      </CodeBlock>

      <h2>6. Svelte + Vite</h2>
      <p>
        SvelteKit projects are also supported. For static SvelteKit apps:
      </p>
      <CodeBlock language="javascript" filename="svelte.config.js">
{`import adapter from "@sveltejs/adapter-static";

export default {
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
    }),
  },
};`}
      </CodeBlock>

      <h2>7. SPA Routing</h2>
      <p>
        For single-page applications, configure rewrites so that all routes
        serve <code>index.html</code>. Create a <code>deployx.json</code>:
      </p>
      <CodeBlock language="json" filename="deployx.json">
{`{
  "framework": "vite",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`}
      </CodeBlock>

      <Callout variant="info" title="SPA vs SSR">
        The rewrite rule above is only needed for client-side routing
        (React Router, Vue Router). If you are using SSR with Vite (e.g.,
        Vite SSR, vite-plugin-ssr), DeployX will handle routing
        automatically.
      </Callout>

      <h2>8. Custom Headers</h2>
      <p>
        Configure custom headers for caching and security:
      </p>
      <CodeBlock language="json" filename="deployx.json">
{`{
  "framework": "vite",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "source": "/(.*)",
      "headers": {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY"
      }
    }
  ]
}`}
      </CodeBlock>

      <h2>Troubleshooting</h2>
      <h3>Blank Page After Deploy</h3>
      <p>
        This is typically caused by an incorrect <code>base</code> path in
        your Vite config. Make sure the base matches your deployment path:
      </p>
      <CodeBlock language="typescript" filename="vite.config.ts">
{`export default defineConfig({
  base: "/", // Set to "/" for root deployment
});`}
      </CodeBlock>

      <h3>Large Bundle Size</h3>
      <p>
        Enable manual chunk splitting for better caching:
      </p>
      <CodeBlock language="typescript" filename="vite.config.ts">
{`export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
        },
      },
    },
  },
});`}
      </CodeBlock>
    </div>
  );
}
