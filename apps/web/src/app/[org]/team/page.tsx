"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar } from "@/components/custom/avatar";
import { Can } from "@/components/custom/can";
import {
  Users,
  UserPlus,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  CreditCard,
  Eye,
  Send,
  X,
  FileText,
  Clock,
  Lock,
  LockOpen,
  RefreshCw,
  Trash2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const ROLES = ["OWNER", "ADMIN", "DEVELOPER", "VIEWER", "BILLING_MANAGER"] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "所有者",
  ADMIN: "管理员",
  DEVELOPER: "开发者",
  VIEWER: "查看者",
  BILLING_MANAGER: "账单管理员",
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: "拥有组织的完全控制权，包括删除组织",
  ADMIN: "可以管理项目、部署、团队和大部分设置",
  DEVELOPER: "可以创建和部署项目，管理环境变量",
  VIEWER: "只能查看项目和部署信息，无法修改",
  BILLING_MANAGER: "管理组织的账单和付款信息",
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  OWNER: [
    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "project:deploy",
    "project:transfer",
    "deployment:create",
    "deployment:read",
    "deployment:cancel",
    "deployment:rollback",
    "deployment:promote",
    "domain:create",
    "domain:read",
    "domain:update",
    "domain:delete",
    "env:read",
    "env:write",
    "env:delete",
    "billing:view",
    "billing:manage",
    "billing:invoices",
    "org:read",
    "org:update",
    "org:delete",
    "team:invite",
    "team:remove",
    "team:update_role",
    "team:list",
    "log:read",
    "log:export",
    "settings:read",
    "settings:update",
    "token:create",
    "token:read",
    "token:revoke",
    "webhook:create",
    "webhook:read",
    "webhook:update",
    "webhook:delete",
  ],
  ADMIN: [
    "project:create",
    "project:read",
    "project:update",
    "project:delete",
    "project:deploy",
    "deployment:create",
    "deployment:read",
    "deployment:cancel",
    "deployment:rollback",
    "deployment:promote",
    "domain:create",
    "domain:read",
    "domain:update",
    "domain:delete",
    "env:read",
    "env:write",
    "env:delete",
    "billing:view",
    "billing:manage",
    "billing:invoices",
    "org:read",
    "org:update",
    "team:invite",
    "team:remove",
    "team:update_role",
    "team:list",
    "log:read",
    "log:export",
    "settings:read",
    "settings:update",
    "token:*",
    "webhook:*",
  ],
  DEVELOPER: [
    "project:read",
    "project:create",
    "project:update",
    "project:deploy",
    "deployment:read",
    "deployment:create",
    "deployment:cancel",
    "domain:read",
    "env:read",
    "env:write",
    "org:read",
    "team:list",
    "log:read",
    "settings:read",
    "token:create",
    "token:read",
    "webhook:read",
  ],
  VIEWER: [
    "project:read",
    "deployment:read",
    "domain:read",
    "org:read",
    "team:list",
    "log:read",
    "settings:read",
    "webhook:read",
  ],
  BILLING_MANAGER: [
    "billing:view",
    "billing:manage",
    "billing:invoices",
    "org:read",
    "team:list",
    "settings:read",
  ],
};

const PERMISSION_LABELS: Record<string, string> = {
  "project:create": "创建项目",
  "project:read": "查看项目",
  "project:update": "更新项目",
  "project:delete": "删除项目",
  "project:deploy": "部署项目",
  "project:transfer": "转让项目",
  "deployment:create": "创建部署",
  "deployment:read": "查看部署",
  "deployment:cancel": "取消部署",
  "deployment:rollback": "回滚部署",
  "deployment:promote": "提升部署",
  "domain:create": "创建域名",
  "domain:read": "查看域名",
  "domain:update": "更新域名",
  "domain:delete": "删除域名",
  "env:read": "查看环境变量",
  "env:write": "写入环境变量",
  "env:delete": "删除环境变量",
  "billing:view": "查看账单",
  "billing:manage": "管理账单",
  "billing:invoices": "查看发票",
  "org:read": "查看组织",
  "org:update": "更新组织",
  "org:delete": "删除组织",
  "team:invite": "邀请成员",
  "team:remove": "移除成员",
  "team:update_role": "更新角色",
  "team:list": "查看成员列表",
  "log:read": "查看日志",
  "log:export": "导出日志",
  "settings:read": "查看设置",
  "settings:update": "更新设置",
  "token:create": "创建令牌",
  "token:read": "查看令牌",
  "token:revoke": "撤销令牌",
  "webhook:create": "创建 Webhook",
  "webhook:read": "查看 Webhook",
  "webhook:update": "更新 Webhook",
  "webhook:delete": "删除 Webhook",
};

