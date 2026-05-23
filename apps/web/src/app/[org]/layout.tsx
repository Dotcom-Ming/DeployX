"use client";

import { TopBar } from "@/components/layout/top-bar";
import { TabNavigation } from "@/components/layout/tab-navigation";
import { CommandPalette } from "@/components/layout/command-palette";
import { Shortcuts } from "@/components/layout/shortcuts";
import { AuthProvider } from "@/components/providers/auth-provider";
import { useParams } from "next/navigation";

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ org: string }>();
  const org = params.org;

  return (
    <AuthProvider>
      <div className="min-h-screen">
        <TopBar />
        <div className="pt-14">
          <TabNavigation orgSlug={org} />
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </div>
        <CommandPalette />
        <Shortcuts />
      </div>
    </AuthProvider>
  );
}
