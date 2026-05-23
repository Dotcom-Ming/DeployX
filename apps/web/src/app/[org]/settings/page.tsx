"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Building2, Key, Webhook, Shield, Trash2, Loader2, Plus, Copy, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const NAV_ITEMS = [
  { id: "general", label: "General", icon: Building2 },
  { id: "tokens", label: "API Tokens", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "security", label: "Security", icon: Shield },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
];

interface Token {
  id: string;
  name: string;
  scopes: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  createdAt: string;
}

export default function OrgSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const org = params.org as string;

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");
  const [orgData, setOrgData] = useState<{ name: string; slug: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tokens state
  const [tokens, setTokens] = useState<Token[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenScopes, setNewTokenScopes] = useState("read");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(["deployment.created"]);

  // Danger zone state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, tokensRes, webhooksRes] = await Promise.all([
          fetch(`/api/orgs/${org}`),
          fetch(`/api/users/me/tokens`),
          fetch(`/api/orgs/${org}/webhooks`),
        ]);

        if (orgRes.ok) setOrgData(await orgRes.json());
        if (tokensRes.ok) setTokens(await tokensRes.json());
        if (webhooksRes.ok) setWebhooks(await webhooksRes.json());
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [org]);

  const handleSaveGeneral = async () => {
    if (!orgData) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/orgs/${org}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgData.name }),
      });

      if (!res.ok) {
        toast.error("Failed to update organization");
        return;
      }

      toast.success("Settings saved");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName) return;

    try {
      const res = await fetch("/api/users/me/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTokenName, scopes: newTokenScopes }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create token");
        return;
      }

      setCreatedToken(data.token || data.plainText);
      setTokens((prev) => [...prev, data]);
      setNewTokenName("");
      toast.success("Token created. Copy it now, you won't see it again!");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    try {
      const res = await fetch(`/api/users/me/tokens/${tokenId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to revoke token");
        return;
      }

      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      toast.success("Token revoked");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl) return;

    try {
      const res = await fetch(`/api/orgs/${org}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newWebhookUrl, events: newWebhookEvents }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create webhook");
        return;
      }

      setWebhooks((prev) => [...prev, data]);
      setNewWebhookUrl("");
      toast.success("Webhook created");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleToggleWebhook = async (webhookId: string, active: boolean) => {
    try {
      const res = await fetch(`/api/orgs/${org}/webhooks/${webhookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });

      if (!res.ok) {
        toast.error("Failed to update webhook");
        return;
      }

      setWebhooks((prev) =>
        prev.map((w) => (w.id === webhookId ? { ...w, active } : w))
      );
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteOrg = async () => {
    if (deleteConfirm !== orgData?.name) {
      toast.error("Organization name does not match");
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/orgs/${org}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete organization");
        return;
      }

      toast.success("Organization deleted");
      window.location.href = "/";
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your organization settings
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-48 shrink-0 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  activeTab === item.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>Update your organization details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgData?.name || ""}
                    onChange={(e) => setOrgData((prev) => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={orgData?.slug || ""} disabled className="font-mono" />
                  <p className="text-xs text-muted-foreground">The slug cannot be changed</p>
                </div>
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "tokens" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create API Token</CardTitle>
                  <CardDescription>Generate a token to authenticate API requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenName">Token Name</Label>
                    <Input
                      id="tokenName"
                      placeholder="e.g., CI/CD Pipeline"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenScopes">Scopes</Label>
                    <select
                      id="tokenScopes"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newTokenScopes}
                      onChange={(e) => setNewTokenScopes(e.target.value)}
                    >
                      <option value="read">Read only</option>
                      <option value="read:write">Read & Write</option>
                      <option value="read:write:delete">Full access</option>
                    </select>
                  </div>
                  <Button onClick={handleCreateToken} disabled={!newTokenName}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Token
                  </Button>
                </CardContent>
              </Card>

              {createdToken && (
                <Card className="border-yellow-500/50">
                  <CardHeader>
                    <CardTitle className="text-yellow-600">Copy your token</CardTitle>
                    <CardDescription>
                      This token will only be shown once. Make sure to copy it now.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 rounded-md bg-muted p-3 font-mono text-sm">
                      <code className="flex-1 truncate">{createdToken}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(createdToken);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Your Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  {tokens.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tokens created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {tokens.map((token) => (
                        <div key={token.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{token.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Scopes: {token.scopes}
                              {token.lastUsedAt ? ` • Last used: ${new Date(token.lastUsedAt).toLocaleDateString()}` : " • Never used"}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevokeToken(token.id)}
                          >
                            Revoke
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "webhooks" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Webhook</CardTitle>
                  <CardDescription>Receive HTTP notifications for events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">URL</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://example.com/webhook"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="flex flex-wrap gap-2">
                      {["deployment.created", "deployment.completed", "deployment.failed", "domain.verified"].map((event) => (
                        <Badge
                          key={event}
                          variant={newWebhookEvents.includes(event) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            setNewWebhookEvents((prev) =>
                              prev.includes(event)
                                ? prev.filter((e) => e !== event)
                                : [...prev, event]
                            );
                          }}
                        >
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreateWebhook} disabled={!newWebhookUrl}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Webhook
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Webhooks</CardTitle>
                </CardHeader>
                <CardContent>
                  {webhooks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No webhooks configured</p>
                  ) : (
                    <div className="space-y-3">
                      {webhooks.map((webhook) => (
                        <div key={webhook.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex-1">
                            <p className="font-medium truncate">{webhook.url}</p>
                            <p className="text-xs text-muted-foreground">
                              {webhook.events.join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={webhook.active}
                              onCheckedChange={(checked) => handleToggleWebhook(webhook.id, checked)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage security settings for your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-factor authentication</p>
                    <p className="text-sm text-muted-foreground">Require 2FA for all organization members</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session management</p>
                    <p className="text-sm text-muted-foreground">View and revoke active sessions</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "danger" && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
                  <div>
                    <p className="font-medium">Delete Organization</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this organization and all associated data.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                    Delete Organization
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete organization</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Type <strong>{orgData?.name}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`Type "${orgData?.name}" to confirm`}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrg}
              disabled={deleteConfirm !== orgData?.name || deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
