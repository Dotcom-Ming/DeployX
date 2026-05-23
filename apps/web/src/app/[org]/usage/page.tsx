"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { UsageMetric, Plan, PLAN_DISPLAY_NAMES, PLAN_LIMITS } from "@deployx/shared";
import { Wifi, Clock, Database, Activity, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";

const METRICS = [
  { key: UsageMetric.BANDWIDTH, label: "Bandwidth", unit: "GB", icon: Wifi, color: "hsl(199, 89%, 48%)" },
  { key: UsageMetric.BUILD_MINUTES, label: "Build Minutes", unit: "min", icon: Clock, color: "hsl(142, 76%, 36%)" },
  { key: UsageMetric.INVOCATIONS, label: "Invocations", unit: "", icon: Activity, color: "hsl(271, 81%, 56%)" },
  { key: UsageMetric.STORAGE, label: "Storage", unit: "GB", icon: Database, color: "hsl(24, 94%, 53%)" },
];

const chartData = {
  "7d": [
    { date: "Nov 25", bandwidth: 52, buildMinutes: 320, invocations: 12400, storage: 8.2 },
    { date: "Nov 26", bandwidth: 68, buildMinutes: 480, invocations: 15200, storage: 8.5 },
    { date: "Nov 27", bandwidth: 45, buildMinutes: 210, invocations: 11800, storage: 8.3 },
    { date: "Nov 28", bandwidth: 72, buildMinutes: 560, invocations: 16800, storage: 8.7 },
    { date: "Nov 29", bandwidth: 81, buildMinutes: 420, invocations: 18400, storage: 8.9 },
    { date: "Nov 30", bandwidth: 95, buildMinutes: 680, invocations: 21200, storage: 9.1 },
    { date: "Dec 01", bandwidth: 88, buildMinutes: 540, invocations: 19600, storage: 9.0 },
  ],
  "30d": [
    { date: "Nov 02", bandwidth: 42, buildMinutes: 280, invocations: 9800, storage: 7.5 },
    { date: "Nov 05", bandwidth: 55, buildMinutes: 390, invocations: 12400, storage: 7.8 },
    { date: "Nov 08", bandwidth: 48, buildMinutes: 310, invocations: 11200, storage: 7.6 },
    { date: "Nov 11", bandwidth: 61, buildMinutes: 450, invocations: 14600, storage: 8.0 },
    { date: "Nov 14", bandwidth: 58, buildMinutes: 380, invocations: 13800, storage: 7.9 },
    { date: "Nov 17", bandwidth: 70, buildMinutes: 520, invocations: 16200, storage: 8.3 },
    { date: "Nov 20", bandwidth: 75, buildMinutes: 480, invocations: 17800, storage: 8.5 },
    { date: "Nov 23", bandwidth: 68, buildMinutes: 410, invocations: 15600, storage: 8.2 },
    { date: "Nov 26", bandwidth: 82, buildMinutes: 590, invocations: 18900, storage: 8.8 },
    { date: "Nov 29", bandwidth: 90, buildMinutes: 620, invocations: 20100, storage: 9.1 },
    { date: "Dec 01", bandwidth: 88, buildMinutes: 540, invocations: 19600, storage: 9.0 },
  ],
};

const currentUsage: Record<string, number> = {
  bandwidth: 456,
  buildMinutes: 15200,
  invocations: 98700,
  storage: 9.0,
};

const metricKeyMap: Record<string, string> = {
  BANDWIDTH: "bandwidth",
  BUILD_MINUTES: "buildMinutes",
  INVOCATIONS: "invocations",
  STORAGE: "storage",
};

export default function UsagePage() {
  const params = useParams<{ org: string }>();
  const orgSlug = params.org;
  const [chartRange, setChartRange] = useState<"7d" | "30d">("7d");
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/orgs/${orgSlug}/billing/subscription`);
        if (res.ok) setSubscription(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, [orgSlug]);

  const currentPlan = subscription?.plan || Plan.PRO;
  const limits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS[Plan.PRO];
  const data = chartData[chartRange];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usage</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bandwidth, builds, and resource usage for {PLAN_DISPLAY_NAMES[currentPlan as keyof typeof PLAN_DISPLAY_NAMES]} plan
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric, i) => {
          const used = currentUsage[metricKeyMap[metric.key]] ?? 0;
          const limit = (limits as any)[metricKeyMap[metric.key]] ?? 100;
          const pct = Math.min(100, Math.round((used / limit) * 100));
          const isUnlimited = limit === 0;
          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </CardTitle>
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {used.toLocaleString()}{metric.unit ? ` ${metric.unit}` : ""}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {isUnlimited ? "Unlimited" : `of ${limit.toLocaleString()} ${metric.unit}`}
                    </span>
                    {!isUnlimited && (
                      <span className="text-xs font-medium">{pct}%</span>
                    )}
                  </div>
                  {!isUnlimited && (
                    <Progress value={pct} className="mt-2 h-2" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Tabs defaultValue="bandwidth">
        <TabsList>
          <TabsTrigger value="bandwidth">Bandwidth</TabsTrigger>
          <TabsTrigger value="buildMinutes">Build Minutes</TabsTrigger>
          <TabsTrigger value="invocations">Invocations</TabsTrigger>
          <TabsTrigger value="all">All Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="bandwidth" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bandwidth Usage</CardTitle>
                <CardDescription>Data transfer over the selected period</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant={chartRange === "7d" ? "default" : "ghost"} size="sm" onClick={() => setChartRange("7d")}>7d</Button>
                <Button variant={chartRange === "30d" ? "default" : "ghost"} size="sm" onClick={() => setChartRange("30d")}>30d</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="bandwidthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="bandwidth" stroke="hsl(199, 89%, 48%)" fill="url(#bandwidthGrad)" name="Bandwidth (GB)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buildMinutes" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Build Minutes</CardTitle>
                <CardDescription>Build time usage over the selected period</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant={chartRange === "7d" ? "default" : "ghost"} size="sm" onClick={() => setChartRange("7d")}>7d</Button>
                <Button variant={chartRange === "30d" ? "default" : "ghost"} size="sm" onClick={() => setChartRange("30d")}>30d</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="buildGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="buildMinutes" stroke="hsl(142, 76%, 36%)" fill="url(#buildGrad)" name="Build Minutes" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invocations" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invocations</CardTitle>
                <CardDescription>Function invocation count over the selected period</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant={chartRange === "7d" ? "default" : "ghost"} size="sm" onClick={() => setChartRange("7d")}>7d</Button>
                <Button variant={chartRange === "30d" ? "default" : "ghost"} size="sm" onClick={() => setChartRange("30d")}>30d</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="invocationsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="invocations" stroke="hsl(271, 81%, 56%)" fill="url(#invocationsGrad)" name="Invocations" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Metrics</CardTitle>
                <CardDescription>Combined usage overview over the selected period</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant={chartRange === "7d" ? "default" : "ghost"} size="sm" onClick={() => setChartRange("7d")}>7d</Button>
                <Button variant={chartRange === "30d" ? "default" : "ghost"} size="sm" onClick={() => setChartRange("30d")}>30d</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="allBandwidth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="allBuild" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="allInvocations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="bandwidth" stroke="hsl(199, 89%, 48%)" fill="url(#allBandwidth)" name="Bandwidth (GB)" strokeWidth={2} />
                  <Area type="monotone" dataKey="buildMinutes" stroke="hsl(142, 76%, 36%)" fill="url(#allBuild)" name="Build Minutes" strokeWidth={2} />
                  <Area type="monotone" dataKey="invocations" stroke="hsl(271, 81%, 56%)" fill="url(#allInvocations)" name="Invocations" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
