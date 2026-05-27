"use client";

import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Eye, EyeOff, Trash2, Edit, Lock, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getEnvVariables, createEnvVariable, updateEnvVariable, deleteEnvVariable } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type EnvTab = "production" | "preview" | "development";
type EnvVar = { id: string; key: string; value: string; target: string };

export default function EnvPage() {
  const { org: orgSlug = '', id: projectId = '' } = useParams<{ org: string; id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<EnvTab>("production");
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newTarget, setNewTarget] = useState<string>("production");
  const [importText, setImportText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: envVarsData, isLoading } = useQuery({
    queryKey: ["env-vars", orgSlug, projectId],
    queryFn: () => getEnvVariables(orgSlug, projectId),
  });

  const createMutation = useMutation({
    mutationFn: (data: { key: string; value: string; environment?: string }) =>
      createEnvVariable(orgSlug, projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["env-vars", orgSlug, projectId] });
      toast.success("变量已添加");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ varId, data }: { varId: string; data: { value?: string } }) =>
      updateEnvVariable(orgSlug, projectId, varId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["env-vars", orgSlug, projectId] });
      toast.success("变量已更新");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (varId: string) =>
      deleteEnvVariable(orgSlug, projectId, varId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["env-vars", orgSlug, projectId] });
      toast.success("变量已删除");
    },
  });

  const groupedVars: Record<string, EnvVar[]> = {
    production: [],
    preview: [],
    development: [],
  };

  if (envVarsData) {
    for (const v of envVarsData) {
      const target = (v.environment || v.target || "production").toLowerCase();
      if (groupedVars[target]) {
        groupedVars[target].push({
          id: v.id,
          key: v.key,
          value: v.value || "",
          target,
        });
      }
    }
  }

  const currentVars: EnvVar[] = groupedVars[activeTab];

  const toggleShowValue = (id: string) => {
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addVariable = () => {
    if (!newKey.trim()) {
      toast.error("键名不能为空");
      return;
    }
    createMutation.mutate({
      key: newKey.trim(),
      value: newValue,
      environment: activeTab,
    });
    setNewKey("");
    setNewValue("");
    setShowAddDialog(false);
  };

  const deleteVariable = (id: string) => {
    deleteMutation.mutate(id);
  };

  const startEdit = (envVar: EnvVar) => {
    setEditingId(envVar.id);
    setEditValue(envVar.value);
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({ varId: id, data: { value: editValue } });
    setEditingId(null);
  };

  const bulkImport = () => {
    const lines = importText.trim().split("\n");
    const promises: Promise<any>[] = [];
    for (const line of lines) {
      const eqIndex = line.indexOf("=");
      if (eqIndex > 0) {
        const key = line.slice(0, eqIndex).trim();
        const value = line.slice(eqIndex + 1).trim();
        if (key) {
          promises.push(createEnvVariable(orgSlug, projectId, { key, value, environment: activeTab }));
        }
      }
    }
    if (promises.length === 0) {
      toast.error("未找到有效的 KEY=VALUE 对");
      return;
    }
    Promise.all(promises)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["env-vars", orgSlug, projectId] });
        setImportText("");
        setShowImportDialog(false);
        toast.success(`已导入 ${promises.length} 个变量`);
      })
      .catch(() => toast.error("导入变量失败"));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载环境变量...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">环境变量</h1>
            <p className="text-muted-foreground mt-1">管理项目的环境变量</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" /> 导入
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> 添加变量
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Encryption badge */}
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-green-500" />
        <span className="text-xs text-muted-foreground">所有值在存储时均已加密</span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as EnvTab)}>
        <TabsList>
          <TabsTrigger value="production">生产环境</TabsTrigger>
          <TabsTrigger value="preview">预览环境</TabsTrigger>
          <TabsTrigger value="development">开发环境</TabsTrigger>
        </TabsList>

        {(["production", "preview", "development"] as EnvTab[]).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left p-4 font-medium w-[35%]">键名</th>
                        <th className="text-left p-4 font-medium">值</th>
                        <th className="text-right p-4 font-medium w-[120px]">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedVars[tab].map((envVar) => (
                        <tr key={envVar.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <span className="font-mono text-sm font-medium">{envVar.key}</span>
                          </td>
                          <td className="p-4">
                            {editingId === envVar.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="font-mono text-sm h-8"
                                  autoFocus
                                  onKeyDown={(e) => e.key === "Enter" && saveEdit(envVar.id)}
                                />
                                <Button size="sm" onClick={() => saveEdit(envVar.id)}>保存</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>取消</Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-muted-foreground">
                                  {showValues[envVar.id] ? envVar.value : "••••••••••••"}
                                </span>
                                <button onClick={() => toggleShowValue(envVar.id)} className="text-muted-foreground hover:text-foreground">
                                  {showValues[envVar.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(envVar)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteVariable(envVar.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {groupedVars[tab].length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-muted-foreground">
                            该环境暂无变量
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Variable Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加环境变量</DialogTitle>
            <DialogDescription>向项目添加新的环境变量</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
                <Label>键名</Label>
              <Input
                placeholder="API_KEY"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
                <Label>值</Label>
              <Input
                placeholder="value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
                <Label>目标环境</Label>
              <Select value={newTarget} onValueChange={setNewTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="production">生产环境</SelectItem>
                    <SelectItem value="preview">预览环境</SelectItem>
                    <SelectItem value="development">开发环境</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button onClick={addVariable} disabled={createMutation.isPending}>
              {createMutation.isPending ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量导入</DialogTitle>
            <DialogDescription>在下方粘贴您的 .env 文件内容</DialogDescription>
          </DialogHeader>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`KEY=value\nANOTHER_KEY=another_value`}
            className="w-full h-48 rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>取消</Button>
            <Button onClick={bulkImport}>导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
