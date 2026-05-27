"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Key,
  Webhook,
  Shield,
  Trash2,
  Loader2,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Upload,
  RefreshCw,
  Monitor,
  Smartphone,
  Lock,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { toast } from "sonner";

const NAV_ITEMS = [
  { id: "general", label: "常规", icon: Building2 },
  { id: "tokens", label: "API 令牌", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "domains", label: "域名", icon: Globe },
  { id: "security", label: "安全", icon: Shield },
  { id: "danger", label: "危险操作", icon: Trash2 },
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

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  createdAt: string;
}

interface Session {
  id: string;
  device: string;
  ip: string;
  lastActivity: string;
  current: boolean;
  icon: typeof Monitor;
}

const MOCK_SESSIONS: Session[] = [
  { id: "s1", device: "Chrome · macOS", ip: "203.0.113.42", lastActivity: "刚刚", current: true, icon: Monitor },
  { id: "s2", device: "Safari · iPhone", ip: "203.0.113.18", lastActivity: "2 小时前", current: false, icon: Smartphone },
  { id: "s3", device: "Firefox · Windows", ip: "198.51.100.7", lastActivity: "3 天前", current: false, icon: Monitor },
];

const MOCK_DOMAINS: Domain[] = [
  { id: "d1", domain: "example.com", verified: true, createdAt: "2025-01-15" },
  { id: "d2", domain: "app.example.com", verified: false, createdAt: "2025-03-20" },
];

