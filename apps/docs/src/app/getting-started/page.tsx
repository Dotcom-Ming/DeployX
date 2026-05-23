import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

export default function GettingStartedPage() {
  return (
    <div>
      <h1>Getting Started</h1>
      <p>
        Get DeployX up and running in just a few minutes. This guide will walk
        you through installing the CLI, authenticating, deploying your first
        project, and configuring a custom domain.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>
          A <a href="https://deployx.com">DeployX account</a>
        </li>
        <li>Node.js 18 or later</li>
        <li>A Git repository with a web project</li>
      </ul>

      <h2>1. Install the CLI</h2>
      <p>
        Install the DeployX CLI globally using npm, yarn, or pnpm:
      </p>
      <CodeBlock language="bash">
{`# Using npm
npm install -g @deployx/cli

# Using yarn
yarn global add @deployx/cli

# Using pnpm
pnpm add -g @deployx/cli`}
      </CodeBlock>
      <p>
        Verify the installation by checking the version:
      </p>
      <CodeBlock language="bash">
{`dx --version
# dx/1.0.0`}
      </CodeBlock>

      <h2>2. Login</h2>
      <p>
        Authenticate with your DeployX account. This opens a browser window for
        OAuth-based login:
      </p>
      <CodeBlock language="bash">
{`dx login

# Alternatively, use an API token for CI/CD environments
dx login --token dx_live_abc123def456`}
      </CodeBlock>
      <Callout variant="tip" title="CI/CD Authentication">
        For automated environments, use the <code>--token</code> flag with an API
        token generated from your DeployX dashboard. Never commit tokens to
        version control — use secrets management in your CI provider.
      </Callout>

      <h2>3. Deploy Your First Project</h2>
      <p>
        Navigate to your project directory and run the deploy command:
      </p>
      <CodeBlock language="bash">
{`cd my-project
dx deploy

# Deploy to a specific project
dx deploy --project my-awesome-app

# Deploy with environment variables
dx deploy --env NODE_ENV=production --env API_KEY=xxx`}
      </CodeBlock>
      <p>
        DeployX automatically detects your framework and configures the build.
        The first deployment creates a new project and assigns a{" "}
        <code>*.deployx.app</code> domain.
      </p>
      <CodeBlock language="bash">
{`▸ Detecting framework... Next.js
▸ Building project...
▸ Deploying to production...
▸ Done! https://my-awesome-app.deployx.app`}
      </CodeBlock>

      <h2>4. Configure a Custom Domain</h2>
      <p>
        Add your own domain to the project:
      </p>
      <CodeBlock language="bash">
{`# Add a domain
dx domains add my-awesome-app.com

# View DNS records to configure
dx domains verify my-awesome-app.com`}
      </CodeBlock>
      <Callout variant="info" title="DNS Configuration">
        After adding a domain, you need to configure DNS records with your
        domain registrar. DeployX provides the required CNAME or A records
        during the verification step. See the{" "}
        <a href="/domains">Domains guide</a> for detailed instructions.
      </Callout>

      <h2>Next Steps</h2>
      <ul>
        <li>
          <a href="/cli">CLI Reference</a> — Explore all available commands
        </li>
        <li>
          <a href="/deployments">Deployments</a> — Learn about preview and
          production deployments
        </li>
        <li>
          <a href="/env-variables">Environment Variables</a> — Manage secrets
          and configuration
        </li>
        <li>
          <a href="/api-reference">API Reference</a> — Integrate DeployX into
          your workflows
        </li>
      </ul>
    </div>
  );
}
