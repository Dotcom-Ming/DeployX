import { Link } from "react-router-dom";

const quickLinks = [
  {
    title: "入门指南",
    description: "在几分钟内设置账户、安装 CLI 并部署你的第一个项目。",
    href: "/getting-started",
    icon: "🚀",
  },
  {
    title: "CLI 参考",
    description: "DeployX 命令行界面及所有可用命令的完整参考。",
    href: "/cli",
    icon: "💻",
  },
  {
    title: "API 参考",
    description: "将 DeployX 集成到现有工作流程中的 REST API 文档。",
    href: "/api-reference",
    icon: "⚡",
  },
  {
    title: "部署指南",
    description: "了解预览部署、生产发布和部署策略。",
    href: "/deployments",
    icon: "📦",
  },
];

export default function DocsHome() {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "3rem 0 2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
          DeployX 文档
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--color-text-secondary)",
            maxWidth: "36rem",
            margin: "0 auto 2rem",
          }}
        >
          部署、扩展和管理你的应用所需的一切
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.75rem",
          }}
        >
          <Link
            to="/getting-started"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.625rem 1.25rem",
              background: "var(--color-primary)",
              color: "#ffffff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.9375rem",
            }}
          >
            开始使用
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link
            to="/api-reference"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.625rem 1.25rem",
              background: "var(--color-bg-secondary)",
              color: "var(--color-text)",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.9375rem",
              border: "1px solid var(--color-border)",
            }}
          >
            API 参考
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            style={{
              display: "block",
              padding: "1.5rem",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              {link.icon}
            </div>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: "0.375rem",
                color: "var(--color-text)",
              }}
            >
              {link.title}
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                marginBottom: 0,
              }}
            >
              {link.description}
            </p>
          </Link>
        ))}
      </div>

      <div
        style={{
          marginTop: "2.5rem",
          padding: "2rem",
          background: "var(--color-bg-secondary)",
          borderRadius: "12px",
          textAlign: "center",
          border: "1px solid var(--color-border)",
        }}
      >
        <p
          style={{
            fontSize: "1rem",
            color: "var(--color-text-secondary)",
            marginBottom: "0.75rem",
          }}
        >
          想找什么？使用搜索栏浏览文档
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
          }}
        >
          <kbd
            style={{
              padding: "0.125rem 0.375rem",
              borderRadius: "4px",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg)",
              fontSize: "0.75rem",
              fontFamily: "monospace",
            }}
          >
            Ctrl
          </kbd>
          +
          <kbd
            style={{
              padding: "0.125rem 0.375rem",
              borderRadius: "4px",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg)",
              fontSize: "0.75rem",
              fontFamily: "monospace",
            }}
          >
            K
          </kbd>
          搜索
        </div>
      </div>
    </div>
  );
}
