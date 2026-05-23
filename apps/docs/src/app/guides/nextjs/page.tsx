import { CodeBlock } from "../../../components/code-block";
import { Callout } from "../../../components/callout";

export default function NextjsGuidePage() {
  return (
    <div>
      <h1>Deploying Next.js</h1>
      <p>
        DeployX has first-class support for Next.js, including App Router,
        Pages Router, Server Actions, and middleware. This guide walks you
        through configuring and deploying a Next.js application.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>A Next.js project (13+ recommended)</li>
        <li>The DeployX CLI installed (<code>npm install -g @deployx/cli</code>)</li>
        <li>A DeployX account</li>
      </ul>

      <h2>1. Framework Detection</h2>
      <p>
        DeployX automatically detects Next.js from your <code>package.json</code>{" "}
        dependencies. No configuration is required for standard projects.
      </p>
      <CodeBlock language="bash">
{`dx deploy

# Output:
# ▸ Detected framework: Next.js 14.2.0
# ▸ Build command: next build
# ▸ Output directory: .next`}
      </CodeBlock>

      <h2>2. Custom Configuration</h2>
      <p>
        For projects that need custom build settings, create a{" "}
        <code>deployx.json</code> file:
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

      <h2>3. Environment Variables</h2>
      <p>
        Configure environment variables for your Next.js application. Make
        sure to use the <code>NEXT_PUBLIC_</code> prefix for client-side
        variables:
      </p>
      <CodeBlock language="bash">
{`# Server-side only variables
dx env add DATABASE_URL=postgres://host/db --project my-app --production

# Client-side variables
dx env add NEXT_PUBLIC_API_URL=https://api.example.com --project my-app`}
      </CodeBlock>

      <Callout variant="info" title="Next.js Environment Variables">
        Variables prefixed with <code>NEXT_PUBLIC_</code> are inlined at
        build time and exposed to the browser. All other variables are only
        available in API routes, Server Actions, and middleware.
      </Callout>

      <h2>4. App Router Support</h2>
      <p>
        DeployX fully supports the Next.js App Router, including:
      </p>
      <ul>
        <li>Server Components and Client Components</li>
        <li>Server Actions</li>
        <li>Streaming and Suspense</li>
        <li>Route Handlers</li>
        <li>Middleware</li>
      </ul>

      <h2>5. Image Optimization</h2>
      <p>
        Next.js Image Optimization works out of the box on DeployX. No
        additional configuration is needed.
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

      <h2>6. ISR and Caching</h2>
      <p>
        Incremental Static Regeneration (ISR) is fully supported. DeployX
        respects your revalidation settings:
      </p>
      <CodeBlock language="typescript" filename="app/page.tsx">
{`export const revalidate = 3600; // Revalidate every hour

export default async function Page() {
  const data = await fetch("https://api.example.com/data");
  return <div>{/* ... */}</div>;
}`}
      </CodeBlock>

      <h2>7. Edge and Node.js Runtimes</h2>
      <p>
        DeployX supports both the Node.js and Edge runtimes for Route
        Handlers and Middleware:
      </p>
      <CodeBlock language="typescript" filename="app/api/route.ts">
{`export const runtime = "edge"; // or "nodejs"

export async function GET() {
  return new Response("Hello from the edge!");
}`}
      </CodeBlock>

      <Callout variant="tip" title="Performance Tip">
        Use the Edge runtime for latency-sensitive Route Handlers and
        Middleware. The Node.js runtime is better suited for heavy
        computation and database access.
      </Callout>

      <h2>8. Custom Server</h2>
      <p>
        DeployX does <strong>not</strong> support custom servers (e.g.,{" "}
        <code>server.js</code>). Use the built-in Next.js server with{" "}
        <code>next start</code> instead. If you need custom server logic,
        use Route Handlers or Server Actions.
      </p>

      <h2>Troubleshooting</h2>
      <h3>Build Errors</h3>
      <p>
        If your build fails, check the build logs with:
      </p>
      <CodeBlock language="bash">
{`dx logs --project my-app --type build`}
      </CodeBlock>

      <h3>Hydration Mismatch</h3>
      <p>
        Hydration mismatches often occur from using browser-only APIs in
        Server Components. Make sure to use <code>&quot;use client&quot;</code>{" "}
        directives correctly and avoid accessing <code>window</code> or{" "}
        <code>document</code> during server rendering.
      </p>
    </div>
  );
}
