"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Copy, ExternalLink, RotateCcw, ArrowLeftRight, XCircle,
  GitBranch, User, Clock, Server, Globe, Search,
  Eye, Wrench, Terminal, Folder, File, FileCode,
  ChevronRight, ChevronDown, CheckCircle2, Circle, Loader2,
  Wifi, WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/custom/avatar";
import { TerminalLogs } from "@/components/custom/terminal-logs";
import { getDeployment, getDeploymentLogs } from "@/lib/api";
import { DeploymentStatus, DeploymentType, BuildStage, BUILD_STAGE_ORDER, BUILD_STAGES } from "@deployx/shared";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const statusIconMap: Record<string, { icon: typeof CheckCircleIcon; color: string }> = {
  [DeploymentStatus.READY]: { icon: CheckCircleIcon, color: "text-green-500" },
  [DeploymentStatus.ERROR]: { icon: XCircleIcon, color: "text-red-500" },
  [DeploymentStatus.BUILDING]: { icon: BuildingIcon, color: "text-yellow-500" },
  [DeploymentStatus.QUEUED]: { icon: ClockIcon, color: "text-blue-500" },
  [DeploymentStatus.CANCELLED]: { icon: XCircleIcon, color: "text-zinc-500" },
  [DeploymentStatus.PENDING]: { icon: ClockIcon, color: "text-blue-400" },
};

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
function BuildingIcon({ className }: { className?: string }) {
  return <Clock className={className} />;
}
function ClockIcon({ className }: { className?: string }) {
  return <Clock className={className} />;
}

interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  content?: string;
  language?: string;
}

const MOCK_FILE_TREE: FileTreeNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "app",
        type: "folder",
        children: [
          { name: "layout.tsx", type: "file", language: "typescript", content: 'export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}' },
          { name: "page.tsx", type: "file", language: "typescript", content: 'import { Hero } from "@/components/hero";\n\nexport default function Home() {\n  return (\n    <main>\n      <Hero />\n    </main>\n  );\n}' },
        ],
      },
      {
        name: "components",
        type: "folder",
        children: [
          { name: "hero.tsx", type: "file", language: "typescript", content: 'export function Hero() {\n  return (\n    <section className="flex flex-col items-center justify-center py-20">\n      <h1 className="text-4xl font-bold">DeployX</h1>\n      <p className="mt-4 text-lg text-muted-foreground">\n        Ship faster. Deploy smarter.\n      </p>\n    </section>\n  );\n}' },
          { name: "footer.tsx", type: "file", language: "typescript", content: 'export function Footer() {\n  return (\n    <footer className="border-t py-6 text-center text-sm text-muted-foreground">\n      &copy; 2024 DeployX\n    </footer>\n  );\n}' },
        ],
      },
      {
        name: "lib",
        type: "folder",
        children: [
          { name: "api.ts", type: "file", language: "typescript", content: 'const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";\n\nexport async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {\n  const res = await fetch(`${API_BASE}${path}`, {\n    ...init,\n    headers: {\n      "Content-Type": "application/json",\n      ...init?.headers,\n    },\n  });\n  if (!res.ok) throw new Error(`API error: ${res.status}`);\n  return res.json();\n}' },
        ],
      },
    ],
  },
  {
    name: "public",
    type: "folder",
    children: [
      { name: "favicon.ico", type: "file", language: "binary" },
    ],
  },
  { name: "package.json", type: "file", language: "json", content: '{\n  "name": "deployx-web",\n  "version": "1.0.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start"\n  },\n  "dependencies": {\n    "next": "14.1.0",\n    "react": "18.2.0",\n    "react-dom": "18.2.0"\n  }\n}' },
  { name: "tsconfig.json", type: "file", language: "json", content: '{\n  "compilerOptions": {\n    "target": "es5",\n    "lib": ["dom", "dom.iterable", "esnext"],\n    "allowJs": true,\n    "skipLibCheck": true,\n    "strict": true,\n    "noEmit": true,\n    "esModuleInterop": true,\n    "module": "esnext",\n    "moduleResolution": "bundler",\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "jsx": "preserve",\n    "incremental": true,\n    "paths": {\n      "@/*": ["./src/*"]\n    }\n  },\n  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],\n  "exclude": ["node_modules"]\n}' },
  { name: "next.config.js", type: "file", language: "javascript", content: '/** @type {import("next").NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n};\n\nmodule.exports = nextConfig;' },
  { name: ".gitignore", type: "file", content: 'node_modules/\n.next/\nout/\n.env*.local' },
];

interface ServerlessFunction {
  path: string;
  region: string;
  invocations: number;
  avgDuration: string;
  lastInvoked: string;
}