const PERMISSION_GROUPS = [
  { label: "项目", prefix: "project:" },
  { label: "部署", prefix: "deployment:" },
  { label: "域名", prefix: "domain:" },
  { label: "环境变量", prefix: "env:" },
  { label: "账单", prefix: "billing:" },
  { label: "组织", prefix: "org:" },
  { label: "团队", prefix: "team:" },
  { label: "日志", prefix: "log:" },
  { label: "设置", prefix: "settings:" },
  { label: "令牌", prefix: "token:" },
  { label: "Webhook", prefix: "webhook:" },
];

const ROLE_ICONS: Record<Role, React.ElementType> = {
  OWNER: ShieldAlert,
  ADMIN: ShieldCheck,
  DEVELOPER: Shield,
  VIEWER: Eye,
  BILLING_MANAGER: CreditCard,
};

const ROLE_COLORS: Record<Role, string> = {
  OWNER: "text-red-500",
  ADMIN: "text-orange-500",
  DEVELOPER: "text-blue-500",
  VIEWER: "text-muted-foreground",
  BILLING_MANAGER: "text-green-500",
};

interface Member {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string;
  role: string;
  createdAt: string;
  twoFactorEnabled: boolean;
  lastActiveAt: string | null;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  invitedAt: string;
  invitedBy: string;
}

const MOCK_PENDING_INVITATIONS: PendingInvitation[] = [
  { id: "inv-1", email: "alice@example.com", role: "DEVELOPER", invitedAt: "2026-05-20T10:00:00Z", invitedBy: "owner@deployx.io" },
  { id: "inv-2", email: "bob@example.com", role: "VIEWER", invitedAt: "2026-05-22T14:30:00Z", invitedBy: "owner@deployx.io" },
  { id: "inv-3", email: "carol@example.com", role: "ADMIN", invitedAt: "2026-05-23T09:15:00Z", invitedBy: "owner@deployx.io" },
];

const MOCK_MEMBERS: Member[] = [
  { id: "m-1", name: "张伟", email: "zhangwei@deployx.io", avatarUrl: "", role: "OWNER", createdAt: "2025-12-01T08:00:00Z", twoFactorEnabled: true, lastActiveAt: "2026-05-24T09:30:00Z" },
  { id: "m-2", name: "李娜", email: "lina@deployx.io", avatarUrl: "", role: "ADMIN", createdAt: "2026-01-15T10:00:00Z", twoFactorEnabled: true, lastActiveAt: "2026-05-24T08:15:00Z" },
  { id: "m-3", name: "王强", email: "wangqiang@deployx.io", avatarUrl: "", role: "DEVELOPER", createdAt: "2026-02-20T12:00:00Z", twoFactorEnabled: false, lastActiveAt: "2026-05-23T17:00:00Z" },
  { id: "m-4", name: null, email: "viewer@deployx.io", avatarUrl: "", role: "VIEWER", createdAt: "2026-03-10T09:00:00Z", twoFactorEnabled: false, lastActiveAt: "2026-05-20T11:45:00Z" },
  { id: "m-5", name: "赵敏", email: "zhaomin@deployx.io", avatarUrl: "", role: "BILLING_MANAGER", createdAt: "2026-04-05T14:00:00Z", twoFactorEnabled: true, lastActiveAt: "2026-05-22T16:30:00Z" },
];

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 30) return `${diffDays} 天前`;
  return date.toLocaleDateString("zh-CN");
}

