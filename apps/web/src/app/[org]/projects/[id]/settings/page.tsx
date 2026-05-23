"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";

export default function ProjectSettingsPage() {
  const [projectName, setProjectName] = useState("");
  const [buildCommand, setBuildCommand] = useState("");
  const [outputDirectory, setOutputDirectory] = useState("");
  const [installCommand, setInstallCommand] = useState("");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">项目设置</h1>
        <p className="text-muted-foreground text-sm mt-1">
          配置项目的构建和部署设置
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>常规</CardTitle>
          <CardDescription>基本项目信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">项目名称</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>构建设置</CardTitle>
          <CardDescription>自定义项目的构建方式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buildCommand">构建命令</Label>
            <Input
              id="buildCommand"
              placeholder="npm run build"
              value={buildCommand}
              onChange={(e) => setBuildCommand(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outputDirectory">输出目录</Label>
            <Input
              id="outputDirectory"
              placeholder=".next"
              value={outputDirectory}
              onChange={(e) => setOutputDirectory(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installCommand">安装命令</Label>
            <Input
              id="installCommand"
              placeholder="npm install"
              value={installCommand}
              onChange={(e) => setInstallCommand(e.target.value)}
            />
          </div>
          <Button>保存更改</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">危险操作</CardTitle>
          <CardDescription>
            不可逆的破坏性操作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">删除项目</p>
              <p className="text-sm text-muted-foreground">
                一旦删除，无法恢复。所有部署和数据将被永久清除。
              </p>
            </div>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              删除
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