const MOCK_FUNCTIONS: ServerlessFunction[] = [
  { path: "/api/auth/callback", region: "iad1", invocations: 12843, avgDuration: "23ms", lastInvoked: "2 分钟前" },
  { path: "/api/graphql", region: "iad1", invocations: 9821, avgDuration: "45ms", lastInvoked: "5 秒前" },
  { path: "/api/webhooks/stripe", region: "sfo1", invocations: 342, avgDuration: "112ms", lastInvoked: "1 小时前" },
  { path: "/api/og", region: "iad1", invocations: 5890, avgDuration: "189ms", lastInvoked: "30 秒前" },
  { path: "/api/revalidate", region: "sfo1", invocations: 67, avgDuration: "34ms", lastInvoked: "3 天前" },
];

function getStageStatus(currentStage: BuildStage, targetStage: BuildStage, deployStatus: DeploymentStatus): "completed" | "active" | "pending" {
  const currentIdx = BUILD_STAGE_ORDER.indexOf(currentStage);
  const targetIdx = BUILD_STAGE_ORDER.indexOf(targetStage);
  if (deployStatus === DeploymentStatus.ERROR) {
    if (targetIdx < currentIdx) return "completed";
    if (targetIdx === currentIdx) return "active";
    return "pending";
  }
  if (deployStatus === DeploymentStatus.CANCELLED) {
    if (targetIdx < currentIdx) return "completed";
    if (targetIdx === currentIdx) return "active";
    return "pending";
  }
  if (targetIdx < currentIdx) return "completed";
  if (targetIdx === currentIdx) return "active";
  return "pending";
}

