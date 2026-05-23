"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
  const params = useParams<{ org: string; id: string }>();
  const orgSlug = params.org;
  const projectId = params.id;
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
      toast.success("Variable added");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ varId, data }: { varId: string; data: { value?: string } }) =>
      updateEnvVariable(orgSlug, projectId, varId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["env-vars", orgSlug, projectId] });
      toast.success("Variable updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (varId: string) =>
      deleteEnvVariable(orgSlug, projectId, varId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["env-vars", orgSlug, projectId] });
      toast.success("Variable deleted");
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
      toast.error("Key is required");
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
      toast.error("No valid KEY=VALUE pairs found");
      return;
    }
    Promise.all(promises)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["env-vars", orgSlug, projectId] });
        setImportText("");
        setShowImportDialog(false);
        toast.success(`${promises.length} variables imported`);
      })
      .catch(() => toast.error("Failed to import variables"));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading environment variables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Environment Variables</h1>
            <p className="text-muted-foreground mt-1">Manage environment variables for your project</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" /> Import
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Variable
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Encryption badge */}
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-green-500" />
        <span className="text-xs text-muted-foreground">All values are encrypted at rest</span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as EnvTab)}>
        <TabsList>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        {(["production", "preview", "development"] as EnvTab[]).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left p-4 font-medium w-[35%]">Key</th>
                        <th className="text-left p-4 font-medium">Value</th>
                        <th className="text-right p-4 font-medium w-[120px]">Actions</th>
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
                                <Button size="sm" onClick={() => saveEdit(envVar.id)}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
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
                            No environment variables for this environment
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
            <DialogTitle>Add Environment Variable</DialogTitle>
            <DialogDescription>Add a new environment variable to your project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input
                placeholder="API_KEY"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                placeholder="value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Target</Label>
              <Select value={newTarget} onValueChange={setNewTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="preview">Preview</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={addVariable} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import</DialogTitle>
            <DialogDescription>Paste your .env file content below</DialogDescription>
          </DialogHeader>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`KEY=value\nANOTHER_KEY=another_value`}
            className="w-full h-48 rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button onClick={bulkImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
