"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Check, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock data (fallback)
// ---------------------------------------------------------------------------

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isPersonal: boolean;
  avatarUrl?: string;
}

const MOCK_ORGS: Organization[] = [
  {
    id: "org_01",
    name: "Alice",
    slug: "alice",
    plan: "Hobby",
    isPersonal: true,
  },
  {
    id: "org_02",
    name: "Acme Corp",
    slug: "acme",
    plan: "Pro",
    isPersonal: false,
  },
  {
    id: "org_03",
    name: "Zenith Labs",
    slug: "zenith",
    plan: "Enterprise",
    isPersonal: false,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const { org: orgSlug } = useParams<{ org: string }>();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const { data: organizations } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/organizations");
      if (!res.ok) return [];
      return res.json() as Promise<Organization[]>;
    },
  });

  const orgs = (organizations?.length ? organizations : MOCK_ORGS) as Organization[];

  const currentOrgId =
    orgs.find((o) => o.slug === orgSlug)?.id ?? orgs[0]?.id ?? "";

  const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? orgs[0];
  const personalOrgs = orgs.filter((o) => o.isPersonal);
  const teamOrgs = orgs.filter((o) => !o.isPersonal).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // CMD+O shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "o") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (orgId: string) => {
    const org = orgs.find((o) => o.id === orgId);
    if (org && org.id !== currentOrgId) {
      setSwitching(true);
      setTimeout(() => {
        navigate(`/${org.slug}/dashboard`);
        setSwitching(false);
      }, 200);
    }
    setOpen(false);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <>
      <AnimatePresence>
        {switching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 px-2 text-sm font-medium"
          >
            <Avatar className="h-5 w-5">
              {currentOrg?.avatarUrl && (
                <AvatarImage src={currentOrg.avatarUrl} alt={currentOrg.name} />
              )}
              <AvatarFallback className="text-[10px] bg-muted">
                {getInitials(currentOrg?.name ?? "")}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[120px] truncate">{currentOrg?.name}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="搜索工作区..." />
            <CommandList>
              <CommandEmpty>未找到工作区。</CommandEmpty>

              {personalOrgs.length > 0 && (
                <CommandGroup heading="个人账号">
                  {personalOrgs.map((org) => (
                    <CommandItem
                      key={org.id}
                      onSelect={() => handleSelect(org.id)}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-5 w-5">
                        {org.avatarUrl && (
                          <AvatarImage src={org.avatarUrl} alt={org.name} />
                        )}
                        <AvatarFallback className="text-[10px] bg-muted">
                          {getInitials(org.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{org.name}</span>
                      {currentOrgId === org.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {teamOrgs.length > 0 && (
                <>
                  {personalOrgs.length > 0 && <CommandSeparator />}
                  <CommandGroup heading="团队">
                    {teamOrgs.map((org) => (
                      <CommandItem
                        key={org.id}
                        onSelect={() => handleSelect(org.id)}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-5 w-5">
                          {org.avatarUrl && (
                            <AvatarImage src={org.avatarUrl} alt={org.name} />
                          )}
                          <AvatarFallback className="text-[10px] bg-muted">
                            {getInitials(org.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate">{org.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {org.plan}
                        </Badge>
                        {currentOrgId === org.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>

            <CommandSeparator />

            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setOpen(false);
                  navigate("/signup?createOrg=true");
                }}
              >
                <Plus className="h-4 w-4" />
                创建团队
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setOpen(false);
                  const target = currentOrg?.slug ?? orgSlug ?? "";
                  navigate(`/${target}/settings`);
                }}
              >
                <Settings2 className="h-4 w-4" />
                管理团队
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
