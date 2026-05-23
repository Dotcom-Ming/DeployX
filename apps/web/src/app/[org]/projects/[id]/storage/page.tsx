"use client";

import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/custom/empty-state";
import {
  Upload,
  Trash2,
  MoreHorizontal,
  File,
  FileArchive,
  FileCode2,
  FileImage,
  FileText,
  FolderArchive,
  HardDrive,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & mock data
// ---------------------------------------------------------------------------

type FileType = "artifact" | "log" | "cache" | "image" | "config" | "bundle";

interface StorageItem {
  id: string;
  name: string;
  size: number;
  type: FileType;
  lastModified: string;
}

const FILE_TYPE_ICONS: Record<FileType, React.ElementType> = {
  artifact: FileArchive,
  log: FileText,
  cache: FolderArchive,
  image: FileImage,
  config: FileCode2,
  bundle: FileArchive,
};

const FILE_TYPE_LABELS: Record<FileType, string> = {
  artifact: "构建产物",
  log: "构建日志",
  cache: "缓存",
  image: "图片",
  config: "配置",
  bundle: "打包文件",
};

const MOCK_STORAGE: StorageItem[] = [
  {
    id: "store_01",
    name: "acme-web-build-v2.4.1.tar.gz",
    size: 45_200_000,
    type: "artifact",
    lastModified: "2 minutes ago",
  },
  {
    id: "store_02",
    name: "build-output-next.zip",
    size: 12_800_000,
    type: "artifact",
    lastModified: "3 hours ago",
  },
  {
    id: "store_03",
    name: "build-log-2025-05-10.log",
    size: 2_400_000,
    type: "log",
    lastModified: "2 minutes ago",
  },
  {
    id: "store_04",
    name: "build-log-2025-05-09.log",
    size: 1_900_000,
    type: "log",
    lastModified: "1 day ago",
  },
  {
    id: "store_05",
    name: "node-modules-cache.tar",
    size: 156_000_000,
    type: "cache",
    lastModified: "2 days ago",
  },
  {
    id: "store_06",
    name: "next-cache-layer.tar.gz",
    size: 78_500_000,
    type: "cache",
    lastModified: "2 days ago",
  },
  {
    id: "store_07",
    name: "og-image-generator.png",
    size: 850_000,
    type: "image",
    lastModified: "3 hours ago",
  },
  {
    id: "store_08",
    name: "next.config.js",
    size: 4_200,
    type: "config",
    lastModified: "1 day ago",
  },
  {
    id: "store_09",
    name: "acme-web-ssr-bundle.js",
    size: 5_600_000,
    type: "bundle",
    lastModified: "2 minutes ago",
  },
  {
    id: "store_10",
    name: "build-log-2025-05-08.log",
    size: 2_100_000,
    type: "log",
    lastModified: "2 days ago",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StoragePage() {
  const [items, setItems] = useState<StorageItem[]>(MOCK_STORAGE);

  const totalSize = items.reduce((acc, item) => acc + item.size, 0);

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">存储</h1>
          <p className="text-muted-foreground text-sm mt-1">
            构建产物、日志和部署文件
          </p>
        </div>
        <Button size="sm">
          <Upload className="h-4 w-4 mr-1" />
          上传
        </Button>
      </div>

      {/* Usage summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总文件数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总大小</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">缓存大小</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(
                items
                  .filter((i) => i.type === "cache")
                  .reduce((acc, item) => acc + item.size, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File list */}
      {items.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title="暂无存储文件"
          description="首次部署后，构建产物和日志将显示在此处"
        />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">文件</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>修改时间</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const Icon = FILE_TYPE_ICONS[item.type];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate max-w-[300px]">
                            {item.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {FILE_TYPE_LABELS[item.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatBytes(item.size)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.lastModified}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>下载</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
