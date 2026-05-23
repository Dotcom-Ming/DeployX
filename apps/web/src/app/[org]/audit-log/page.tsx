import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/custom/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review actions taken within your organization
        </p>
      </div>

      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={FileText}
            title="No audit logs"
            description="Actions performed in your organization will appear here"
          />
        </CardContent>
      </Card>
    </div>
  );
}
