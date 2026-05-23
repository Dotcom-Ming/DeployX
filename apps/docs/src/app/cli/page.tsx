import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

const commands = [
  {
    name: "dx deploy",
    description: "将你的项目部署到 DeployX。自动检测框架、构建项目并创建部署。",
    flags: [
      { flag: "--project <name>", description: "目标项目名称或 ID" },
      { flag: "--env <KEY=VALUE>", description: "为部署设置环境变量" },
      { flag: "--branch <name>", description: "部署指定的 Git 分支（默认：当前分支）" },
      { flag: "--no-cache", description: "强制进行无缓存的干净构建" },
      { flag: "--production", description: "部署到生产环境" },
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
    description: "查看部署的实时日志。支持按部署、类型和时间范围进行筛选。",
    flags: [
      { flag: "--project <name>", description: "项目名称或 ID" },
      { flag: "--deployment <id>", description: "特定部署 ID" },
      { flag: "--type <type>", description: "日志类型：build、runtime 或 all（默认：all）" },
      { flag: "--follow, -f", description: "实时跟踪日志输出" },
      { flag: "--since <duration>", description: "显示自指定时长以来的日志（例如 30m、2h）" },
    ],
    examples: [
      "dx logs --project my-app",
      "dx logs --project my-app --follow --type runtime",
      "dx logs --project my-app --since 1h",
    ],
  },
  {
    name: "dx domains",
    description: "管理项目的自定义域名。添加、移除和验证域名配置。",
    flags: [
      { flag: "add <domain>", description: "为项目添加自定义域名" },
      { flag: "remove <domain>", description: "从项目中移除域名" },
      { flag: "verify <domain>", description: "验证域名的 DNS 配置" },
      { flag: "--project <name>", description: "目标项目名称或 ID" },
    ],
    examples: [
      "dx domains add example.com --project my-app",
      "dx domains verify example.com --project my-app",
      "dx domains remove example.com --project my-app",
    ],
  },
  {
    name: "dx env",
    description: "管理项目的环境变量。变量在静态存储时加密，并可限定在预览或生产环境中。",
    flags: [
      { flag: "ls", description: "列出所有环境变量" },
      { flag: "add <KEY=VALUE>", description: "添加或更新环境变量" },
      { flag: "remove <KEY>", description: "移除环境变量" },
      { flag: "--project <name>", description: "目标项目名称或 ID" },
      { flag: "--preview", description: "将变量限定为仅预览部署可用" },
      { flag: "--production", description: "将变量限定为仅生产部署可用" },
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
    description: "创建、列出和管理你的 DeployX 项目。",
    flags: [
      { flag: "ls", description: "列出当前组织中的所有项目" },
      { flag: "create <name>", description: "创建新项目" },
      { flag: "delete <name>", description: "删除项目" },
      { flag: "--org <slug>", description: "目标组织" },
      { flag: "--region <code>", description: "部署区域（例如 us-east、eu-west）" },
    ],
    examples: [
      "dx projects ls --org my-team",
      "dx projects create my-new-app --org my-team --region us-east",
      "dx projects delete old-project --org my-team",
    ],
  },
  {
    name: "dx orgs",
    description: "管理你的组织和团队成员。",
    flags: [
      { flag: "ls", description: "列出你所属的所有组织" },
      { flag: "create <name>", description: "创建新组织" },
      { flag: "members", description: "列出组织成员" },
      { flag: "invite <email>", description: "邀请成员加入组织" },
      { flag: "--org <slug>", description: "目标组织标识" },
      { flag: "--role <role>", description: "被邀请成员的角色（admin、developer、viewer）" },
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
      <h1>CLI 参考</h1>
      <p>
        DeployX CLI（<code>dx</code>）是从终端与平台交互的主要方式。
        全局安装后即可管理部署、域名、环境变量等更多功能。
      </p>

      <Callout variant="info" title="安装">
        使用 <code>npm install -g @deployx/cli</code> 安装 CLI。有关详细的设置说明，请参阅{" "}
        <a href="/getting-started">入门指南</a>。
      </Callout>

      {commands.map((cmd) => (
        <div key={cmd.name}>
          <h2>
            <code>{cmd.name}</code>
          </h2>
          <p>{cmd.description}</p>

          <h3>标志</h3>
          <table>
            <thead>
              <tr>
                <th>标志</th>
                <th>说明</th>
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

          <h3>示例</h3>
          {cmd.examples.map((example) => (
            <CodeBlock key={example} language="bash">
              {example}
            </CodeBlock>
          ))}
        </div>
      ))}

      <h2>全局标志</h2>
      <p>以下标志适用于所有命令：</p>
      <table>
        <thead>
          <tr>
            <th>标志</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--help</code></td>
            <td>显示命令的帮助信息</td>
          </tr>
          <tr>
            <td><code>--version</code></td>
            <td>打印 CLI 版本号</td>
          </tr>
          <tr>
            <td><code>--debug</code></td>
            <td>启用详细的调试输出</td>
          </tr>
          <tr>
            <td><code>--config &lt;path&gt;</code></td>
            <td>自定义配置文件的路径</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
