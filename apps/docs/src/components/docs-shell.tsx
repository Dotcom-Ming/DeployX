"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    title: "Getting Started",
    items: [
      { label: "Overview", href: "/" },
      { label: "Quick Start", href: "/getting-started" },
    ],
  },
  {
    title: "CLI",
    items: [{ label: "CLI Reference", href: "/cli" }],
  },
  {
    title: "Features",
    items: [
      { label: "Deployments", href: "/deployments" },
      { label: "Domains", href: "/domains" },
      { label: "Environment Variables", href: "/env-variables" },
      { label: "Billing", href: "/billing" },
    ],
  },
  {
    title: "API Reference",
    items: [{ label: "Overview", href: "/api-reference" }],
  },
  {
    title: "Guides",
    items: [
      { label: "Next.js", href: "/guides/nextjs" },
      { label: "Nuxt", href: "/guides/nuxt" },
      { label: "Vite", href: "/guides/vite" },
    ],
  },
];

export function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <>
      {/* Top bar */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "var(--topbar-height)",
          background: "var(--color-bg)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
          zIndex: 100,
          gap: "1rem",
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "var(--color-text)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="24" height="24" rx="6" fill="#6366f1" />
            <path
              d="M7 12L10 15L17 8"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          DeployX
        </Link>

        <div
          style={{
            flex: 1,
            maxWidth: "480px",
            margin: "0 auto",
            position: "relative",
          }}
        >
          <input
            type="text"
            placeholder="Search documentation..."
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem 0.5rem 2.25rem",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-secondary)",
              color: "var(--color-text)",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
          <svg
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <select
          style={{
            padding: "0.375rem 0.625rem",
            borderRadius: "6px",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-secondary)",
            color: "var(--color-text)",
            fontSize: "0.8125rem",
            cursor: "pointer",
          }}
          defaultValue="latest"
        >
          <option value="latest">v1 (Latest)</option>
          <option value="v0">v0 (Legacy)</option>
        </select>

        <button
          onClick={toggleTheme}
          style={{
            background: "none",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            padding: "0.375rem 0.5rem",
            cursor: "pointer",
            color: "var(--color-text)",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
      </header>

      {/* Sidebar */}
      <nav
        style={{
          position: "fixed",
          top: "var(--topbar-height)",
          left: 0,
          bottom: 0,
          width: "var(--sidebar-width)",
          background: "var(--color-sidebar-bg)",
          borderRight: "1px solid var(--color-sidebar-border)",
          overflowY: "auto",
          padding: "1rem 0",
        }}
      >
        {navSections.map((section) => (
          <div key={section.title} style={{ marginBottom: "1rem" }}>
            <div
              style={{
                padding: "0.375rem 1.25rem",
                fontSize: "0.6875rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-text-muted)",
              }}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "block",
                    padding: "0.375rem 1.25rem",
                    fontSize: "0.875rem",
                    color: isActive
                      ? "var(--color-sidebar-active)"
                      : "var(--color-text-secondary)",
                    background: isActive
                      ? "var(--color-primary-light)"
                      : "transparent",
                    borderRight: isActive
                      ? "2px solid var(--color-sidebar-active)"
                      : "2px solid transparent",
                    textDecoration: "none",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Main content */}
      <main
        style={{
          marginTop: "var(--topbar-height)",
          marginLeft: "var(--sidebar-width)",
          padding: "2rem 2.5rem",
          minHeight: "calc(100vh - var(--topbar-height))",
        }}
      >
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>{children}</div>
      </main>
    </>
  );
}
