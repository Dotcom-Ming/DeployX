"use client";
import { Card, CardContent } from "@/components/ui/card";
import { TerminalLogs } from "@/components/custom/terminal-logs";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">日志</h1>
          <p className="text-muted-foreground text-sm mt-1">
            项目的实时运行时日志
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            筛选
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <TerminalLogs
            logs={[]}
            wsConnected={false}
            className="h-[600px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