export default function TeamPage() {
  const params = useParams();
  const org = params.org as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("DEVELOPER");
  const [inviting, setInviting] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [resending, setResending] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/orgs/${org}/members`);
        if (res.ok) {
          const data = await res.json();
          const enriched = data.map((m: Member) => ({
            ...m,
            twoFactorEnabled: m.twoFactorEnabled ?? false,
            lastActiveAt: m.lastActiveAt ?? null,
          }));
          setMembers(enriched.length > 0 ? enriched : MOCK_MEMBERS);
        } else {
          setMembers(MOCK_MEMBERS);
        }
      } catch {
        setMembers(MOCK_MEMBERS);
      } finally {
        setLoading(false);
      }
    };

    const fetchInvitations = async () => {
      try {
        const res = await fetch(`/api/orgs/${org}/invitations`);
        if (res.ok) {
          const data = await res.json();
          setPendingInvitations(data);
        } else {
          setPendingInvitations(MOCK_PENDING_INVITATIONS);
        }
      } catch {
        setPendingInvitations(MOCK_PENDING_INVITATIONS);
      }
    };

    fetchMembers();
    fetchInvitations();
  }, [org]);

  const addEmailTag = useCallback(
    (email: string) => {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        toast.error(`无效的邮箱地址: ${trimmed}`);
        return;
      }
      if (emailTags.includes(trimmed)) {
        toast.error(`邮箱已添加: ${trimmed}`);
        return;
      }
      setEmailTags((prev) => [...prev, trimmed]);
      setEmailInput("");
    },
    [emailTags]
  );

  const removeEmailTag = useCallback((email: string) => {
    setEmailTags((prev) => prev.filter((e) => e !== email));
  }, []);

  const handleEmailKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
        e.preventDefault();
        addEmailTag(emailInput);
      }
      if (e.key === "Backspace" && !emailInput && emailTags.length > 0) {
        setEmailTags((prev) => prev.slice(0, -1));
      }
    },
    [emailInput, emailTags, addEmailTag]
  );

  const handleEmailPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text");
      const emails = pasted.split(/[,;\n\r]+/).filter(Boolean);
      emails.forEach((em) => addEmailTag(em));
    },
    [addEmailTag]
  );

  const handleInvite = async () => {
    if (emailTags.length === 0) return;
    setInviting(true);

    try {
      const results = await Promise.allSettled(
        emailTags.map((email) =>
          fetch(`/api/orgs/${org}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role: inviteRole }),
          }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "邀请成员失败");
            return data;
          })
        )
      );

      let successCount = 0;
      let failCount = 0;

      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          successCount++;
          setMembers((prev) => [...prev, result.value]);
        } else {
          failCount++;
        }
      });

      if (successCount > 0) {
        toast.success(`已发送 ${successCount} 封邀请`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} 封邀请发送失败`);
      }

      if (successCount > 0) {
        setInviteOpen(false);
        setEmailTags([]);
        setEmailInput("");
      }
    } catch {
      toast.error("出了点问题");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/orgs/${org}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        toast.error("更新角色失败");
        return;
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      toast.success("角色已更新");
    } catch {
      toast.error("出了点问题");
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      const res = await fetch(`/api/orgs/${org}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("移除成员失败");
        return;
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("成员已移除");
    } catch {
      toast.error("出了点问题");
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setResending(invitationId);
    try {
      const res = await fetch(`/api/orgs/${org}/invitations/${invitationId}/resend`, {
        method: "POST",
      });

      if (!res.ok) {
        toast.error("重发邀请失败");
        return;
      }

      toast.success("邀请已重发");
    } catch {
      toast.error("出了点问题");
    } finally {
      setResending(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/orgs/${org}/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("取消邀请失败");
        return;
      }

      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      toast.success("邀请已取消");
    } catch {
      toast.error("出了点问题");
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
    <TooltipProvider>
      <div className="space-y-6">
        <motion.div {...fadeIn} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">团队</h1>
            <p className="text-muted-foreground text-sm mt-1">
              管理团队成员及其角色
            </p>
          </div>
          <Can permission="team:invite">
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              邀请成员
            </Button>
          </Can>
        </motion.div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members">成员</TabsTrigger>
            <TabsTrigger value="roles">角色</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {pendingInvitations.length > 0 && (
              <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
                <Accordion type="single" collapsible defaultValue="pending-invitations">
                  <AccordionItem value="pending-invitations" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">待接受邀请</span>
                        <Badge variant="secondary">{pendingInvitations.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {pendingInvitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar fallback={invitation.email} size="sm" />
                              <div>
                                <p className="text-sm font-medium">{invitation.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  邀请为 {ROLE_LABELS[invitation.role as Role] || invitation.role} · {formatRelativeTime(invitation.invitedAt)} · 由 {invitation.invitedBy} 邀请
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResendInvitation(invitation.id)}
                                    disabled={resending === invitation.id}
                                  >
                                    {resending === invitation.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>重发邀请</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelInvitation(invitation.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>取消邀请</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
            )}

            <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="p-0">
                  {members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">暂无团队成员</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        邀请团队成员协作您的项目
                      </p>
                      <Can permission="team:invite">
                        <Button className="mt-4" onClick={() => setInviteOpen(true)}>
                          <UserPlus className="h-4 w-4 mr-1" />
                          邀请成员
                        </Button>
                      </Can>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>成员</TableHead>
                          <TableHead>角色</TableHead>
                          <TableHead>2FA</TableHead>
                          <TableHead>最后活跃</TableHead>
                          <TableHead>加入时间</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar
                                  src={member.avatarUrl}
                                  fallback={member.name || member.email}
                                  size="sm"
                                />
                                <div>
                                  <p className="font-medium text-sm">
                                    {member.name || member.email.split("@")[0]}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                defaultValue={member.role}
                                onValueChange={(value) => handleRoleChange(member.id, value)}
                                disabled={member.role === "OWNER"}
                              >
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {ROLE_LABELS[role]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    {member.twoFactorEnabled ? (
                                      <Lock className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <LockOpen className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {member.twoFactorEnabled ? "双因素认证已启用" : "双因素认证未启用"}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {member.lastActiveAt
                                  ? formatRelativeTime(member.lastActiveAt)
                                  : "从未活跃"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {new Date(member.createdAt).toLocaleDateString("zh-CN")}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Can permission="team:remove" fallback={<span className="text-xs text-muted-foreground">-</span>}>
                                {member.role !== "OWNER" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemove(member.id)}
                                  >
                                    移除
                                  </Button>
                                )}
                              </Can>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            {ROLES.filter((r) => r !== "OWNER").map((role, index) => {
              const RoleIcon = ROLE_ICONS[role];
              const permissions = ROLE_PERMISSIONS[role];
              const colorClass = ROLE_COLORS[role];

              return (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <RoleIcon className={`h-5 w-5 ${colorClass}`} />
                        <div>
                          <CardTitle className="text-base">{ROLE_LABELS[role]}</CardTitle>
                          <CardDescription className="text-xs">
                            {ROLE_DESCRIPTIONS[role]}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {PERMISSION_GROUPS.map((group) => {
                          const groupPermissions = permissions.filter((p) =>
                            p.startsWith(group.prefix)
                          );
                          if (groupPermissions.length === 0) return null;

                          return (
                            <div key={group.prefix}>
                              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                                {group.label}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {groupPermissions.map((perm) => (
                                  <div
                                    key={perm}
                                    className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1"
                                  >
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span className="text-xs">
                                      {PERMISSION_LABELS[perm] || perm}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ROLES.length * 0.05 }}
            >
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <ShieldQuestion className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">自定义角色</CardTitle>
                      <CardDescription className="text-xs">
                        创建自定义角色，精确控制权限
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Pro</Badge>
                      <span className="text-sm text-muted-foreground">
                        升级到 Pro 套餐以解锁自定义角色
                      </span>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      创建自定义角色
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-center pt-4">
            <Link
              to={`/${org}/audit-log`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="h-4 w-4" />
              查看审计日志
            </Link>
          </div>
        </motion.div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>邀请成员</DialogTitle>
              <DialogDescription>
                发送邀请加入您的组织。可输入多个邮箱，以逗号或回车分隔。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="emails">邮箱</Label>
                <div
                  className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-[40px]"
                  onClick={() => emailInputRef.current?.focus()}
                >
                  {emailTags.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1 pr-1">
                      {email}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEmailTag(email);
                        }}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    ref={emailInputRef}
                    type="email"
                    className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
                    placeholder={emailTags.length === 0 ? "输入邮箱，按 Enter 或逗号添加" : "继续添加..."}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleEmailKeyDown}
                    onPaste={handleEmailPaste}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">角色</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.filter((r) => r !== "OWNER").map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <span>{ROLE_LABELS[role]}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Shield className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="font-medium">{ROLE_LABELS[role]}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {ROLE_DESCRIPTIONS[role]}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                取消
              </Button>
              <Button onClick={handleInvite} disabled={inviting || emailTags.length === 0}>
                {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                发送邀请 ({emailTags.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
