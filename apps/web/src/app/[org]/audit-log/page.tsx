import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/custom/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">审计日志</h1>
        <p className="text-muted-foreground text-sm mt-1">
          查看组织内的操作记录
        </p>
      </div>

      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={FileText}
            title="暂无审计日志"
            description="在组织中执行的操作将显示在此处"
          />
        </CardContent>
      </Card>
    </div>
  );
}
