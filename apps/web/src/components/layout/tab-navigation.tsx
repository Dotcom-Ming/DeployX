"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
  pattern: RegExp;
}

const orgTabs: Tab[] = [
  { label: "Overview", href: "/dashboard", pattern: /\/dashboard$/ },
  { label: "Projects", href: "/projects", pattern: /\/projects/ },
  { label: "Deployments", href: "/deployments", pattern: /\/deployments$/ },
  { label: "Activity", href: "/activity", pattern: /\/activity/ },
  { label: "Usage", href: "/usage", pattern: /\/usage/ },
  { label: "Settings", href: "/settings", pattern: /\/settings$/ },
];

const projectTabs: Tab[] = [
  { label: "Project", href: "", pattern: /\/projects\/[^/]+$/ },
  { label: "Deployments", href: "/deployments", pattern: /\/deployments/ },
  { label: "Analytics", href: "/analytics", pattern: /\/analytics/ },
  { label: "Logs", href: "/logs", pattern: /\/logs/ },
  { label: "Storage", href: "/storage", pattern: /\/storage/ },
  { label: "Settings", href: "/settings", pattern: /\/settings/ },
];

export function TabNavigation({ orgSlug, projectId }: { orgSlug: string; projectId?: string }) {
  const pathname = usePathname();

  const isProjectContext = pathname.includes(`/projects/${projectId ?? ""}`);
  const tabs = isProjectContext ? projectTabs : orgTabs;
  const basePath = isProjectContext
    ? `/${orgSlug}/projects/${projectId}`
    : `/${orgSlug}`;

  const activeIndex = tabs.findIndex((tab) => tab.pattern.test(pathname));
  const activeTab = activeIndex >= 0 ? activeIndex : 0;

  return (
    <nav className="h-12 border-b bg-background">
      <div className="flex h-full items-center gap-1 px-4 max-w-7xl mx-auto relative">
        {tabs.map((tab, i) => {
          const isActive = i === activeTab;
          const href = `${basePath}${tab.href}`;

          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
