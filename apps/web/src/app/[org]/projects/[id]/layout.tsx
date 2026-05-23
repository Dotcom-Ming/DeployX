"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
  pattern: RegExp;
}

const tabs: Tab[] = [
  { label: "Project", href: "", pattern: /\/projects\/[^/]+$/ },
  { label: "Deployments", href: "/deployments", pattern: /\/deployments/ },
  { label: "Analytics", href: "/analytics", pattern: /\/analytics/ },
  { label: "Logs", href: "/logs", pattern: /\/logs/ },
  { label: "Storage", href: "/storage", pattern: /\/storage/ },
  { label: "Settings", href: "/settings", pattern: /\/settings/ },
];

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams<{ org: string; id: string }>();
  const { org, id } = params;

  const activeIndex = tabs.findIndex((tab) => tab.pattern.test(pathname));
  const activeTab = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div className="space-y-0">
      {/* Tab navigation */}
      <nav className="border-b bg-background">
        <div className="flex h-11 items-center gap-1 px-0 relative overflow-x-auto">
          {tabs.map((tab, i) => {
            const isActive = i === activeTab;
            const href = `/${org}/projects/${id}${tab.href}`;

            return (
              <Link
                key={tab.label}
                href={href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Page content */}
      <div className="p-6">{children}</div>
    </div>
  );
}
