"use client";

import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusDot } from "@/components/custom/status-dot";
import { Avatar } from "@/components/custom/avatar";
import { EmptyState } from "@/components/custom/empty-state";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  ArrowUpDown,
  Settings,
  Trash2,
  MoreHorizontal,
  Copy,
  Globe,
  Triangle,
  Code2,
  Sparkles,
  Hexagon,
  FileCode2,
  Server,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Framework, FRAMEWORK_CONFIGS } from "@deployx/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DeployStatus = "ready" | "building" | "error" | "queued" | "canceled";

interface Project {
  id: string;
  name: string;
  slug: string;
  framework: Framework;
  gitRepo: string | null;
  gitProvider: string;
  rootDir: string;
  buildCmd: string | null;
  outputDir: string | null;
  installCmd: string | null;
  createdAt: string;
  updatedAt: string;
  deployments?: Array<{
    id: string;
    status: string;
    commitSha: string | null;
    branch: string | null;
    url: string | null;
    createdAt: string;
  }>;
  domains?: Array<{
    id: string;
    domain: string;
    verified: boolean;
  }>;
}

const FRAMEWORK_COLORS: Record<string, string> = {
  NEXTJS: "from-gray-900 to-gray-700",
  NUXT: "from-green-600 to-green-400",
  VITE: "from-purple-600 to-purple-400",
  ASTRO: "from-orange-600 to-orange-400",
  REMIX: "from-blue-600 to-blue-400",
  STATIC: "from-slate-500 to-slate-400",
  NODE: "from-emerald-700 to-emerald-500",
  OTHER: "from-zinc-500 to-zinc-400",
};

const FRAMEWORK_ICONS: Record<string, React.ElementType> = {
  NEXTJS: Triangle,
  NUXT: Hexagon,
  VITE: Sparkles,
  ASTRO: Globe,
  REMIX: Code2,
  STATIC: FileCode2,
  NODE: Server,
  OTHER: FileCode2,
};

const STATUS_MAP: Record<string, DeployStatus> = {
  QUEUED: "queued",
  BUILDING: "building",
  READY: "ready",
  FAILED: "error",
  CANCELLED: "canceled",
};

function getDomain(project: Project): string {
  if (project.domains && project.domains.length > 0) {
    const verified = project.domains.find((d) => d.verified);
    if (verified) return verified.domain;
    return project.domains[0].domain;
  }
  const defaultDomain = import.meta.env.VITE_DEFAULT_DOMAIN || "deployx.app";
  return `${project.slug}.${defaultDomain}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectsPage() {
  const { org = '' } = useParams<{ org: string }>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFramework, setFilterFramework] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<string>("name");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`/api/orgs/${org}/projects`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [org]);

  const filtered = useMemo(() => {
    let list = [...projects];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          getDomain(p).toLowerCase().includes(q) ||
          (p.gitRepo && p.gitRepo.toLowerCase().includes(q))
      );
    }

    if (filterFramework !== "all") {
      list = list.filter((p) => p.framework === filterFramework);
    }

    if (filterStatus !== "all") {
      list = list.filter((p) => {
        const lastDeploy = p.deployments?.[0];
        if (!lastDeploy) return filterStatus === "none";
        const mappedStatus = STATUS_MAP[lastDeploy.status] || lastDeploy.status.toLowerCase();
        return mappedStatus === filterStatus;
      });
    }

    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0;
    });

    return list;
  }, [projects, search, filterFramework, filterStatus, sort]);

  const copyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">项目</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理您的部署和项目
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索项目..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘F
          </kbd>
        </div>

        {/* Filter: Framework */}
        <Select value={filterFramework} onValueChange={setFilterFramework}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="框架" />
          </SelectTrigger>
          <SelectContent>
                <SelectItem value="all">全部框架</SelectItem>
            {Object.values(Framework).map((fw) => (
              <SelectItem key={fw} value={fw}>
                {FRAMEWORK_CONFIGS[fw]?.name || fw}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter: Status */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="ready">就绪</SelectItem>
            <SelectItem value="building">构建中</SelectItem>
            <SelectItem value="error">错误</SelectItem>
            <SelectItem value="queued">排队中</SelectItem>
            <SelectItem value="none">未部署</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex rounded-md border">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-r-none px-2.5"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-l-none px-2.5"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[140px] h-9">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">名称</SelectItem>
            <SelectItem value="created">最新创建</SelectItem>
            <SelectItem value="updated">最近更新</SelectItem>
          </SelectContent>
        </Select>

        {/* Add New */}
        <Button size="sm" asChild>
          <Link to={`/${org}/projects/new`}>
            <Plus className="h-4 w-4 mr-1" />
            添加项目
          </Link>
        </Button>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        projects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="暂无项目"
            description="导入您的第一个项目，开始使用 DeployX"
            action={{
              label: "导入项目",
              href: `/${org}/projects/new`,
            }}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="未找到项目"
            description="请尝试调整搜索或筛选条件"
          />
        )
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const FwIcon = FRAMEWORK_ICONS[project.framework] || FRAMEWORK_ICONS.OTHER;
            const lastDeploy = project.deployments?.[0];
            const deployStatus = lastDeploy ? (STATUS_MAP[lastDeploy.status] || "queued") : null;
            const domain = getDomain(project);

            return (
              <Card
                key={project.id}
                className="group relative overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Gradient top bar */}
                <div
                  className={cn(
                    "h-1 bg-gradient-to-r",
                    FRAMEWORK_COLORS[project.framework] || FRAMEWORK_COLORS.OTHER
                  )}
                />

                <CardContent className="p-4 space-y-3">
                  {/* Name + badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        to={`/${org}/projects/${project.id}`}
                        className="font-semibold truncate hover:underline"
                      >
                        {project.name}
                      </Link>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {project.gitProvider}
                      </Badge>
                    </div>

                    {/* Hover menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/${org}/projects/${project.id}/settings`}>
                            <Settings className="h-4 w-4 mr-2" />
                            设置
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Domain */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-muted-foreground truncate">
                      {domain}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => copyDomain(domain)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Framework */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FwIcon className="h-3.5 w-3.5" />
                    {FRAMEWORK_CONFIGS[project.framework]?.name || project.framework}
                  </div>

                  {/* Last deployment */}
                  {lastDeploy ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <StatusDot status={deployStatus || "queued"} />
                      <span className="font-mono">{lastDeploy.commitSha?.slice(0, 7) || "—"}</span>
                      <span className="truncate">{new Date(lastDeploy.createdAt).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">暂无部署</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ---- List view ---- */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>框架</TableHead>
                <TableHead>域名</TableHead>
                <TableHead>最近部署</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((project) => {
                const FwIcon = FRAMEWORK_ICONS[project.framework] || FRAMEWORK_ICONS.OTHER;
                const lastDeploy = project.deployments?.[0];
                const deployStatus = lastDeploy ? (STATUS_MAP[lastDeploy.status] || "queued") : null;
                const domain = getDomain(project);

                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        to={`/${org}/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <FwIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {FRAMEWORK_CONFIGS[project.framework]?.name || project.framework}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{domain}</span>
                    </TableCell>
                    <TableCell>
                      {lastDeploy ? (
                        <span className="text-xs text-muted-foreground">
                          {lastDeploy.commitSha?.slice(0, 7)} &middot; {new Date(lastDeploy.createdAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {deployStatus ? (
                        <StatusDot status={deployStatus} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
