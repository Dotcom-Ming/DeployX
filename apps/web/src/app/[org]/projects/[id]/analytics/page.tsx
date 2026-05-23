"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowUp, ArrowDown, Activity, Zap, AlertTriangle } from "lucide-react";

interface AnalyticsData {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  bandwidth: number;
  requestsByDay: { day: string; count: number }[];
  topPages: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
}

export default function AnalyticsPage() {
  const params = useParams();
  const org = params.org as string;
  const projectId = params.id as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
      const res = await fetch(`/api/orgs/${org}/projects/${projectId}/analytics`);
        if (res.ok) {
          const analyticsData = await res.json();
          setData(analyticsData);
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [org, projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Traffic and performance metrics for your project
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No analytics data available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Analytics data will appear once your deployment starts receiving traffic.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxRequests = Math.max(...data.requestsByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Traffic and performance metrics for your project
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">p50 latency</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.errorRate}%</div>
            <p className="text-xs text-muted-foreground">4xx + 5xx responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bandwidth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.bandwidth.toFixed(1)} MB</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-[200px]">
              {data.requestsByDay.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary rounded-t-sm transition-all"
                    style={{ height: `${(day.count / maxRequests) * 100}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                  />
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No page data available</p>
            ) : (
              <div className="space-y-3">
                {data.topPages.map((page, i) => (
                  <div key={page.path} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                        {i + 1}
                      </Badge>
                      <code className="text-sm">{page.path}</code>
                    </div>
                    <span className="text-sm font-medium">{page.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topReferrers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrer data available</p>
          ) : (
            <div className="space-y-3">
              {data.topReferrers.map((ref, i) => (
                <div key={ref.referrer} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                      {i + 1}
                    </Badge>
                    <span className="text-sm">{ref.referrer}</span>
                  </div>
                  <span className="text-sm font-medium">{ref.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
