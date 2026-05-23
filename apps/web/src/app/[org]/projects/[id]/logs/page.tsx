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
          <h1 className="text-2xl font-semibold">Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time runtime logs for your project
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
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
