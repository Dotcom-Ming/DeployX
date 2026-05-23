"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isPersonal: boolean;
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState("org_02");

  const currentOrg = MOCK_ORGS.find((o) => o.id === currentOrgId) ?? MOCK_ORGS[0];
  const personalOrgs = MOCK_ORGS.filter((o) => o.isPersonal);
  const teamOrgs = MOCK_ORGS.filter((o) => !o.isPersonal).sort((a, b) =>
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
    const org = MOCK_ORGS.find((o) => o.id === orgId);
    if (org) {
      setCurrentOrgId(orgId);
      router.push(`/${org.slug}/dashboard`);
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-2 text-sm font-medium"
        >
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px] bg-muted">
              {getInitials(currentOrg.name)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[120px] truncate">{currentOrg.name}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search workspaces..." />
          <CommandList>
            <CommandEmpty>No workspaces found.</CommandEmpty>

            {/* Personal Account */}
            {personalOrgs.length > 0 && (
              <CommandGroup heading="Personal Account">
                {personalOrgs.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => handleSelect(org.id)}
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-5 w-5">
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

            {/* Teams */}
            {teamOrgs.length > 0 && (
              <>
                {personalOrgs.length > 0 && <CommandSeparator />}
                <CommandGroup heading="Teams">
                  {teamOrgs.map((org) => (
                    <CommandItem
                      key={org.id}
                      onSelect={() => handleSelect(org.id)}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-5 w-5">
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
                router.push("/signup?createOrg=true");
              }}
            >
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
