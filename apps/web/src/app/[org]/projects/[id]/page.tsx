"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/custom/status-badge";
import { Avatar } from "@/components/custom/avatar";
import {
  Copy,
  ExternalLink,
  Settings,
  Eye,
  RotateCcw,
  ArrowUpRight,
  MoreHorizontal,
  GitBranch,
  Clock,
  Link2,
  Monitor,
  Globe,
  FileText,
  Github,
  BookOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface Deployment {
  id: string;
  status: "ready" | "building" | "error" | "queued" | "canceled";
  branch: string;
  commitHash: string;
  commitMsg: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  duration: string;
  type: "production" | "preview";
}

const MOCK_PROJECT = {
  id: "proj_01",
  name: "acme-web",
  framework: "NEXTJS",
  domains: ["acme-web.deployx.app", "www.acmeweb.com"],
  branch: "main",
  commitHash: "a1b2c3d",
  commitMsg: "feat: add hero section with animation",
  lastDeployBy: "Alice",
  lastDeployTime: "2 minutes ago",
  buildDuration: "1m 23s",
};

const MOCK_DEPLOYMENTS: Deployment[] = [
  {
    id: "dpl_01",
    status: "ready",
    branch: "main",
    commitHash: "a1b2c3d",
    commitMsg: "feat: add hero section with animation",
    author: "Alice",
    createdAt: "2m ago",
    duration: "1m 23s",
    type: "production",
  },
  {
    id: "dpl_02",
    status: "ready",
    branch: "fix/header-overflow",
    commitHash: "b2c3d4e",
    commitMsg: "fix: header text overflow on mobile",
    author: "Bob",
    createdAt: "3h ago",
    duration: "1m 05s",
    type: "preview",
  },
  {
    id: "dpl_03",
    status: "ready",
    branch: "main",
    commitHash: "c3d4e5f",
    commitMsg: "chore: update tailwind config",
    author: "Carol",
    createdAt: "6h ago",
    duration: "58s",
    type: "production",
  },
  {
    id: "dpl_04",
    status: "error",
    branch: "feat/new-footer",
    commitHash: "d4e5f6a",
    commitMsg: "wip: new footer component",
    author: "Dave",
    createdAt: "1d ago",
    duration: "45s",
    type: "preview",
  },
  {
    id: "dpl_05",
    status: "ready",
    branch: "main",
    commitHash: "e5f6a7b",
    commitMsg: "docs: update readme",
    author: "Alice",
    createdAt: "2d ago",
    duration: "52s",
    type: "production",
  },
];

const MOCK_QUICK_LINKS = [
  { label: "Git Repository", icon: Github, href: "#" },
  { label: "Documentation", icon: BookOpen, href: "#" },
  { label: "Monitoring", icon: Monitor, href: "#" },
  { label: "Error Tracking", icon: Eye, href: "#" },
  { label: "Analytics", icon: Globe, href: "#" },
  { label: "API Reference", icon: FileText, href: "#" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  const params = useParams<{ org: string; id: string }>();
  const org = params.org;
  const project = MOCK_PROJECT;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      {/* ---- Top bar ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              {project.domains[0]}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyText(project.domains[0])}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
              <a href={`https://${project.domains[0]}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`https://${project.domains[0]}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Visit
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/${org}/projects/${params.id}/settings`}>
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </a>
          </Button>
        </div>
      </div>

      {/* ---- Production Deployment card ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Production Deployment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Screenshot placeholder */}
            <div className="aspect-video rounded-md bg-muted flex items-center justify-center border">
              <Monitor className="h-12 w-12 text-muted-foreground/40" />
            </div>

            {/* Right: Details */}
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <StatusBadge status="ready" size="sm" variant="soft" />
                <span className="text-sm text-muted-foreground">Production</span>
              </div>

              {/* Domains */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Domains</p>
                {project.domains.map((domain) => (
                  <div key={domain} className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono text-sm">{domain}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => copyText(domain)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Source */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</p>
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium">{project.branch}</span>
                  <span className="font-mono text-xs text-muted-foreground">{project.commitHash}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-6">{project.commitMsg}</p>
              </div>

              {/* Deployed by */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deployed By</p>
                <div className="flex items-center gap-2 text-sm">
                  <Avatar fallback={project.lastDeployBy} size="sm" />
                  <span>{project.lastDeployBy}</span>
                  <span className="text-muted-foreground">{project.lastDeployTime}</span>
                </div>
              </div>

              {/* Build Duration */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Build Duration</p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{project.buildDuration}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
            <Button size="sm" asChild>
              <a href={`https://${project.domains[0]}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Visit
              </a>
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Inspect
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Rollback
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              Promote
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Redeploy</DropdownMenuItem>
                <DropdownMenuItem>Share Build Log</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Cancel Deployment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* ---- Recent Deployments ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Commit</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DEPLOYMENTS.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <StatusBadge status={d.status} size="sm" variant="soft" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{d.branch}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-mono text-xs">{d.commitHash.slice(0, 7)}</span>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{d.commitMsg}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Avatar fallback={d.author} size="sm" />
                      <span className="text-sm">{d.author}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.duration}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.createdAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ---- Quick Links ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent transition-colors"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{link.label}</span>
                  <Link2 className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
