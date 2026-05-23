import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

const commands = [
  {
    name: "dx deploy",
    description: "Deploy your project to DeployX. Automatically detects the framework, builds the project, and creates a deployment.",
    flags: [
      { flag: "--project <name>", description: "Target project name or ID" },
      { flag: "--env <KEY=VALUE>", description: "Set environment variables for the deployment" },
      { flag: "--branch <name>", description: "Deploy a specific Git branch (default: current branch)" },
      { flag: "--no-cache", description: "Force a clean build without cache" },
      { flag: "--production", description: "Deploy to production environment" },
    ],
    examples: [
      "dx deploy",
      "dx deploy --project my-app --production",
      "dx deploy --env NODE_ENV=staging --env API_URL=https://staging.api.com",
      "dx deploy --branch feature/auth --no-cache",
    ],
  },
  {
    name: "dx logs",
    description: "View real-time logs for your deployments. Supports filtering by deployment, type, and time range.",
    flags: [
      { flag: "--project <name>", description: "Project name or ID" },
      { flag: "--deployment <id>", description: "Specific deployment ID" },
      { flag: "--type <type>", description: "Log type: build, runtime, or all (default: all)" },
      { flag: "--follow, -f", description: "Follow log output in real-time" },
      { flag: "--since <duration>", description: "Show logs since duration (e.g., 30m, 2h)" },
    ],
    examples: [
      "dx logs --project my-app",
      "dx logs --project my-app --follow --type runtime",
      "dx logs --project my-app --since 1h",
    ],
  },
  {
    name: "dx domains",
    description: "Manage custom domains for your projects. Add, remove, and verify domain configurations.",
    flags: [
      { flag: "add <domain>", description: "Add a custom domain to a project" },
      { flag: "remove <domain>", description: "Remove a domain from a project" },
      { flag: "verify <domain>", description: "Verify DNS configuration for a domain" },
      { flag: "--project <name>", description: "Target project name or ID" },
    ],
    examples: [
      "dx domains add example.com --project my-app",
      "dx domains verify example.com --project my-app",
      "dx domains remove example.com --project my-app",
    ],
  },
  {
    name: "dx env",
    description: "Manage environment variables for your projects. Variables are encrypted at rest and can be scoped to preview or production.",
    flags: [
      { flag: "ls", description: "List all environment variables" },
      { flag: "add <KEY=VALUE>", description: "Add or update an environment variable" },
      { flag: "remove <KEY>", description: "Remove an environment variable" },
      { flag: "--project <name>", description: "Target project name or ID" },
      { flag: "--preview", description: "Scope variable to preview deployments only" },
      { flag: "--production", description: "Scope variable to production deployments only" },
    ],
    examples: [
      "dx env ls --project my-app",
      "dx env add DATABASE_URL=postgres://... --project my-app --production",
      "dx env add DEBUG=true --project my-app --preview",
      "dx env remove OLD_KEY --project my-app",
    ],
  },
  {
    name: "dx projects",
    description: "Create, list, and manage your DeployX projects.",
    flags: [
      { flag: "ls", description: "List all projects in the current organization" },
      { flag: "create <name>", description: "Create a new project" },
      { flag: "delete <name>", description: "Delete a project" },
      { flag: "--org <slug>", description: "Target organization" },
      { flag: "--region <code>", description: "Deployment region (e.g., us-east, eu-west)" },
    ],
    examples: [
      "dx projects ls --org my-team",
      "dx projects create my-new-app --org my-team --region us-east",
      "dx projects delete old-project --org my-team",
    ],
  },
  {
    name: "dx orgs",
    description: "Manage your organizations and team members.",
    flags: [
      { flag: "ls", description: "List all organizations you belong to" },
      { flag: "create <name>", description: "Create a new organization" },
      { flag: "members", description: "List organization members" },
      { flag: "invite <email>", description: "Invite a member to the organization" },
      { flag: "--org <slug>", description: "Target organization slug" },
      { flag: "--role <role>", description: "Role for invited member (admin, developer, viewer)" },
    ],
    examples: [
      "dx orgs ls",
      "dx orgs create acme-corp",
      "dx orgs members --org acme-corp",
      "dx orgs invite alice@example.com --org acme-corp --role developer",
    ],
  },
];

export default function CLIPage() {
  return (
    <div>
      <h1>CLI Reference</h1>
      <p>
        The DeployX CLI (<code>dx</code>) is the primary way to interact with
        the platform from your terminal. Install it globally and manage
        deployments, domains, environment variables, and more.
      </p>

      <Callout variant="info" title="Installation">
        Install the CLI with <code>npm install -g @deployx/cli</code>. See the{" "}
        <a href="/getting-started">Getting Started</a> guide for detailed setup
        instructions.
      </Callout>

      {commands.map((cmd) => (
        <div key={cmd.name}>
          <h2>
            <code>{cmd.name}</code>
          </h2>
          <p>{cmd.description}</p>

          <h3>Flags</h3>
          <table>
            <thead>
              <tr>
                <th>Flag</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {cmd.flags.map((f) => (
                <tr key={f.flag}>
                  <td>
                    <code>{f.flag}</code>
                  </td>
                  <td>{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Examples</h3>
          {cmd.examples.map((example) => (
            <CodeBlock key={example} language="bash">
              {example}
            </CodeBlock>
          ))}
        </div>
      ))}

      <h2>Global Flags</h2>
      <p>These flags are available on all commands:</p>
      <table>
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--help</code></td>
            <td>Show help for the command</td>
          </tr>
          <tr>
            <td><code>--version</code></td>
            <td>Print the CLI version</td>
          </tr>
          <tr>
            <td><code>--debug</code></td>
            <td>Enable verbose debug output</td>
          </tr>
          <tr>
            <td><code>--config &lt;path&gt;</code></td>
            <td>Path to a custom config file</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
