import type { Metadata } from "next";
import { DocsShell } from "@/components/docs-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeployX Docs",
  description: "DeployX documentation",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
