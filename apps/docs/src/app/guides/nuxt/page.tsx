import { CodeBlock } from "../../../components/code-block";
import { Callout } from "../../../components/callout";

export default function NuxtGuidePage() {
  return (
    <div>
      <h1>Deploying Nuxt</h1>
      <p>
        DeployX supports Nuxt 3 applications with automatic framework
        detection, server routes, and Nitro presets. This guide covers
        deploying Nuxt applications with both SSR and static generation.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>A Nuxt 3 project</li>
        <li>The DeployX CLI installed (<code>npm install -g @deployx/cli</code>)</li>
        <li>A DeployX account</li>
      </ul>

      <h2>1. Framework Detection</h2>
      <p>
        DeployX automatically detects Nuxt from your <code>package.json</code>{" "}
        and <code>nuxt.config</code> file:
      </p>
      <CodeBlock language="bash">
{`dx deploy

# Output:
# ▸ Detected framework: Nuxt 3.11.0
# ▸ Build command: nuxt build
# ▸ Output directory: .output/public`}
      </CodeBlock>

      <h2>2. Nitro Preset Configuration</h2>
      <p>
        Configure the Nitro preset for DeployX in your{" "}
        <code>nuxt.config.ts</code>:
      </p>
      <CodeBlock language="typescript" filename="nuxt.config.ts">
{`export default defineNuxtConfig({
  nitro: {
    preset: "node-cluster",
  },
});`}
      </CodeBlock>

      <Callout variant="info" title="Nitro Presets">
        DeployX uses the <code>node-cluster</code> preset for SSR
        applications. If you are deploying a static site, use{" "}
        <code>preset: &quot;static&quot;</code> instead.
      </Callout>

      <h2>3. Static Site Generation (SSG)</h2>
      <p>
        For statically generated Nuxt sites, configure the preset and build:
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

      <h2>4. Environment Variables</h2>
      <p>
        Use the runtime config to expose environment variables to your Nuxt
        application:
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
        Set the environment variables in DeployX:
      </p>
      <CodeBlock language="bash">
{`# Server-side variable
dx env add DATABASE_URL=postgres://host/db --project my-nuxt-app --production

# Public variable
dx env add NUXT_PUBLIC_API_BASE_URL=https://api.example.com --project my-nuxt-app`}
      </CodeBlock>

      <h2>5. Server Routes and API</h2>
      <p>
        Nuxt server routes are fully supported on DeployX. Create API
        endpoints in the <code>server/api/</code> directory:
      </p>
      <CodeBlock language="typescript" filename="server/api/hello.ts">
{`export default defineEventHandler((event) => {
  return { message: "Hello from Nuxt on DeployX!" };
});`}
      </CodeBlock>

      <h2>6. Custom Configuration</h2>
      <p>
        For advanced configuration, create a <code>deployx.json</code> file:
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

      <h2>7. Server Middleware</h2>
      <p>
        Nuxt server middleware works out of the box:
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

      <Callout variant="tip" title="Performance Tip">
        Use <code>defineCachedFunction</code> and{" "}
        <code>defineCachedEventHandler</code> from Nitro to cache expensive
        computations and API calls at the edge.
      </Callout>

      <h2>Troubleshooting</h2>
      <h3>Hydration Issues</h3>
      <p>
        If you encounter hydration mismatches, ensure your server and client
        render the same content. Avoid using browser-only APIs during SSR.
      </p>
      <h3>404 on Server Routes</h3>
      <p>
        Make sure the <code>nitro.preset</code> is set correctly. SSR apps
        need <code>node-cluster</code>, not <code>static</code>.
      </p>
    </div>
  );
}
