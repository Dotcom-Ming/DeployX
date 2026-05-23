import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

export default function DomainsPage() {
  return (
    <div>
      <h1>Domains</h1>
      <p>
        DeployX provides automatic subdomains for every project and supports
        custom domain configuration with automatic SSL certificate provisioning.
      </p>

      <h2>Default Subdomains</h2>
      <p>
        Every project receives a free <code>*.deployx.app</code> subdomain
        upon creation. This domain is immediately available and secured with
        HTTPS.
      </p>
      <CodeBlock language="bash">
{`# View your project's default domain
dx projects ls --org my-team

# Output:
# my-app  │  my-app.deployx.app  │  Ready`}
      </CodeBlock>

      <h2>Adding a Custom Domain</h2>
      <p>
        Add your own domain to a project using the CLI or the dashboard:
      </p>
      <CodeBlock language="bash">
{`# Add a custom domain
dx domains add example.com --project my-app

# Add a wildcard domain
dx domains add "*..example.com" --project my-app`}
      </CodeBlock>
      <p>
        After adding a domain, you need to configure DNS records with your
        domain registrar.
      </p>

      <h2>DNS Configuration</h2>
      <p>
        DeployX supports two DNS configuration methods depending on your
        domain setup:
      </p>

      <h3>Method 1: CNAME Record (Recommended for Subdomains)</h3>
      <p>
        Use a CNAME record when configuring subdomains like{" "}
        <code>app.example.com</code>:
      </p>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CNAME</td>
            <td>app</td>
            <td>cname.deployx.app</td>
          </tr>
        </tbody>
      </table>

      <h3>Method 2: A Record (For Apex Domains)</h3>
      <p>
        Use an A record when configuring an apex domain like{" "}
        <code>example.com</code>:
      </p>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A</td>
            <td>@</td>
            <td>76.76.21.21</td>
          </tr>
        </tbody>
      </table>

      <Callout variant="warning" title="Apex Domain Limitation">
        Some DNS providers do not support CNAME flattening at the apex level.
        In this case, use the A record method. If your provider supports
        CNAME flattening (Cloudflare, DNSimple), you can use a CNAME record
        for apex domains as well.
      </Callout>

      <h2>Verifying a Domain</h2>
      <p>
        After configuring DNS records, verify the domain to activate it:
      </p>
      <CodeBlock language="bash">
{`# Verify DNS configuration
dx domains verify example.com --project my-app

# Check domain status
dx domains ls --project my-app`}
      </CodeBlock>
      <p>
        DNS propagation can take up to 48 hours, though it typically
        completes within minutes. DeployX automatically provisions an SSL
        certificate once verification succeeds.
      </p>

      <h2>SSL Certificates</h2>
      <p>
        DeployX automatically provisions and renews SSL certificates for all
        domains via Let&apos;s Encrypt. There is no manual configuration required.
      </p>
      <ul>
        <li>Automatic certificate provisioning upon domain verification</li>
        <li>Automatic renewal before expiration</li>
        <li>Supports wildcard certificates</li>
        <li>HTTP to HTTPS redirect enabled by default</li>
      </ul>

      <h2>Removing a Domain</h2>
      <CodeBlock language="bash">
{`# Remove a custom domain
dx domains remove example.com --project my-app`}
      </CodeBlock>
      <Callout variant="danger" title="Irreversible Action">
        Removing a domain immediately stops serving traffic on it. Make sure
        to update your DNS records after removal to avoid stale records
        pointing to DeployX.
      </Callout>
    </div>
  );
}
