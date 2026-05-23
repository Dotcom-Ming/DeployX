import type { Metadata } from "next";
import { DocsShell } from "@/components/docs-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeployX 文档",
  description: "DeployX 官方文档",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
