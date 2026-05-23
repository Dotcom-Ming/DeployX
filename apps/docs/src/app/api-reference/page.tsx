import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

const endpointCategories = [
  {
    name: "Projects",
    basePath: "/v1/projects",
    endpoints: [
      { method: "GET", path: "/orgs/{orgSlug}/projects", description: "List projects" },
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}", description: "Get a project" },
      { method: "POST", path: "/orgs/{orgSlug}/projects", description: "Create a project" },
      { method: "PATCH", path: "/orgs/{orgSlug}/projects/{projectId}", description: "Update a project" },
      { method: "DELETE", path: "/orgs/{orgSlug}/projects/{projectId}", description: "Delete a project" },
    ],
  },
  {
    name: "Deployments",
    basePath: "/v1/deployments",
    endpoints: [
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}/deployments", description: "List deployments" },
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}/deployments/{deploymentId}", description: "Get a deployment" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/deployments", description: "Trigger a deployment" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/deployments/{deploymentId}/cancel", description: "Cancel a deployment" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/deployments/{deploymentId}/redeploy", description: "Redeploy" },
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}/deployments/{deploymentId}/logs", description: "Get deployment logs" },
    ],
  },
  {
    name: "Domains",
    basePath: "/v1/domains",
    endpoints: [
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}/domains", description: "List domains" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/domains", description: "Add a domain" },
      { method: "DELETE", path: "/orgs/{orgSlug}/projects/{projectId}/domains/{domainId}", description: "Remove a domain" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/domains/{domainId}/verify", description: "Verify a domain" },
    ],
  },
  {
    name: "Environment Variables",
    basePath: "/v1/env",
    endpoints: [
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}/env", description: "List environment variables" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/env", description: "Create an environment variable" },
      { method: "PATCH", path: "/orgs/{orgSlug}/projects/{projectId}/env/{varId}", description: "Update an environment variable" },
      { method: "DELETE", path: "/orgs/{orgSlug}/projects/{projectId}/env/{varId}", description: "Remove an environment variable" },
    ],
  },
  {
    name: "Organizations",
    basePath: "/v1/orgs",
    endpoints: [
      { method: "GET", path: "/orgs", description: "List organizations" },
      { method: "GET", path: "/orgs/{orgSlug}", description: "Get an organization" },
      { method: "POST", path: "/orgs", description: "Create an organization" },
      { method: "PATCH", path: "/orgs/{orgSlug}", description: "Update an organization" },
      { method: "GET", path: "/orgs/{orgSlug}/members", description: "List members" },
      { method: "POST", path: "/orgs/{orgSlug}/members/invite", description: "Invite a member" },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: "#10b981",
  POST: "#3b82f6",
  PATCH: "#f59e0b",
  DELETE: "#ef4444",
};

export default function APIReferencePage() {
  return (
    <div>
      <h1>API Reference</h1>
      <p>
        The DeployX REST API enables programmatic access to the platform.
        Use it to integrate DeployX into your CI/CD pipelines, build custom
        dashboards, or automate workflows.
      </p>

      <h2>Base URL</h2>
      <CodeBlock language="text">https://api.deployx.com/v1</CodeBlock>

      <h2>Authentication</h2>
      <p>
        All API requests require authentication via a Bearer token in the{" "}
        <code>Authorization</code> header. Generate API tokens from your
        DeployX dashboard under Settings → API Tokens.
      </p>
      <CodeBlock language="bash">
{`# Example authenticated request
curl -H "Authorization: Bearer dx_live_abc123def456" \\
  https://api.deployx.com/v1/orgs`}
      </CodeBlock>

      <Callout variant="warning" title="Token Security">
        API tokens carry the same permissions as your account. Never expose
        them in client-side code or commit them to version control. Use
        environment variables or secrets management in CI/CD.
      </Callout>

      <h2>Response Format</h2>
      <p>
        The API returns JSON responses with a consistent structure:
      </p>
      <CodeBlock language="json">
{`{
  "data": { ... },
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 42
  }
}`}
      </CodeBlock>

      <h2>Error Handling</h2>
      <p>
        Errors follow RFC 7807 problem detail format:
      </p>
      <CodeBlock language="json">
{`{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "The requested project could not be found.",
    "status": 404
  }
}`}
      </CodeBlock>
      <table>
        <thead>
          <tr>
            <th>Status Code</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>400</td><td>Bad Request — Invalid parameters</td></tr>
          <tr><td>401</td><td>Unauthorized — Missing or invalid token</td></tr>
          <tr><td>403</td><td>Forbidden — Insufficient permissions</td></tr>
          <tr><td>404</td><td>Not Found — Resource does not exist</td></tr>
          <tr><td>429</td><td>Rate Limited — Too many requests</td></tr>
          <tr><td>500</td><td>Internal Server Error</td></tr>
        </tbody>
      </table>

      <h2>Rate Limits</h2>
      <p>
        API requests are rate-limited to ensure platform stability:
      </p>
      <ul>
        <li>Hobby: 60 requests / minute</li>
        <li>Pro: 300 requests / minute</li>
        <li>Business: 1,000 requests / minute</li>
      </ul>
      <p>
        Rate limit headers are included in every response:
      </p>
      <CodeBlock language="text">
{`X-RateLimit-Limit: 300
X-RateLimit-Remaining: 298
X-RateLimit-Reset: 1700000000`}
      </CodeBlock>

      <h2>Endpoints</h2>
      {endpointCategories.map((category) => (
        <div key={category.name}>
          <h3>{category.name}</h3>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {category.endpoints.map((ep) => (
                <tr key={ep.path + ep.method}>
                  <td>
                    <span
                      style={{
                        background: methodColors[ep.method] + "20",
                        color: methodColors[ep.method],
                        padding: "0.125rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: "0.8125rem" }}>{ep.path}</code>
                  </td>
                  <td>{ep.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <h2>SDK</h2>
      <p>
        For a better developer experience, use the official DeployX SDK:
      </p>
      <CodeBlock language="typescript">
{`import { DeployXClient } from "@deployx/sdk";

const client = new DeployXClient({
  baseURL: "https://api.deployx.com",
  apiToken: process.env.DEPLOYX_API_TOKEN!,
});

// List projects
const projects = await client.projects.list("my-org");

// Trigger a deployment
const deployment = await client.deployments.trigger("my-org", "proj_123", {
  branch: "main",
  environment: "production",
});`}
      </CodeBlock>
    </div>
  );
}
