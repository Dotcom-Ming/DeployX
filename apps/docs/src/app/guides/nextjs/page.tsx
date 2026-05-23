import { CodeBlock } from "../../../components/code-block";
import { Callout } from "../../../components/callout";

export default function NextjsGuidePage() {
  return (
    <div>
      <h1>部署 Next.js</h1>
      <p>
        DeployX 对 Next.js 提供一流支持，包括 App Router、
        Pages Router、Server Actions 和中间件。本指南将引导您
        配置和部署 Next.js 应用程序。
      </p>

      <h2>前提条件</h2>
      <ul>
        <li>一个 Next.js 项目（推荐 13+）</li>
        <li>已安装 DeployX CLI（<code>npm install -g @deployx/cli</code>）</li>
        <li>一个 DeployX 账户</li>
      </ul>

      <h2>1. 框架检测</h2>
      <p>
        DeployX 会自动从您的 <code>package.json</code>{" "}
        依赖中检测 Next.js。标准项目无需额外配置。
      </p>
      <CodeBlock language="bash">
{`dx deploy

# Output:
# ▸ Detected framework: Next.js 14.2.0
# ▸ Build command: next build
# ▸ Output directory: .next`}
      </CodeBlock>

      <h2>2. 自定义配置</h2>
      <p>
        对于需要自定义构建设置的项目，请创建一个{" "}
        <code>deployx.json</code> 文件：
      </p>
      <CodeBlock language="json" filename="deployx.json">
{`{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "regions": ["us-east", "eu-west"]
}`}
      </CodeBlock>

      <h2>3. 环境变量</h2>
      <p>
        为您的 Next.js 应用程序配置环境变量。请确保对客户端变量使用{" "}
        <code>NEXT_PUBLIC_</code> 前缀：
      </p>
      <CodeBlock language="bash">
{`# Server-side only variables
dx env add DATABASE_URL=postgres://host/db --project my-app --production

# Client-side variables
dx env add NEXT_PUBLIC_API_URL=https://api.example.com --project my-app`}
      </CodeBlock>

      <Callout variant="info" title="Next.js 环境变量">
        以 <code>NEXT_PUBLIC_</code> 为前缀的变量会在构建时内联并暴露给浏览器。所有其他变量仅在 API 路由、服务器操作和中间件中可用。
      </Callout>

      <h2>4. App Router 支持</h2>
      <p>
        DeployX 完全支持 Next.js App Router，包括：
      </p>
      <ul>
        <li>服务器组件和客户端组件</li>
        <li>服务器操作</li>
        <li>流式渲染和 Suspense</li>
        <li>路由处理器</li>
        <li>中间件</li>
      </ul>

      <h2>5. 图片优化</h2>
      <p>
        Next.js 图片优化在 DeployX 上开箱即用，无需额外配置。
      </p>
      <CodeBlock language="typescript" filename="next.config.mjs">
{`const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.example.com",
      },
    ],
  },
};

export default nextConfig;`}
      </CodeBlock>

      <h2>6. ISR 与缓存</h2>
      <p>
        完全支持增量静态再生成（ISR）。DeployX 会遵循您的重新验证设置：
      </p>
      <CodeBlock language="typescript" filename="app/page.tsx">
{`export const revalidate = 3600; // Revalidate every hour

export default async function Page() {
  const data = await fetch("https://api.example.com/data");
  return <div>{/* ... */}</div>;
}`}
      </CodeBlock>

      <h2>7. Edge 和 Node.js 运行时</h2>
      <p>
        DeployX 同时支持 Node.js 和 Edge 运行时用于路由处理器和中间件：
      </p>
      <CodeBlock language="typescript" filename="app/api/route.ts">
{`export const runtime = "edge"; // or "nodejs"

export async function GET() {
  return new Response("Hello from the edge!");
}`}
      </CodeBlock>

      <Callout variant="tip" title="性能提示">
        对于延迟敏感的路由处理器和中间件，请使用 Edge 运行时。Node.js 运行时更适合重计算和数据库访问。
      </Callout>

      <h2>8. 自定义服务器</h2>
      <p>
        DeployX <strong>不</strong>支持自定义服务器（例如{" "}
        <code>server.js</code>）。请改用内置的 Next.js 服务器，使用{" "}
        <code>next start</code>。如果您需要自定义服务器逻辑，请使用路由处理器或服务器操作。
      </p>

      <h2>故障排除</h2>
      <h3>构建错误</h3>
      <p>
        如果构建失败，请使用以下命令检查构建日志：
      </p>
      <CodeBlock language="bash">
{`dx logs --project my-app --type build`}
      </CodeBlock>

      <h3>水合不匹配</h3>
      <p>
        水合不匹配通常是由于在服务器组件中使用了仅浏览器端的 API。请确保正确使用 <code>&quot;use client&quot;</code>{" "}
        指令，并避免在服务器渲染期间访问 <code>window</code> 或{" "}
        <code>document</code>。
      </p>
    </div>
  );
}
