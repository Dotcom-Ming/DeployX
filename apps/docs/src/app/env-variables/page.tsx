import { CodeBlock } from "../../components/code-block";
import { Callout } from "../../components/callout";

export default function EnvVariablesPage() {
  return (
    <div>
      <h1>环境变量</h1>
      <p>
        DeployX 允许你管理项目中的环境变量。
        变量在静态存储时经过加密，并可以限定在特定的部署环境范围内。
      </p>

      <h2>管理变量</h2>

      <h3>列出变量</h3>
      <CodeBlock language="bash">
{`# List all environment variables for a project
dx env ls --project my-app`}
      </CodeBlock>
      <p>
        输出结果显示变量名称、作用域和创建日期。出于安全考虑，值永远不会显示在 CLI 输出中。
      </p>

      <h3>添加变量</h3>
      <CodeBlock language="bash">
{`# Add a production variable
dx env add DATABASE_URL=postgres://user:pass@host:5432/db --project my-app --production

# Add a preview-only variable
dx env add DEBUG=true --project my-app --preview

# Add a variable for all environments
dx env add API_VERSION=v2 --project my-app`}
      </CodeBlock>

      <h3>移除变量</h3>
      <CodeBlock language="bash">
{`# Remove a specific variable
dx env remove OLD_API_KEY --project my-app`}
      </CodeBlock>

      <h2>作用域</h2>
      <p>
        环境变量可以限定在特定的部署环境中：
      </p>
      <table>
        <thead>
          <tr>
            <th>作用域</th>
            <th>标志</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>生产</td>
            <td><code>--production</code></td>
            <td>仅在生产部署中可用</td>
          </tr>
          <tr>
            <td>预览</td>
            <td><code>--preview</code></td>
            <td>仅在预览部署中可用</td>
          </tr>
          <tr>
            <td>全部</td>
            <td>（默认）</td>
            <td>在所有部署环境中可用</td>
          </tr>
        </tbody>
      </table>

      <h2>加密</h2>
      <p>
        所有环境变量在静态存储时均使用 AES-256-GCM 加密。
        DeployX 在创建后绝不会以明文形式存储或显示变量值。
      </p>
      <ul>
        <li>所有存储的值均采用 AES-256-GCM 加密</li>
        <li>值仅在构建时和运行时解密</li>
        <li>通过 TLS 1.3 在传输过程中加密</li>
        <li>访问日志记录所有对敏感变量的读取操作</li>
      </ul>

      <Callout variant="info" title="加密详情">
        DeployX 使用从硬件安全模块（HSM）派生出的每个项目专属加密密钥。
        密钥会自动轮换，并且绝不会与加密值一起存储。这确保了即使数据库被入侵，变量值仍然受到保护。
      </Callout>

      <h2>在应用中使用变量</h2>
      <p>
        环境变量通过 <code>process.env</code>（Node.js）或相应的运行时机制自动在你的应用程序中可用：
      </p>
      <CodeBlock language="javascript" filename="app.js">
{`// Access environment variables in Node.js
const databaseUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;

// Variables prefixed with NEXT_PUBLIC_ are exposed to the browser in Next.js
const publicVar = process.env.NEXT_PUBLIC_API_URL;`}
      </CodeBlock>

      <h2>框架特定说明</h2>
      <h3>Next.js</h3>
      <p>
        以 <code>NEXT_PUBLIC_</code> 为前缀的变量会暴露给浏览器。
        所有其他变量仅在 API 路由和服务器端代码中可用。
      </p>
      <h3>Nuxt</h3>
      <p>
        在 <code>nuxt.config</code> 中使用 <code>RUNTIME_CONFIG</code> 键来将环境变量映射到你的应用程序。
      </p>
      <h3>Vite</h3>
      <p>
        以 <code>VITE_</code> 为前缀的变量会暴露给浏览器。
        所有其他变量仅在构建过程中可用。
      </p>

      <Callout variant="warning" title="敏感数据">
        切勿将敏感凭据（API 密钥、数据库密码、机密信息）暴露给客户端。
        仅对非敏感的配置值使用框架特定的公共前缀。
      </Callout>

      <h2>CI/CD 集成</h2>
      <p>
        对于 CI/CD 流水线，请使用 API 令牌来管理环境变量：
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
