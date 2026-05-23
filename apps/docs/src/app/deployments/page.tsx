import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

export default function DeploymentsPage() {
  return (
    <div>
      <h1>Deployments</h1>
      <p>
        DeployX supports two deployment environments: <strong>Preview</strong>{" "}
        and <strong>Production</strong>. Each serves a different purpose in
        your development workflow.
      </p>

      <h2>Preview Deployments</h2>
      <p>
        Preview deployments are created automatically for every pull request or
        can be triggered manually. They provide an isolated, temporary
        environment for testing changes before merging.
      </p>
      <ul>
        <li>Automatic URL assignment (<code>*-pr-42.preview.deployx.app</code>)</li>
        <li>Isolated environment with its own environment variables</li>
        <li>Automatically cleaned up when the PR is closed or merged</li>
        <li>Share preview URLs with teammates for review</li>
      </ul>
      <CodeBlock language="bash">
{`# Create a preview deployment
dx deploy --branch feature/new-ui

# Deploy to a specific preview environment
dx deploy --preview --project my-app`}
      </CodeBlock>

      <Callout variant="tip" title="Preview deployments are free">
        Preview deployments are included in all plans at no additional cost.
        They share the same resources as your production deployment but run in
        isolated containers.
      </Callout>

      <h2>Production Deployments</h2>
      <p>
        Production deployments are served on your custom domain and are
        optimized for performance and reliability. They receive automatic SSL
        certificates and are backed by a global CDN.
      </p>
      <ul>
        <li>Zero-downtime deployments with instant rollback</li>
        <li>Automatic SSL certificate provisioning and renewal</li>
        <li>Global CDN with edge caching</li>
        <li>Automatic scaling based on traffic</li>
        <li>99.99% uptime SLA on Business plans and above</li>
      </ul>
      <CodeBlock language="bash">
{`# Deploy to production
dx deploy --production --project my-app

# Redeploy a previous production deployment
dx deploy --production --deployment dep_abc123`}
      </CodeBlock>

      <h2>Deployment Lifecycle</h2>
      <p>Every deployment goes through these stages:</p>
      <ol>
        <li>
          <strong>Queued</strong> — The deployment is waiting for an available
          builder.
        </li>
        <li>
          <strong>Building</strong> — DeployX clones your repo, installs
          dependencies, and runs the build command.
        </li>
        <li>
          <strong>Deploying</strong> — The built output is deployed to edge
          servers.
        </li>
        <li>
          <strong>Ready</strong> — The deployment is live and serving traffic.
        </li>
      </ol>

      <h2>Build Configuration</h2>
      <p>
        DeployX auto-detects your framework and configures the build. You can
        override settings in a <code>deployx.json</code> file at your project
        root:
      </p>
      <CodeBlock language="json" filename="deployx.json">
{`{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["us-east", "eu-west"]
}`}
      </CodeBlock>

      <h2>Rollbacks</h2>
      <p>
        You can instantly rollback to any previous production deployment:
      </p>
      <CodeBlock language="bash">
{`# List recent deployments
dx deployments --project my-app

# Rollback to a specific deployment
dx deploy --production --rollback-to dep_abc123`}
      </CodeBlock>

      <Callout variant="warning" title="Rollback scope">
        Rollbacks revert the deployed code, but they do <strong>not</strong>{" "}
        revert database migrations or other side effects. Make sure your
        database changes are backwards-compatible.
      </Callout>

      <h2>Deployment Protection</h2>
      <p>
        Protect your production deployments with deployment approvals. Require
        team members to approve deployments before they go live:
      </p>
      <CodeBlock language="bash">
{`# Enable deployment protection
dx projects update my-app --require-approval

# Approve a pending deployment
dx deployments approve dep_abc123`}
      </CodeBlock>
    </div>
  );
}
