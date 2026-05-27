"use client";

import { useState } from "react";
import { useParams } from "react-router-dom";
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
  [SslStatus.ISSUED]: { icon: ShieldCheck, color: "text-green-500", label: "SSL 已激活" },
  [SslStatus.PENDING]: { icon: ShieldAlert, color: "text-yellow-500", label: "SSL 待处理" },
  [SslStatus.RENEWING]: { icon: ShieldAlert, color: "text-yellow-500", label: "SSL 续签中" },
  [SslStatus.ERROR]: { icon: ShieldX, color: "text-red-500", label: "SSL 错误" },
};

export default function DomainsPage() {
  const { org: orgSlug = '', id: projectId = '' } = useParams<{ org: string; id: string }>();
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
      toast.success(`域名 ${newDomain} 已添加`);
      setNewDomain("");
      setShowAddDialog(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (domainId: string) => removeDomain(orgSlug, projectId, domainId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains", orgSlug, projectId] });
      toast.success("域名已删除");
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
    toast.success("已复制到剪贴板");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载域名列表...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">域名</h1>
            <p className="text-muted-foreground mt-1">管理项目的自定义域名</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> 添加域名
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
                          <h4 className="text-sm font-medium">DNS 配置</h4>
                          <p className="text-xs text-muted-foreground">
                            在 DNS 提供商处添加 CNAME 记录以验证所有权：
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
                          验证于 {new Date(domain.verifiedAt).toLocaleDateString()}
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
                            <AlertDialogTitle>删除域名</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除 <strong className="font-mono">{domain.domain || domain.name}</strong> 吗？这将断开该域名与项目的连接，可能会影响线上流量。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeDomainHandler(domain.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              删除
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
            尚未配置域名
          </div>
        )}
      </div>

      {/* Add Domain Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加域名</DialogTitle>
            <DialogDescription>输入您想要连接到项目的域名</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDomainHandler()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button onClick={addDomainHandler} disabled={addMutation.isPending}>
              {addMutation.isPending ? "添加中..." : "添加域名"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
