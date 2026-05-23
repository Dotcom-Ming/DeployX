import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

export default function DeploymentsPage() {
  return (
    <div>
      <h1>部署</h1>
      <p>
        DeployX 支持两种部署环境：<strong>预览</strong>和
        <strong>生产</strong>。每种环境在开发工作流中
        服务于不同的目的。
      </p>

      <h2>预览部署</h2>
      <p>
        预览部署会在每次创建拉取请求时自动生成，也可以手动触发。它们提供了一个隔离的、临时的
        环境，用于在合并之前测试更改。
      </p>
      <ul>
        <li>自动分配 URL（<code>*-pr-42.preview.deployx.app</code>）</li>
        <li>拥有独立环境变量的隔离环境</li>
        <li>PR 关闭或合并后自动清理</li>
        <li>与团队成员分享预览 URL 以便审查</li>
      </ul>
      <CodeBlock language="bash">
{`# Create a preview deployment
dx deploy --branch feature/new-ui

# Deploy to a specific preview environment
dx deploy --preview --project my-app`}
      </CodeBlock>

      <Callout variant="tip" title="预览部署免费使用">
        所有套餐均包含预览部署，无需额外付费。
        它们与生产部署共享相同的资源，但在独立的容器中运行。
      </Callout>

      <h2>生产部署</h2>
      <p>
        生产部署在你的自定义域名上提供服务，并针对性能和可靠性进行了优化。它们会自动获取 SSL
        证书并由全球 CDN 提供支持。
      </p>
      <ul>
        <li>零停机部署，支持即时回滚</li>
        <li>自动 SSL 证书配置和续期</li>
        <li>支持边缘缓存的全球 CDN</li>
        <li>根据流量自动扩展</li>
        <li>商业版及以上套餐提供 99.99% 正常运行时间 SLA</li>
      </ul>
      <CodeBlock language="bash">
{`# Deploy to production
dx deploy --production --project my-app

# Redeploy a previous production deployment
dx deploy --production --deployment dep_abc123`}
      </CodeBlock>

      <h2>部署生命周期</h2>
      <p>每次部署都会经历以下阶段：</p>
      <ol>
        <li>
          <strong>排队中</strong> — 部署正在等待可用的构建器。
        </li>
        <li>
          <strong>构建中</strong> — DeployX 克隆你的仓库、安装依赖项并运行构建命令。
        </li>
        <li>
          <strong>部署中</strong> — 构建输出被部署到边缘服务器。
        </li>
        <li>
          <strong>就绪</strong> — 部署已上线并正在处理流量。
        </li>
      </ol>

      <h2>构建配置</h2>
      <p>
        DeployX 会自动检测你的框架并配置构建过程。你可以在项目根目录下的
        <code>deployx.json</code> 文件中覆盖这些设置：
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

      <h2>回滚</h2>
      <p>
        你可以即时回滚到之前的任何生产部署：
      </p>
      <CodeBlock language="bash">
{`# List recent deployments
dx deployments --project my-app

# Rollback to a specific deployment
dx deploy --production --rollback-to dep_abc123`}
      </CodeBlock>

      <Callout variant="warning" title="回滚范围">
        回滚会恢复部署的代码，但<strong>不会</strong>恢复数据库迁移或其他副作用。请确保你的数据库更改是向后兼容的。
      </Callout>

      <h2>部署保护</h2>
      <p>
        通过部署审批功能保护你的生产部署。要求团队成员在部署上线前进行审批：
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