function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "whsec_";
  for (let i = 0; i !== 32; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function OrgSettingsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const org = params.org as string;

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");
  const [orgData, setOrgData] = useState({ name: "", slug: "", defaultRegion: "auto", plan: "hobby" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tokens, setTokens] = useState<Token[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenScopes, setNewTokenScopes] = useState("read");
  const [newTokenExpiration, setNewTokenExpiration] = useState("never");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(["deployment.created"]);
  const [newWebhookSecret, setNewWebhookSecret] = useState(generateSecret());
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [domains, setDomains] = useState<Domain[]>(MOCK_DOMAINS);
  const [newDomain, setNewDomain] = useState("");

  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [require2FA, setRequire2FA] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [ipList, setIpList] = useState<string[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, tokensRes, webhooksRes] = await Promise.all([
          fetch(`/api/orgs/${org}`),
          fetch("/api/users/me/tokens"),
          fetch(`/api/orgs/${org}/webhooks`),
        ]);
        if (orgRes.ok) {
          const data = await orgRes.json();
          setOrgData({ name: data.name || "", slug: data.slug || "", defaultRegion: data.defaultRegion || "auto", plan: data.plan || "hobby" });
        }
        if (tokensRes.ok) setTokens(await tokensRes.json());
        if (webhooksRes.ok) setWebhooks(await webhooksRes.json());
      } catch {
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
        body: JSON.stringify({ name: orgData.name, defaultRegion: orgData.defaultRegion }),
      });
      if (!res.ok) { toast.error("更新组织失败"); return; }
      toast.success("设置已保存");
    } catch { toast.error("出了点问题"); } finally { setSaving(false); }
  };

  const handleLogoDrop = useCallback((e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = "dataTransfer" in e ? e.dataTransfer?.files?.[0] : (e as React.ChangeEvent<HTMLInputElement>).target?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string | null);
      reader.readAsDataURL(file);
      toast.success("Logo 已上传");
    } else {
      toast.error("请上传图片文件");
    }
  }, []);

  const handleCreateToken = async () => {
    if (!newTokenName) return;
    let expiresAt = null;
    if (newTokenExpiration === "30d") expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    else if (newTokenExpiration === "90d") expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
    else if (newTokenExpiration === "1y") expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
    else if (newTokenExpiration === "custom" && customExpiryDate) expiresAt = new Date(customExpiryDate).toISOString();
    try {
      const res = await fetch("/api/users/me/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTokenName, scopes: newTokenScopes, expiresAt }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "创建令牌失败"); return; }
      setCreatedToken(data.token || data.plainText);
      setTokens((prev) => [...prev, data]);
      setNewTokenName(""); setNewTokenExpiration("never"); setCustomExpiryDate("");
      toast.success("令牌已创建。请立即复制，之后将无法再次查看！");
    } catch { toast.error("出了点问题"); }
  };

  const handleRevokeToken = async (tokenId: string) => {
    try {
      const res = await fetch(`/api/users/me/tokens/${tokenId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("撤销令牌失败"); return; }
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      toast.success("令牌已撤销");
    } catch { toast.error("出了点问题"); }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl) return;
    try {
      const res = await fetch(`/api/orgs/${org}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newWebhookUrl, events: newWebhookEvents, secret: newWebhookSecret }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "创建 Webhook 失败"); return; }
      setWebhooks((prev) => [...prev, data]);
      setNewWebhookUrl(""); setNewWebhookSecret(generateSecret());
      toast.success("Webhook 已创建");
    } catch { toast.error("出了点问题"); }
  };

  const handleToggleWebhook = async (webhookId: string, active: boolean) => {
    try {
      const res = await fetch(`/api/orgs/${org}/webhooks/${webhookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) { toast.error("更新 Webhook 失败"); return; }
      setWebhooks((prev) => prev.map((w) => (w.id === webhookId ? { ...w, active } : w)));
    } catch { toast.error("出了点问题"); }
  };

  const handleAddDomain = () => {
    if (!newDomain) return;
    setDomains((prev) => [...prev, { id: "d" + Date.now(), domain: newDomain, verified: false, createdAt: new Date().toISOString().split("T")[0] }]);
    setNewDomain(""); toast.success("域名已添加，请完成验证");
  };
  const handleVerifyDomain = (domainId: string) => {
    setDomains((prev) => prev.map((d) => (d.id === domainId ? { ...d, verified: true } : d)));
    toast.success("域名验证成功");
  };
  const handleRemoveDomain = (domainId: string) => {
    setDomains((prev) => prev.filter((d) => d.id !== domainId));
    toast.success("域名已移除");
  };
  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    toast.success("会话已撤销");
  };
  const handleAddIp = () => {
    if (!ipWhitelist.trim()) return;
    setIpList((prev) => [...prev, ipWhitelist.trim()]);
    setIpWhitelist(""); toast.success("IP 已添加到白名单");
  };
  const handleRemoveIp = (ip: string) => {
    setIpList((prev) => prev.filter((i) => i !== ip));
    toast.success("IP 已从白名单移除");
  };

  const handleDeleteOrg = async () => {
    if (deleteConfirm !== orgData?.name) { toast.error("组织名称不匹配"); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/orgs/${org}`, { method: "DELETE" });
      if (!res.ok) { toast.error("删除组织失败"); return; }
      toast.success("组织已删除"); window.location.href = "/";
    } catch { toast.error("出了点问题"); } finally { setDeleting(false); }
  };

  const handleTransferOwnership = async () => {
    if (!transferEmail) { toast.error("请输入新所有者邮箱"); return; }
    setTransferring(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("所有权转移请求已发送至 " + transferEmail);
      setTransferDialogOpen(false); setTransferEmail("");
    } catch { toast.error("出了点问题"); } finally { setTransferring(false); }
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
        <h1 className="text-2xl font-semibold">设置</h1>
        <p className="text-muted-foreground text-sm mt-1">管理组织设置</p>
      </div>
      <div className="flex gap-6">
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
        <div className="flex-1 max-w-2xl">
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle>常规</CardTitle>
                <CardDescription>更新组织详情</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-6">
                  <div
                    className={`relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                      isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleLogoDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <Avatar className="h-20 w-20 rounded-lg">
                        <AvatarFallback className="rounded-lg text-2xl">{orgData.name?.charAt(0)?.toUpperCase() || "O"}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-xs">上传 Logo</span>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoDrop} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">组织 Logo</p>
                    <p className="text-xs text-muted-foreground">拖拽或点击上传，支持 PNG/JPG/SVG</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="orgName">组织名称</Label>
                  <Input id="orgName" value={orgData?.name || ""}                     onChange={(e) => setOrgData((prev) => prev ? { ...prev, name: e.target.value } : prev)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={orgData?.slug || ""} disabled className="font-mono" />
                  <p className="text-xs text-muted-foreground">Slug 不可更改</p>
                </div>
                <div className="space-y-2">
                  <Label>默认部署区域</Label>
                  <Select value={orgData.defaultRegion} onValueChange={(v) => setOrgData((prev) => prev ? { ...prev, defaultRegion: v } : prev)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">自动</SelectItem>
                      <SelectItem value="cn-east">华东</SelectItem>
                      <SelectItem value="cn-north">华北</SelectItem>
                      <SelectItem value="cn-south">华南</SelectItem>
                      <SelectItem value="us-west">美西</SelectItem>
                      <SelectItem value="us-east">美东</SelectItem>
                      <SelectItem value="eu-west">欧洲西部</SelectItem>
                      <SelectItem value="ap-southeast">东南亚</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  保存更改
                </Button>
              </CardContent>
            </Card>
          )}
          {activeTab === "tokens" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>创建 API 令牌</CardTitle>
                  <CardDescription>生成令牌以验证 API 请求</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenName">令牌名称</Label>
                    <Input id="tokenName" placeholder="例如：CI/CD Pipeline" value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenScopes">权限范围</Label>
                    <Select value={newTokenScopes} onValueChange={setNewTokenScopes}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">只读</SelectItem>
                        <SelectItem value="read:write">读写</SelectItem>
                        <SelectItem value="read:write:delete">完全访问</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>过期时间</Label>
                    <Select value={newTokenExpiration} onValueChange={setNewTokenExpiration}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">永不过期</SelectItem>
                        <SelectItem value="30d">30 天</SelectItem>
                        <SelectItem value="90d">90 天</SelectItem>
                        <SelectItem value="1y">1 年</SelectItem>
                        <SelectItem value="custom">自定义</SelectItem>
                      </SelectContent>
                    </Select>
                    {newTokenExpiration === "custom" && (
                      <Input type="date" value={customExpiryDate} onChange={(e) => setCustomExpiryDate(e.target.value)} className="mt-2" />
                    )}
                  </div>
                  <Button onClick={handleCreateToken} disabled={!newTokenName}>
                    <Plus className="mr-2 h-4 w-4" />
                    创建令牌
                  </Button>
                </CardContent>
              </Card>

              {createdToken && (
                <Card className="border-yellow-500/50">
                  <CardHeader>
                    <CardTitle className="text-yellow-600">复制您的令牌</CardTitle>
                    <CardDescription>此令牌仅会显示一次，请立即复制。</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 rounded-md bg-muted p-3 font-mono text-sm">
                      <code className="flex-1 truncate">{showToken ? createdToken : "••••••••••••••••••••••••"}</code>
                      <Button variant="ghost" size="sm" onClick={() => setShowToken(!showToken)}>
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(createdToken); toast.success("已复制到剪贴板"); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>我的令牌</CardTitle>
                </CardHeader>
                <CardContent>
                  {tokens.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂未创建令牌</p>
                  ) : (
                    <div className="space-y-3">
                      {tokens.map((token) => (
                        <div key={token.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{token.name}</p>
                            <p className="text-xs text-muted-foreground">
                              权限: {token.scopes}
                              {token.expiresAt ? ` · 过期: ${new Date(token.expiresAt).toLocaleDateString()}` : " · 永不过期"}
                              {token.lastUsedAt ? ` · 最后使用: ${new Date(token.lastUsedAt).toLocaleDateString()}` : " · 从未使用"}
                            </p>
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => handleRevokeToken(token.id)}>撤销</Button>
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
                  <CardTitle>添加 Webhook</CardTitle>
                  <CardDescription>接收事件的 HTTP 通知</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">URL</Label>
                    <Input id="webhookUrl" placeholder="https://example.com/webhook" value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>事件</Label>
                    <div className="flex flex-wrap gap-2">
                      {["deployment.created", "deployment.completed", "deployment.failed", "domain.verified"].map((event) => (
                        <Badge
                          key={event}
                          variant={newWebhookEvents.includes(event) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            setNewWebhookEvents((prev) =>
                              prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
                            );
                          }}
                        >
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secret</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newWebhookSecret}
                        onChange={(e) => setNewWebhookSecret(e.target.value)}
                        type={showWebhookSecret ? "text" : "password"}
                        className="font-mono text-sm"
                      />
                      <Button variant="ghost" size="sm" onClick={() => setShowWebhookSecret(!showWebhookSecret)}>
                        {showWebhookSecret ?<EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setNewWebhookSecret(generateSecret())}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">用于验证 Webhook 请求的签名</p>
                  </div>
                  <Button onClick={handleCreateWebhook} disabled={!newWebhookUrl}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加 Webhook
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Webhooks</CardTitle>
                </CardHeader>
                <CardContent>
                  {webhooks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">未配置 Webhook</p>
                  ) : (
                    <div className="space-y-3">
                      {webhooks.map((webhook) => (
                        <div key={webhook.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex-1">
                            <p className="font-medium truncate">{webhook.url}</p>
                            <p className="text-xs text-muted-foreground">{webhook.events.join(", ")}</p>
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

          {activeTab === "domains" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>添加域名</CardTitle>
                  <CardDescription>为组织添加自定义域名</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="example.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
                    <Button onClick={handleAddDomain} disabled={!newDomain}>
                      <Plus className="mr-2 h-4 w-4" />
                      添加
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>域名列表</CardTitle>
                </CardHeader>
                <CardContent>
                  {domains.length === 0 ? (
                    <p className="text-sm text-muted-foreground">未添加域名</p>
                  ) : (
                    <div className="space-y-3">
                      {domains.map((d) => (
                        <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{d.domain}</p>
                            <p className="text-xs text-muted-foreground">添加于 {d.createdAt}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {d.verified ? (
                              <Badge variant="default">已验证</Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">未验证</Badge>
                                <Button variant="outline" size="sm" onClick={() => handleVerifyDomain(d.id)}>验证</Button>
                              </div>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveDomain(d.id)}>
                              <X className="h-4 w-4" />
                            </Button>
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
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>安全</CardTitle>
                  <CardDescription>管理组织安全设置</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">双因素认证</p>
                      <p className="text-sm text-muted-foreground">要求所有组织成员启用 2FA</p>
                    </div>
                    <Switch checked={require2FA} onCheckedChange={setRequire2FA} />
                  </div>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">会话管理</p>
                        <p className="text-sm text-muted-foreground">查看和撤销活跃会话</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {sessions.map((s) => {
                        const SIcon = s.icon;
                        return (
                          <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                              <SIcon className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{s.device}{s.current ? " (当前)" : ""}</p>
                                <p className="text-xs text-muted-foreground">{s.ip} · {s.lastActivity}</p>
                              </div>
                            </div>
                            {!s.current && (
                              <Button variant="outline" size="sm" onClick={() => handleRevokeSession(s.id)}>撤销</Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>IP 白名单</CardTitle>
                  <CardDescription>限制组织访问的 IP 地址</CardDescription>
                </CardHeader>
                <CardContent>
                  {orgData.plan === "hobby" ? (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Pro+ 功能</p>
                          <p className="text-sm text-muted-foreground">升级到 Pro 计划以启用 IP 白名单</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">升级</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input placeholder="例如：192.168.1.0/24" value={ipWhitelist} onChange={(e) => setIpWhitelist(e.target.value)} />
                        <Button onClick={handleAddIp} disabled={!ipWhitelist.trim()}>
                          <Plus className="mr-2 h-4 w-4" />
                          添加
                        </Button>
                      </div>
                      {ipList.length > 0 && (
                        <div className="space-y-2">
                          {ipList.map((ip) => (
                            <div key={ip} className="flex items-center justify-between rounded-lg border p-2">
                              <code className="text-sm">{ip}</code>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveIp(ip)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "danger" && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">危险操作</CardTitle>
                <CardDescription>不可逆的破坏性操作</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
                  <div>
                    <p className="font-medium">删除组织</p>
                    <p className="text-sm text-muted-foreground">永久删除此组织及所有相关数据。</p>
                  </div>
                  <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>删除组织</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">转移所有权</p>
                    <p className="text-sm text-muted-foreground">将组织所有权转移给其他成员</p>
                  </div>
                  <Button variant="outline" onClick={() => setTransferDialogOpen(true)}>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    转移所有权
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除组织</DialogTitle>
            <DialogDescription>
              此操作无法撤销。请输入 <strong>{orgData?.name}</strong> 确认。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`输入 "${orgData?.name}" 确认`}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteOrg} disabled={deleteConfirm !== orgData?.name || deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              删除组织
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转移组织所有权</DialogTitle>
            <DialogDescription>
              此操作将把组织所有权转移给指定用户。转移后您将成为管理员角色。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label htmlFor="transferEmail">新所有者邮箱</Label>
            <Input
              id="transferEmail"
              type="email"
              placeholder="new-owner@example.com"
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleTransferOwnership} disabled={!transferEmail || transferring}>
              {transferring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              确认转移
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}