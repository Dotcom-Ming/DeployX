"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Copy, Trash2, ShieldCheck, ShieldAlert, ShieldX, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getDomains, addDomain, removeDomain } from "@/lib/api";
import { SslStatus } from "@deployx/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const sslStatusConfig: Record<string, { icon: typeof ShieldCheck; color: string; label: string }> = {
  [SslStatus.ISSUED]: { icon: ShieldCheck, color: "text-green-500", label: "SSL Active" },
  [SslStatus.PENDING]: { icon: ShieldAlert, color: "text-yellow-500", label: "SSL Pending" },
  [SslStatus.RENEWING]: { icon: ShieldAlert, color: "text-yellow-500", label: "SSL Renewing" },
  [SslStatus.ERROR]: { icon: ShieldX, color: "text-red-500", label: "SSL Error" },
};

export default function DomainsPage() {
  const params = useParams<{ org: string; id: string }>();
  const orgSlug = params.org;
  const projectId = params.id;
  const queryClient = useQueryClient();

  const [newDomain, setNewDomain] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: domains, isLoading } = useQuery({
    queryKey: ["domains", orgSlug, projectId],
    queryFn: () => getDomains(orgSlug, projectId),
  });

  const addMutation = useMutation({
    mutationFn: (domain: string) => addDomain(orgSlug, projectId, domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains", orgSlug, projectId] });
      toast.success(`Domain ${newDomain} added`);
      setNewDomain("");
      setShowAddDialog(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (domainId: string) => removeDomain(orgSlug, projectId, domainId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains", orgSlug, projectId] });
      toast.success("Domain removed");
    },
  });

  const addDomainHandler = () => {
    if (!newDomain.trim()) return;
    addMutation.mutate(newDomain.trim());
  };

  const removeDomainHandler = (id: string) => {
    removeMutation.mutate(id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading domains...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Domains</h1>
            <p className="text-muted-foreground mt-1">Manage custom domains for your project</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Domain
          </Button>
        </div>
      </motion.div>

      {/* Domain list */}
      <div className="space-y-4">
        {(domains || []).map((domain: any, i: number) => {
          const sslConfig = sslStatusConfig[domain.sslStatus] || sslStatusConfig[SslStatus.PENDING];
          const SslIcon = sslConfig.icon;

          return (
            <motion.div
              key={domain.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      {/* Domain name + SSL */}
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-medium">{domain.domain || domain.name}</span>
                        <div className="flex items-center gap-1.5">
                          <SslIcon className={`h-4 w-4 ${sslConfig.color}`} />
                          <span className={`text-xs ${sslConfig.color}`}>{sslConfig.label}</span>
                        </div>
                      </div>

                      {/* DNS config */}
                      {domain.sslStatus !== SslStatus.ISSUED && (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <h4 className="text-sm font-medium">DNS Configuration</h4>
                          <p className="text-xs text-muted-foreground">
                            Add a CNAME record to your DNS provider to verify ownership:
                          </p>
                          <div className="flex items-center gap-2 text-sm font-mono bg-background rounded border p-2">
                            <span className="text-muted-foreground">CNAME</span>
                            <span>{domain.domain || domain.name}</span>
                            <span className="text-muted-foreground">→</span>
                            <span>cname.deployx.dev</span>
                            <button onClick={() => copyToClipboard("cname.deployx.dev")} className="ml-auto">
                              <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Verified info */}
                      {domain.verifiedAt && (
                        <p className="text-xs text-muted-foreground">
                          Verified on {new Date(domain.verifiedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => window.open(`https://${domain.domain || domain.name}`, "_blank")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Domain</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove <strong className="font-mono">{domain.domain || domain.name}</strong>? This will disconnect the domain from your project and may affect live traffic.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeDomainHandler(domain.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {(!domains || domains.length === 0) && (
          <div className="py-8 text-center text-muted-foreground">
            No domains configured yet
          </div>
        )}
      </div>

      {/* Add Domain Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Domain</DialogTitle>
            <DialogDescription>Enter the domain you want to connect to your project</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDomainHandler()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={addDomainHandler} disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
