import { CodeBlock } from "../../../components/code-block";
import { Callout } from "../../../components/callout";

export default function NuxtGuidePage() {
  return (
    <div>
      <h1>部署 Nuxt</h1>
      <p>
        DeployX 支持 Nuxt 3 应用程序，具备自动框架检测、服务器路由和 Nitro 预设功能。本指南涵盖使用 SSR 和静态生成两种方式部署 Nuxt 应用程序。
      </p>

      <h2>前提条件</h2>
      <ul>
        <li>一个 Nuxt 3 项目</li>
        <li>已安装 DeployX CLI（<code>npm install -g @deployx/cli</code>）</li>
        <li>一个 DeployX 账户</li>
      </ul>

      <h2>1. 框架检测</h2>
      <p>
        DeployX 会自动从您的 <code>package.json</code>{" "}
        和 <code>nuxt.config</code> 文件中检测 Nuxt：
      </p>
      <CodeBlock language="bash">
{`dx deploy

# Output:
# ▸ Detected framework: Nuxt 3.11.0
# ▸ Build command: nuxt build
# ▸ Output directory: .output/public`}
      </CodeBlock>

      <h2>2. Nitro 预设配置</h2>
      <p>
        在您的 <code>nuxt.config.ts</code> 中配置 DeployX 的 Nitro 预设：
      </p>
      <CodeBlock language="typescript" filename="nuxt.config.ts">
{`export default defineNuxtConfig({
  nitro: {
    preset: "node-cluster",
  },
});`}
      </CodeBlock>

      <Callout variant="info" title="Nitro 预设">
        DeployX 使用 <code>node-cluster</code> 预设来部署 SSR 应用程序。如果您要部署静态站点，请改用 <code>preset: &quot;static&quot;</code>。
      </Callout>

      <h2>3. 静态站点生成（SSG）</h2>
      <p>
        对于静态生成的 Nuxt 站点，配置预设并构建：
      </p>
      <CodeBlock language="typescript" filename="nuxt.config.ts">
{`export default defineNuxtConfig({
  nitro: {
    preset: "static",
  },
});`}
      </CodeBlock>
      <CodeBlock language="bash">
{`# Generate static files
npx nuxt generate

# Deploy
dx deploy`}
      </CodeBlock>

      <h2>4. 环境变量</h2>
      <p>
        使用运行时配置将环境变量暴露给您的 Nuxt 应用程序：
      </p>
      <CodeBlock language="typescript" filename="nuxt.config.ts">
{`export default defineNuxtConfig({
  runtimeConfig: {
    // Server-side only
    databaseUrl: process.env.DATABASE_URL,
    // Public (exposed to client)
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    },
  },
});`}
      </CodeBlock>
      <p>
        在 DeployX 中设置环境变量：
      </p>
      <CodeBlock language="bash">
{`# Server-side variable
dx env add DATABASE_URL=postgres://host/db --project my-nuxt-app --production

# Public variable
dx env add NUXT_PUBLIC_API_BASE_URL=https://api.example.com --project my-nuxt-app`}
      </CodeBlock>

      <h2>5. 服务器路由和 API</h2>
      <p>
        DeployX 完全支持 Nuxt 服务器路由。在 <code>server/api/</code> 目录中创建 API 端点：
      </p>
      <CodeBlock language="typescript" filename="server/api/hello.ts">
{`export default defineEventHandler((event) => {
  return { message: "Hello from Nuxt on DeployX!" };
});`}
      </CodeBlock>

      <h2>6. 自定义配置</h2>
      <p>
        对于高级配置，请创建一个 <code>deployx.json</code> 文件：
      </p>
      <CodeBlock language="json" filename="deployx.json">
{`{
  "framework": "nuxt",
  "buildCommand": "npm run build",
  "outputDirectory": ".output",
  "installCommand": "npm ci",
  "regions": ["us-east"]
}`}
      </CodeBlock>

      <h2>7. 服务器中间件</h2>
      <p>
        Nuxt 服务器中间件开箱即用：
      </p>
      <CodeBlock language="typescript" filename="server/middleware/auth.ts">
{`export default defineEventHandler((event) => {
  const auth = getHeader(event, "authorization");
  if (!auth) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }
});`}
      </CodeBlock>

      <Callout variant="tip" title="性能提示">
        使用 Nitro 提供的 <code>defineCachedFunction</code> 和{" "}
        <code>defineCachedEventHandler</code> 来在边缘缓存计算密集的操作和 API 调用。
      </Callout>

      <h2>故障排除</h2>
      <h3>水合问题</h3>
      <p>
        如果您遇到水合不匹配，请确保服务器和客户端渲染相同的内容。避免在 SSR 期间使用仅浏览器端的 API。
      </p>
      <h3>服务器路由 404 错误</h3>
      <p>
        确保 <code>nitro.preset</code> 设置正确。SSR 应用需要 <code>node-cluster</code>，而不是 <code>static</code>。
      </p>
    </div>
  );
}
