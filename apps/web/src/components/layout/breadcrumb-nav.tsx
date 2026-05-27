"use client";

import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function BreadcrumbNav() {
  const pathname = useLocation().pathname;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const crumbs: { label: string; href: string; isCurrent: boolean }[] = [];
  let accumulatedPath = "";

  const labelMap: Record<string, string> = {
    dashboard: "仪表盘",
    projects: "项目",
    deployments: "部署",
    domains: "域名",
    env: "环境变量",
    logs: "日志",
    analytics: "分析",
    settings: "设置",
    team: "团队",
    billing: "账单",
    "audit-log": "审计日志",
    new: "新建",
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
