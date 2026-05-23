"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const crumbs: { label: string; href: string; isCurrent: boolean }[] = [];
  let accumulatedPath = "";

  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    projects: "Projects",
    deployments: "Deployments",
    domains: "Domains",
    env: "Environment",
    logs: "Logs",
    analytics: "Analytics",
    settings: "Settings",
    team: "Team",
    billing: "Billing",
    "audit-log": "Audit Log",
    new: "New",
  };

  for (let i = 0; i < segments.length; i++) {
    accumulatedPath += `/${segments[i]}`;
    const segment = segments[i];
    const label =
      labelMap[segment] ??
      (i === 0 ? segment : segment);
    const isCurrent = i === segments.length - 1;
    crumbs.push({ label, href: accumulatedPath, isCurrent });
  }

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="contents">
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isCurrent ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