function FileTree({
  nodes,
  selectedFile,
  onSelect,
  depth = 0,
}: {
  nodes: FileTreeNode[];
  selectedFile: string | null;
  onSelect: (path: string, node: FileTreeNode) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div>
      {nodes.map((node) => {
        const path = depth === 0 ? node.name : ""; // simplified
        const fullPath = buildPath(nodes, node, depth);

        if (node.type === "folder") {
          const isOpen = expanded[fullPath] ?? true;
          return (
            <div key={fullPath}>
              <button
                onClick={() => toggle(fullPath)}
                className="flex items-center gap-1.5 w-full px-2 py-1 text-sm hover:bg-muted/50 rounded-sm"
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
              >
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <Folder className="h-4 w-4 shrink-0 text-blue-400" />
                <span className="truncate">{node.name}</span>
              </button>
              {isOpen && node.children && (
                <FileTree
                  nodes={node.children}
                  selectedFile={selectedFile}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              )}
            </div>
          );
        }

        return (
          <button
            key={fullPath}
            onClick={() => onSelect(fullPath, node)}
            className={`flex items-center gap-1.5 w-full px-2 py-1 text-sm rounded-sm ${
              selectedFile === fullPath ? "bg-muted" : "hover:bg-muted/50"
            }`}
            style={{ paddingLeft: `${depth * 16 + 24}px` }}
          >
            {node.language === "typescript" || node.language === "javascript" ? (
              <FileCode className="h-4 w-4 shrink-0 text-green-400" />
            ) : (
              <File className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{node.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function buildPath(nodes: FileTreeNode[], target: FileTreeNode, depth: number): string {
  const parts: string[] = [];
  function walk(list: FileTreeNode[], prefix: string): boolean {
    for (const n of list) {
      const p = prefix ? `${prefix}/${n.name}` : n.name;
      if (n === target) {
        parts.push(p);
        return true;
      }
      if (n.type === "folder" && n.children) {
        if (walk(n.children, p)) return true;
      }
    }
    return false;
  }
  walk(nodes, "");
  return parts[0] || target.name;
}

function findNodeByPath(nodes: FileTreeNode[], path: string): FileTreeNode | null {
  const segments = path.split("/");
  function walk(list: FileTreeNode[], idx: number): FileTreeNode | null {
    if (idx >= segments.length) return null;
    const target = list.find((n) => n.name === segments[idx]);
    if (!target) return null;
    if (idx === segments.length - 1) return target;
    if (target.type === "folder" && target.children) return walk(target.children, idx + 1);
    return null;
  }
  return walk(nodes, 0);
}

export default function DeploymentDetailPage() {
  const { org: orgSlug = '', id: projectId = '', did: deploymentId = '' } = useParams<{ org: string; id: string; did: string }>();
  const [activeTab, setActiveTab] = useState("build-logs");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [runtimeLogs, setRuntimeLogs] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: deployment, isLoading } = useQuery({
    queryKey: ["deployment", orgSlug, projectId, deploymentId],
    queryFn: () => getDeployment(orgSlug, projectId, deploymentId),
  });

  const { data: logs } = useQuery({
    queryKey: ["deployment-logs", orgSlug, projectId, deploymentId],
    queryFn: () => getDeploymentLogs(orgSlug, projectId, deploymentId),
    enabled: !!deployment,
  });

  useEffect(() => {
    if (activeTab !== "runtime-logs") return;

    const mockUrl = `wss://ws.deployx.dev/v1/logs/${orgSlug}/${projectId}/${deploymentId}`;
    setWsConnected(true);

    const interval = setInterval(() => {
      setRuntimeLogs((prev) => [
        ...prev.slice(-200),
        {
          timestamp: new Date().toISOString().slice(11, 19),
          level: ["info", "info", "info", "warn", "success"][Math.floor(Math.random() * 5)] as any,
          message: [
            "GET /api/graphql 200 45ms",
            "POST /api/auth/callback 302 12ms",
            "GET /api/og 200 189ms",
            "POST /api/webhooks/stripe 200 112ms",
            "GET / 200 8ms",
            "Cache HIT for /api/graphql",
            "Edge function invoked: /api/auth/callback",
          ][Math.floor(Math.random() * 7)],
          group: "Runtime",
        },
      ]);
    }, 1500);

    return () => {
      clearInterval(interval);
      setWsConnected(false);
    };
  }, [activeTab, orgSlug, projectId, deploymentId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  const handleFileSelect = useCallback((path: string, _node: FileTreeNode) => {
    setSelectedFile(path);
  }, []);

  const selectedFileNode = useMemo(() => {
    if (!selectedFile) return null;
    return findNodeByPath(MOCK_FILE_TREE, selectedFile);
  }, [selectedFile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载部署详情...</p>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">未找到部署</p>
      </div>
    );
  }

  const StatusIcon = statusIconMap[deployment.status]?.icon || CheckCircleIcon;
  const statusColor = statusIconMap[deployment.status]?.color || "text-muted-foreground";

  const buildLogs = (logs || []).map((log: any, i: number) => ({
    id: `bl_${i}`,
    timestamp: log.timestamp || "",
    level: log.level || "info",
    message: log.message || "",
    group: log.group || "Build",
  }));

  const runtimeLogEntries = runtimeLogs.map((log, i) => ({
    id: `rl_${i}`,
    timestamp: log.timestamp,
    level: log.level,
    message: log.message,
    group: log.group,
  }));

  const currentBuildStage: BuildStage = deployment.buildStage || BuildStage.READY;

  const deployer = {
    name: deployment.deployerName || "张明",
    avatar: deployment.deployerAvatar || undefined,
  };

  const hasFunctions = deployment.type === DeploymentType.PRODUCTION || activeTab === "functions";

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      {/* Left sidebar */}
      <div className="w-80 shrink-0 border-r p-6 space-y-6 overflow-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          {/* Status icon */}
          <div className="text-center mb-6">
            <StatusIcon className={`h-16 w-16 mx-auto ${statusColor}`} />
            <Badge variant={deployment.status === DeploymentStatus.READY ? "success" : "destructive"} className="mt-3 capitalize">
              {deployment.status.toLowerCase()}
            </Badge>
          </div>

          {/* Source info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">来源</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{deployment.branch || "main"}</span>
              </div>
              {deployment.commitSha && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">{deployment.commitSha.slice(0, 7)}</span>
                  <button onClick={() => copyToClipboard(deployment.commitSha)}>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
              {deployment.commitMessage && (
                <p className="text-xs text-muted-foreground">{deployment.commitMessage}</p>
              )}
              <Separator />
              <div className="flex items-center gap-2">
                <Avatar src={deployer.avatar} fallback={deployer.name} size="sm" />
                <span className="text-sm">{deployer.name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Build info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">构建信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">开始时间</span>
                <span>{new Date(deployment.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">完成时间</span>
                <span>{deployment.status === DeploymentStatus.READY ? new Date(deployment.updatedAt).toLocaleTimeString() : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">时长</span>
                <span>{deployment.buildDuration ? `${Math.floor(deployment.buildDuration / 1000)}s` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">构建器</span>
                <span className="font-mono text-xs">DeployX v2</span>
              </div>
            </CardContent>
          </Card>

          {/* Domains */}
          {deployment.url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">域名</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm font-mono">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{deployment.url.replace("https://", "")}</span>
                  <button onClick={() => copyToClipboard(deployment.url || "")} className="shrink-0">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {deployment.url && (
              <Button variant="outline" className="w-full justify-start" onClick={() => window.open(deployment.url, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" /> 访问
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start">
              <Eye className="h-4 w-4 mr-2" /> 检查
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("正在重新部署...")}>
              <RotateCcw className="h-4 w-4 mr-2" /> 重新部署
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("正在回滚...")}>
              <ArrowLeftRight className="h-4 w-4 mr-2" /> 回滚
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              <XCircle className="h-4 w-4 mr-2" /> 取消
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Right main area */}
      <div className="flex-1 p-6 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="build-logs">
              <Terminal className="h-4 w-4 mr-2" /> 构建日志
            </TabsTrigger>
            <TabsTrigger value="runtime-logs">
              <Terminal className="h-4 w-4 mr-2" /> 运行时日志
            </TabsTrigger>
            <TabsTrigger value="source">
              <GitBranch className="h-4 w-4 mr-2" /> 来源
            </TabsTrigger>
            <TabsTrigger value="functions">
              <Wrench className="h-4 w-4 mr-2" /> 函数
            </TabsTrigger>
          </TabsList>

          <TabsContent value="build-logs" className="mt-4 space-y-4">
            {/* Deployer info */}
            <div className="flex items-center gap-3">
              <Avatar src={deployer.avatar} fallback={deployer.name} size="md" />
              <div>
                <p className="text-sm font-medium">{deployer.name}</p>
                <p className="text-xs text-muted-foreground">触发部署</p>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(deployment.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Build stage timeline */}
            <div className="flex items-center gap-0 w-full overflow-x-auto pb-2">
              {BUILD_STAGE_ORDER.map((stage, idx) => {
                const status = getStageStatus(currentBuildStage, stage, deployment.status);
                return (
                  <div key={stage} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[100px]">
                      <div className="flex items-center justify-center">
                        {status === "completed" && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-7 w-7 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </motion.div>
                        )}
                        {status === "active" && (
                          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="h-7 w-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                          </motion.div>
                        )}
                        {status === "pending" && (
                          <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <span className={`text-xs mt-1 ${status === "active" ? "text-blue-500 font-medium" : status === "completed" ? "text-green-600" : "text-muted-foreground"}`}>
                        {BUILD_STAGES[stage]?.label || stage}
                      </span>
                    </div>
                    {idx < BUILD_STAGE_ORDER.length - 1 && (
                      <div className={`h-0.5 w-8 mt-[-12px] ${
                        status === "completed" ? "bg-green-500" : "bg-muted"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            <TerminalLogs logs={buildLogs} searchable showControls autoScroll className="h-[550px]" />
          </TabsContent>

          <TabsContent value="runtime-logs" className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {wsConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-green-500 font-medium">已连接</span>
                  <span className="text-muted-foreground">wss://ws.deployx.dev/v1/logs/...</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-red-500 font-medium">已断开</span>
                </>
              )}
            </div>
            <TerminalLogs
              logs={runtimeLogEntries}
              searchable
              showControls
              autoScroll
              wsConnected={wsConnected}
              className="h-[600px]"
            />
          </TabsContent>

          <TabsContent value="source" className="mt-4">
            <Card>
              <div className="flex h-[600px]">
                {/* File tree - left panel */}
                <div className="w-64 shrink-0 border-r overflow-auto p-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    <GitBranch className="h-3.5 w-3.5" />
                    {deployment.branch || "main"}
                  </div>
                  <Separator />
                  <div className="mt-1">
                    <FileTree
                      nodes={MOCK_FILE_TREE}
                      selectedFile={selectedFile}
                      onSelect={handleFileSelect}
                    />
                  </div>
                </div>

                {/* Code preview - right panel */}
                <div className="flex-1 overflow-auto">
                  {selectedFile && selectedFileNode ? (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
                        {selectedFileNode.language === "typescript" || selectedFileNode.language === "javascript" ? (
                          <FileCode className="h-4 w-4 text-green-400" />
                        ) : (
                          <File className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-mono">{selectedFile}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto"
                          onClick={() => copyToClipboard(selectedFileNode.content || "")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {selectedFileNode.content ? (
                        <pre className="p-4 text-sm font-mono leading-6 overflow-auto">
                          <code className="language-" dangerouslySetInnerHTML={{ __html: escapeHtml(selectedFileNode.content) }} />
                        </pre>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                          二进制文件无法预览
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <FileCode className="h-12 w-12 mb-3" />
                      <p className="text-sm">选择文件以预览内容</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="functions" className="mt-4">
            {hasFunctions ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Serverless 函数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-2.5 font-medium">路径</th>
                          <th className="text-left px-4 py-2.5 font-medium">区域</th>
                          <th className="text-right px-4 py-2.5 font-medium">调用次数</th>
                          <th className="text-right px-4 py-2.5 font-medium">平均耗时</th>
                          <th className="text-right px-4 py-2.5 font-medium">最近调用</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_FUNCTIONS.map((fn) => (
                          <tr key={fn.path} className="border-b last:border-b-0 hover:bg-muted/30">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-mono text-xs">{fn.path}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant="outline" className="font-mono text-xs">
                                {fn.region}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs">
                              {fn.invocations.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs">
                              {fn.avgDuration}
                            </td>
                            <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                              {fn.lastInvoked}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-1">无 Serverless 函数</h3>
                  <p className="text-sm text-muted-foreground">此项目未配置任何 Serverless 函数。</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
