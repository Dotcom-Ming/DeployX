import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

export default function DomainsPage() {
  return (
    <div>
      <h1>域名</h1>
      <p>
        DeployX 为每个项目提供自动子域名，并支持自定义域名配置以及自动 SSL 证书配置。
      </p>

      <h2>默认子域名</h2>
      <p>
        每个项目在创建时都会获得一个免费的 <code>*.deployx.app</code> 子域名。
        该域名立即可用并通过 HTTPS 确保安全。
      </p>
      <CodeBlock language="bash">
{`# View your project's default domain
dx projects ls --org my-team

# Output:
# my-app  │  my-app.deployx.app  │  Ready`}
      </CodeBlock>

      <h2>添加自定义域名</h2>
      <p>
        使用 CLI 或控制台为项目添加你自己的域名：
      </p>
      <CodeBlock language="bash">
{`# Add a custom domain
dx domains add example.com --project my-app

# Add a wildcard domain
dx domains add "*..example.com" --project my-app`}
      </CodeBlock>
      <p>
        添加域名后，你需要在域名注册商处配置 DNS 记录。
      </p>

      <h2>DNS 配置</h2>
      <p>
        DeployX 支持两种 DNS 配置方法，具体取决于你的域名设置：
      </p>

      <h3>方法一：CNAME 记录（推荐用于子域名）</h3>
      <p>
        在配置类似 <code>app.example.com</code> 的子域名时使用 CNAME 记录：
      </p>
      <table>
        <thead>
          <tr>
            <th>类型</th>
            <th>名称</th>
            <th>值</th>
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

      <h3>方法二：A 记录（适用于根域名）</h3>
      <p>
        在配置类似 <code>example.com</code> 的根域名时使用 A 记录：
      </p>
      <table>
        <thead>
          <tr>
            <th>类型</th>
            <th>名称</th>
            <th>值</th>
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

      <Callout variant="warning" title="根域名限制">
        某些 DNS 提供商不支持根级别的 CNAME 展平。在这种情况下，请使用 A 记录方法。如果你的提供商支持
        CNAME 展平（Cloudflare、DNSimple），你也可以在根域名上使用 CNAME 记录。
      </Callout>

      <h2>验证域名</h2>
      <p>
        配置 DNS 记录后，验证域名以激活它：
      </p>
      <CodeBlock language="bash">
{`# Verify DNS configuration
dx domains verify example.com --project my-app

# Check domain status
dx domains ls --project my-app`}
      </CodeBlock>
      <p>
        DNS 传播可能需要长达 48 小时，但通常只需几分钟即可完成。
        DeployX 在验证成功后会自动配置 SSL 证书。
      </p>

      <h2>SSL 证书</h2>
      <p>
        DeployX 通过 Let&apos;s Encrypt 自动配置和续期所有域名的 SSL 证书。
        无需手动配置。
      </p>
      <ul>
        <li>域名验证后自动配置证书</li>
        <li>到期前自动续期</li>
        <li>支持通配符证书</li>
        <li>默认启用 HTTP 到 HTTPS 的重定向</li>
      </ul>

      <h2>移除域名</h2>
      <CodeBlock language="bash">
{`# Remove a custom domain
dx domains remove example.com --project my-app`}
      </CodeBlock>
      <Callout variant="danger" title="不可逆操作">
        移除域名会立即停止在该域名上的流量服务。请确保在移除后更新你的 DNS 记录，以避免过期的记录仍指向 DeployX。
      </Callout>
    </div>
  );
}
