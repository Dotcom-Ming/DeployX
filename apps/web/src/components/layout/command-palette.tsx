"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Command,
} from "@/components/ui/command";
import {
  Search,
  Plus,
  Building2,
  Sun,
  Moon,
  Monitor,
  LayoutDashboard,
  FolderKanban,
  Rocket,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();
  const { currentOrg } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const orgSlug = currentOrg?.slug ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-lg">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(`/${orgSlug}/dashboard`))
                }
              >
                <LayoutDashboard className="mr-2" />
                Dashboard
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(`/${orgSlug}/projects`))
                }
              >
                <FolderKanban className="mr-2" />
                Projects
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(`/${orgSlug}/projects/new`))
                }
              >
                <Plus className="mr-2" />
                Create Project
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(`/${orgSlug}/projects/new`))
                }
              >
                <Rocket className="mr-2" />
                New Deployment
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    const event = new KeyboardEvent("keydown", {
                      key: "o",
                      metaKey: true,
                      ctrlKey: true,
                    });
                    document.dispatchEvent(event);
                  })
                }
              >
                <Building2 className="mr-2" />
                Switch Organization
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Theme">
              <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                <Sun className="mr-2" />
                Light
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                <Moon className="mr-2" />
                Dark
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                <Monitor className="mr-2" />
                System
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
