"use client";

import { Triangle } from "lucide-react";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, HelpCircle } from "lucide-react";

export function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b glass">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2">
            <Triangle className="h-6 w-6 fill-foreground text-foreground" />
            <span className="font-semibold text-lg">DeployX</span>
          </a>
          <OrgSwitcher />
          <BreadcrumbNav />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MessageSquare className="h-4 w-4" />
            <span className="sr-only">反馈</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <FileText className="h-4 w-4" />
            <span className="sr-only">更新日志</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">帮助</span>
          </Button>
          <NotificationBell />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
