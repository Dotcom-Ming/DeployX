import { CodeBlock } from "../../../components/code-block";
import { Callout } from "../../../components/callout";

export default function ViteGuidePage() {
  return (
    <div>
      <h1>部署 Vite</h1>
      <p>
        DeployX 支持基于 Vite 的项目，包括 React、Vue、Svelte 和其他框架。本指南涵盖部署使用 Vite 构建的静态站点。
      </p>

      <h2>前提条件</h2>
      <ul>
        <li>一个 Vite 项目</li>
        <li>已安装 DeployX CLI（<code>npm install -g @deployx/cli</code>）</li>
        <li>一个 DeployX 账户</li>
      </ul>

      <h2>1. 框架检测</h2>
      <p>
        DeployX 会从您的 <code>package.json</code> 和 <code>vite.config</code> 文件中检测 Vite 及其关联的框架：
      </p>
      <CodeBlock language="bash">
{`dx deploy

# Output:
# ▸ Detected framework: Vite (React)
# ▸ Build command: vite build
# ▸ Output directory: dist`}
      </CodeBlock>

      <h2>2. 自定义配置</h2>
      <p>
        使用 <code>deployx.json</code> 文件覆盖默认设置：
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

      <h2>3. 环境变量</h2>
      <p>
        Vite 将以 <code>VITE_</code> 为前缀的环境变量暴露给客户端代码：
      </p>
      <CodeBlock language="bash">
{`# Add client-side variables
dx env add VITE_API_URL=https://api.example.com --project my-vite-app

# Add build-time variables (not exposed to client)
dx env add SENTRY_AUTH_TOKEN=xxx --project my-vite-app`}
      </CodeBlock>

      <Callout variant="warning" title="客户端暴露">
        只有以 <code>VITE_</code> 为前缀的变量会在构建时内联到客户端打包文件中。切勿将机密信息放入 <code>VITE_</code> 变量中——它们在浏览器中可见。
      </Callout>

      <h2>4. React + Vite</h2>
      <p>
        React 项目会自动被检测。DeployX 会配置构建以获得最佳输出：
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
        Vue 项目会根据 <code>vue</code> 依赖进行检测：
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
        也支持 SvelteKit 项目。对于静态 SvelteKit 应用：
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

      <h2>7. SPA 路由</h2>
      <p>
        对于单页应用，配置重写规则以使所有路由都提供 <code>index.html</code>。创建一个 <code>deployx.json</code>：
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

      <Callout variant="info" title="SPA 与 SSR">
        上述重写规则仅适用于客户端路由（React Router、Vue Router）。如果您在 Vite 中使用 SSR（例如 Vite SSR、vite-plugin-ssr），DeployX 会自动处理路由。
      </Callout>

      <h2>8. 自定义头部</h2>
      <p>
        配置自定义头部以实现缓存和安全：
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

      <h2>故障排除</h2>
      <h3>部署后页面空白</h3>
      <p>
        这通常是由于 Vite 配置中的 <code>base</code> 路径不正确导致的。请确保 <code>base</code> 与您的部署路径匹配：
      </p>
      <CodeBlock language="typescript" filename="vite.config.ts">
{`export default defineConfig({
  base: "/", // Set to "/" for root deployment
});`}
      </CodeBlock>

      <h3>打包体积过大</h3>
      <p>
        启用手动代码分割以获得更好的缓存效果：
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
