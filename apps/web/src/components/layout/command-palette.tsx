"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
        <DialogTitle className="sr-only">命令面板</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput placeholder="输入命令或搜索..." />
          <CommandList>
            <CommandEmpty>未找到结果。</CommandEmpty>
            <CommandGroup heading="页面">
              <CommandItem
                onSelect={() =>
                  runCommand(() => navigate(`/${orgSlug}/dashboard`))
                }
              >
                <LayoutDashboard className="mr-2" />
                仪表盘
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => navigate(`/${orgSlug}/projects`))
                }
              >
                <FolderKanban className="mr-2" />
                项目
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => navigate(`/${orgSlug}/projects/new`))
                }
              >
                <Plus className="mr-2" />
                创建项目
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="操作">
              <CommandItem
                onSelect={() =>
                  runCommand(() => navigate(`/${orgSlug}/projects/new`))
                }
              >
                <Rocket className="mr-2" />
                新建部署
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
                切换组织
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="主题">
              <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                <Sun className="mr-2" />
                浅色
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                <Moon className="mr-2" />
                深色
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                <Monitor className="mr-2" />
                系统
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
