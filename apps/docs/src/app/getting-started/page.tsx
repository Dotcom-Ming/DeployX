import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

export default function GettingStartedPage() {
  return (
    <div>
      <h1>入门指南</h1>
      <p>
        只需几分钟即可让 DeployX 运行起来。本指南将带你完成安装 CLI、身份验证、部署第一个
        项目以及配置自定义域名的全过程。
      </p>

      <h2>前提条件</h2>
      <ul>
        <li>
          一个 <a href="https://deployx.com">DeployX 账户</a>
        </li>
        <li>Node.js 18 或更高版本</li>
        <li>包含 Web 项目的 Git 仓库</li>
      </ul>

      <h2>1. 安装 CLI</h2>
      <p>
        使用 npm、yarn 或 pnpm 全局安装 DeployX CLI：
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
        通过检查版本号来验证安装是否成功：
      </p>
      <CodeBlock language="bash">
{`dx --version
# dx/1.0.0`}
      </CodeBlock>

      <h2>2. 登录</h2>
      <p>
        使用你的 DeployX 账户进行身份验证。这将打开一个浏览器窗口进行
        OAuth 登录：
      </p>
      <CodeBlock language="bash">
{`dx login

# Alternatively, use an API token for CI/CD environments
dx login --token dx_live_abc123def456`}
      </CodeBlock>
      <Callout variant="tip" title="CI/CD 身份验证">
        在自动化环境中，请使用从 DeployX 控制台生成的 API 令牌配合 <code>--token</code> 标志。
        切勿将令牌提交到版本控制系统中——请使用 CI 提供商的密钥管理功能。
      </Callout>

      <h2>3. 部署你的第一个项目</h2>
      <p>
        进入你的项目目录并运行部署命令：
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
        DeployX 会自动检测你的框架并配置构建过程。
        首次部署会创建一个新项目并分配一个{" "}
        <code>*.deployx.app</code> 域名。
      </p>
      <CodeBlock language="bash">
{`▸ Detecting framework... Next.js
▸ Building project...
▸ Deploying to production...
▸ Done! https://my-awesome-app.deployx.app`}
      </CodeBlock>

      <h2>4. 配置自定义域名</h2>
      <p>
        为项目添加你自己的域名：
      </p>
      <CodeBlock language="bash">
{`# Add a domain
dx domains add my-awesome-app.com

# View DNS records to configure
dx domains verify my-awesome-app.com`}
      </CodeBlock>
      <Callout variant="info" title="DNS 配置">
        添加域名后，你需要在域名注册商处配置 DNS 记录。
        DeployX 会在验证步骤中提供所需的 CNAME 或 A 记录。有关详细说明，请参阅{" "}
        <a href="/domains">域名指南</a>。
      </Callout>

      <h2>后续步骤</h2>
      <ul>
        <li>
          <a href="/cli">CLI 参考</a> — 探索所有可用命令
        </li>
        <li>
          <a href="/deployments">部署</a> — 了解预览部署和
          生产部署
        </li>
        <li>
          <a href="/env-variables">环境变量</a> — 管理密钥
          和配置
        </li>
        <li>
          <a href="/api-reference">API 参考</a> — 将 DeployX 集成到
          你的工作流中
        </li>
      </ul>
    </div>
  );
}
