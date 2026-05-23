import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

export default function EnvVariablesPage() {
  return (
    <div>
      <h1>Environment Variables</h1>
      <p>
        DeployX allows you to manage environment variables for your
        projects. Variables are encrypted at rest and can be scoped to
        specific deployment environments.
      </p>

      <h2>Managing Variables</h2>

      <h3>List Variables</h3>
      <CodeBlock language="bash">
{`# List all environment variables for a project
dx env ls --project my-app`}
      </CodeBlock>
      <p>
        The output shows variable names, scopes, and creation dates. Values
        are never displayed in the CLI output for security.
      </p>

      <h3>Add a Variable</h3>
      <CodeBlock language="bash">
{`# Add a production variable
dx env add DATABASE_URL=postgres://user:pass@host:5432/db --project my-app --production

# Add a preview-only variable
dx env add DEBUG=true --project my-app --preview

# Add a variable for all environments
dx env add API_VERSION=v2 --project my-app`}
      </CodeBlock>

      <h3>Remove a Variable</h3>
      <CodeBlock language="bash">
{`# Remove a specific variable
dx env remove OLD_API_KEY --project my-app`}
      </CodeBlock>

      <h2>Scoping</h2>
      <p>
        Environment variables can be scoped to specific deployment
        environments:
      </p>
      <table>
        <thead>
          <tr>
            <th>Scope</th>
            <th>Flag</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Production</td>
            <td><code>--production</code></td>
            <td>Available in production deployments only</td>
          </tr>
          <tr>
            <td>Preview</td>
            <td><code>--preview</code></td>
            <td>Available in preview deployments only</td>
          </tr>
          <tr>
            <td>All</td>
            <td>(default)</td>
            <td>Available in all deployment environments</td>
          </tr>
        </tbody>
      </table>

      <h2>Encryption</h2>
      <p>
        All environment variables are encrypted at rest using AES-256-GCM
        encryption. DeployX never stores or displays variable values in
        plaintext after creation.
      </p>
      <ul>
        <li>AES-256-GCM encryption for all stored values</li>
        <li>Values are decrypted only at build time and runtime</li>
        <li>Encrypted in transit via TLS 1.3</li>
        <li>Access logs track all reads of sensitive variables</li>
      </ul>

      <Callout variant="info" title="Encryption Details">
        DeployX uses a per-project encryption key derived from a
        hardware security module (HSM). Keys are rotated automatically and
        never stored alongside encrypted values. This ensures that even if
        the database is compromised, variable values remain protected.
      </Callout>

      <h2>Using Variables in Your App</h2>
      <p>
        Environment variables are automatically available in your application
        via <code>process.env</code> (Node.js) or the appropriate runtime
        mechanism:
      </p>
      <CodeBlock language="javascript" filename="app.js">
{`// Access environment variables in Node.js
const databaseUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;

// Variables prefixed with NEXT_PUBLIC_ are exposed to the browser in Next.js
const publicVar = process.env.NEXT_PUBLIC_API_URL;`}
      </CodeBlock>

      <h2>Framework-Specific Notes</h2>
      <h3>Next.js</h3>
      <p>
        Variables prefixed with <code>NEXT_PUBLIC_</code> are exposed to the
        browser. All other variables are only available in API routes and
        server-side code.
      </p>
      <h3>Nuxt</h3>
      <p>
        Use the <code>RUNTIME_CONFIG</code> key in <code>nuxt.config</code>{" "}
        to map environment variables to your application.
      </p>
      <h3>Vite</h3>
      <p>
        Variables prefixed with <code>VITE_</code> are exposed to the
        browser. All other variables are only available during the build.
      </p>

      <Callout variant="warning" title="Sensitive Data">
        Never expose sensitive credentials (API keys, database passwords,
        secrets) to the client side. Only use framework-specific public
        prefixes for non-sensitive configuration values.
      </Callout>

      <h2>CI/CD Integration</h2>
      <p>
        For CI/CD pipelines, use an API token to manage environment
        variables:
      </p>
      <CodeBlock language="yaml" filename=".github/workflows/deploy.yml">
{`name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @deployx/cli
      - run: dx login --token \${{ secrets.DEPLOYX_TOKEN }}
      - run: dx deploy --production --project my-app`}
      </CodeBlock>
    </div>
  );
}
