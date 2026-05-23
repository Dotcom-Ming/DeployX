import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

const endpointCategories = [
  {
    name: "项目",
    basePath: "/v1/projects",
    endpoints: [
      { method: "GET", path: "/orgs/{orgSlug}/projects", description: "列出项目" },
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}", description: "获取项目" },
      { method: "POST", path: "/orgs/{orgSlug}/projects", description: "创建项目" },
      { method: "PATCH", path: "/orgs/{orgSlug}/projects/{projectId}", description: "更新项目" },
      { method: "DELETE", path: "/orgs/{orgSlug}/projects/{projectId}", description: "删除项目" },
    ],
  },
  {
    name: "部署",
    basePath: "/v1/deployments",
    endpoints: [
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}/deployments", description: "列出部署" },
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}/deployments/{deploymentId}", description: "获取部署" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/deployments", description: "触发部署" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/deployments/{deploymentId}/cancel", description: "取消部署" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/deployments/{deploymentId}/redeploy", description: "重新部署" },
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}/deployments/{deploymentId}/logs", description: "获取部署日志" },
    ],
  },
  {
    name: "域名",
    basePath: "/v1/domains",
    endpoints: [
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}/domains", description: "列出域名" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/domains", description: "添加域名" },
      { method: "DELETE", path: "/orgs/{orgSlug}/projects/{projectId}/domains/{domainId}", description: "移除域名" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/domains/{domainId}/verify", description: "验证域名" },
    ],
  },
  {
    name: "环境变量",
    basePath: "/v1/env",
    endpoints: [
      { method: "GET", path: "/orgs/{orgSlug}/projects/{projectId}/env", description: "列出环境变量" },
      { method: "POST", path: "/orgs/{orgSlug}/projects/{projectId}/env", description: "创建环境变量" },
      { method: "PATCH", path: "/orgs/{orgSlug}/projects/{projectId}/env/{varId}", description: "更新环境变量" },
      { method: "DELETE", path: "/orgs/{orgSlug}/projects/{projectId}/env/{varId}", description: "删除环境变量" },
    ],
  },
  {
    name: "组织",
    basePath: "/v1/orgs",
    endpoints: [
      { method: "GET", path: "/orgs", description: "列出组织" },
      { method: "GET", path: "/orgs/{orgSlug}", description: "获取组织" },
      { method: "POST", path: "/orgs", description: "创建组织" },
      { method: "PATCH", path: "/orgs/{orgSlug}", description: "更新组织" },
      { method: "GET", path: "/orgs/{orgSlug}/members", description: "列出成员" },
      { method: "POST", path: "/orgs/{orgSlug}/members/invite", description: "邀请成员" },
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
      <h1>API 参考</h1>
      <p>
        DeployX REST API 提供对平台的编程访问。使用它可以将 DeployX 集成到你的 CI/CD 流水线中、
        构建自定义仪表板或自动化工作流程。
      </p>

      <h2>基础 URL</h2>
      <CodeBlock language="text">https://api.deployx.com/v1</CodeBlock>

      <h2>身份验证</h2>
      <p>
        所有 API 请求都需要通过{" "}
        <code>Authorization</code> 标头中的 Bearer 令牌进行身份验证。在
        DeployX 仪表板的设置 → API 令牌中生成 API 令牌。
      </p>
      <CodeBlock language="bash">
{`# Example authenticated request
curl -H "Authorization: Bearer dx_live_abc123def456" \\
  https://api.deployx.com/v1/orgs`}
      </CodeBlock>

      <Callout variant="warning" title="令牌安全">
        API 令牌拥有与你的账户相同的权限。切勿将它们暴露在客户端代码中或提交到版本控制。
        在 CI/CD 中使用环境变量或密钥管理。
      </Callout>

      <h2>响应格式</h2>
      <p>
        API 返回具有一致结构的 JSON 响应：
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

      <h2>错误处理</h2>
      <p>
        错误遵循 RFC 7807 问题详情格式：
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
            <th>状态码</th>
            <th>含义</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>400</td><td>错误请求 — 无效参数</td></tr>
          <tr><td>401</td><td>未授权 — 缺少或无效的令牌</td></tr>
          <tr><td>403</td><td>禁止访问 — 权限不足</td></tr>
          <tr><td>404</td><td>未找到 — 资源不存在</td></tr>
          <tr><td>429</td><td>请求过多 — 请求频率过高</td></tr>
          <tr><td>500</td><td>服务器内部错误</td></tr>
        </tbody>
      </table>

      <h2>速率限制</h2>
      <p>
        API 请求受到速率限制，以确保平台稳定性：
      </p>
      <ul>
        <li>Hobby: 每分钟 60 次</li>
        <li>Pro: 每分钟 300 次</li>
        <li>Business: 每分钟 1,000 次</li>
      </ul>
      <p>
        每个响应中都包含速率限制标头：
      </p>
      <CodeBlock language="text">
{`X-RateLimit-Limit: 300
X-RateLimit-Remaining: 298
X-RateLimit-Reset: 1700000000`}
      </CodeBlock>

      <h2>接口列表</h2>
      {endpointCategories.map((category) => (
        <div key={category.name}>
          <h3>{category.name}</h3>
          <table>
            <thead>
              <tr>
                <th>方法</th>
                <th>接口</th>
                <th>描述</th>
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
        为了获得更好的开发体验，请使用官方 DeployX SDK：
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
