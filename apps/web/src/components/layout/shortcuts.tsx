"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function Shortcuts() {
  const router = useRouter();
  const { currentOrg } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K is handled by CommandPalette component
      // CMD+O is handled by OrgSwitcher component

      // CMD+Shift+N: New project
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key === "N"
      ) {
        e.preventDefault();
        const orgSlug = currentOrg?.slug;
        if (orgSlug) {
          router.push(`/${orgSlug}/projects/new`);
        }
      }

      // CMD+Shift+D: Go to dashboard
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key === "D"
      ) {
        e.preventDefault();
        const orgSlug = currentOrg?.slug;
        if (orgSlug) {
          router.push(`/${orgSlug}/dashboard`);
        }
      }

      // CMD+.: Toggle command palette (alternative shortcut)
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        // Dispatch CMD+K event so CommandPalette picks it up
        const event = new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          ctrlKey: true,
        });
        document.dispatchEvent(event);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, currentOrg]);

  return null;
}
