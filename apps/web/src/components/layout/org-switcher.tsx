"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Plan } from "@deployx/shared";
import { PLAN_DISPLAY_NAMES } from "@deployx/shared";
import { cn } from "@/lib/utils";

export function OrgSwitcher() {
  const { orgs, currentOrg, switchOrg } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const orgLabel = currentOrg?.name ?? "Select org";

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

  const personalOrgs = orgs.filter(
    (o) => o.plan === Plan.HOBBY && o.ownerId === currentOrg?.ownerId
  );
  const teamOrgs = orgs.filter(
    (o) => !(o.plan === Plan.HOBBY && o.ownerId === currentOrg?.ownerId)
  );

  const handleSelect = (orgId: string) => {
    switchOrg(orgId);
    const org = orgs.find((o) => o.id === orgId);
    if (org) {
      router.push(`/${org.slug}/dashboard`);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-2 text-sm font-medium"
        >
          <Avatar className="h-5 w-5">
            <AvatarImage src="" alt={currentOrg?.name} />
            <AvatarFallback className="text-[10px]">
              {currentOrg?.name?.charAt(0)?.toUpperCase() ?? "O"}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[120px] truncate" translate="no">{orgLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            {personalOrgs.length > 0 && (
              <CommandGroup heading="Personal Account">
                {personalOrgs.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => handleSelect(org.id)}
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {org.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">{org.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {PLAN_DISPLAY_NAMES[org.plan]}
                    </Badge>
                    {currentOrg?.id === org.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {teamOrgs.length > 0 && (
              <>
                {personalOrgs.length > 0 && <CommandSeparator />}
                <CommandGroup heading="Teams">
                  {teamOrgs
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((org) => (
                      <CommandItem
                        key={org.id}
                        onSelect={() => handleSelect(org.id)}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {org.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate">{org.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {PLAN_DISPLAY_NAMES[org.plan]}
                        </Badge>
                        {currentOrg?.id === org.id && (
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
