"use client";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plan, PLAN_DISPLAY_NAMES, PLAN_LIMITS } from "@deployx/shared";
import { ExternalLink, Loader2, CreditCard, Download, Check, X, Plus, Mail, MessageSquare, Link2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const PLANS = [
  {
    id: Plan.HOBBY,
    name: "Hobby",
    price: 0,
    description: "适合个人项目和小型实验",
    features: ["10 个项目", "3 个团队成员", "100 GB 带宽", "6000 分钟构建时长"],
  },
  {
    id: Plan.PRO,
    name: "Pro",
    price: 20,
    description: "适合专业开发者和中小团队",
    features: ["无限项目", "无限成员", "1 TB 带宽", "24000 分钟构建时长", "优先支持"],
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || "price_pro",
  },
  {
    id: Plan.ENTERPRISE,
    name: "Enterprise",
    price: null,
    description: "适合有高级需求的大型团队",
    features: ["Pro 所有功能", "自定义限制", "SLA 保障", "专属支持", "SSO/SAML"],
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
  },
];

const ANNUAL_DISCOUNT = 0.83;

const MOCK_PAYMENT_METHODS = [
  { id: "pm_1", brand: "visa" as const, last4: "4242", expMonth: 12, expYear: 2027, isDefault: true },
  { id: "pm_2", brand: "mastercard" as const, last4: "8888", expMonth: 6, expYear: 2026, isDefault: false },
];

const CARD_LOGOS: Record<string, string> = {
  visa: "💳 Visa",
  mastercard: "💳 Mastercard",
  amex: "💳 Amex",
};

const MOCK_USAGE = {
  bandwidth: { used: 234, total: 1000, unit: "GB" },
  buildMinutes: { used: 4200, total: 24000, unit: "min" },
  invocations: { used: 456, total: 1000, unit: "GB-hrs" },
  storage: { used: 18, total: 50, unit: "GB" },
};

const FEATURE_COMPARISON = [
  { feature: "项目数", hobby: "10", pro: "无限", enterprise: "无限" },
  { feature: "团队成员", hobby: "3", pro: "无限", enterprise: "无限" },
  { feature: "带宽", hobby: "100 GB", pro: "1 TB", enterprise: "自定义" },
  { feature: "构建时长", hobby: "6,000 min", pro: "24,000 min", enterprise: "自定义" },
  { feature: "函数调用", hobby: "100 GB-hrs", pro: "1,000 GB-hrs", enterprise: "自定义" },
  { feature: "存储", hobby: "50 GB", pro: "500 GB", enterprise: "自定义" },
  { feature: "自定义域名", hobby: false, pro: true, enterprise: true },
  { feature: "优先支持", hobby: false, pro: true, enterprise: true },
  { feature: "SSO/SAML", hobby: false, pro: false, enterprise: true },
  { feature: "SLA 保障", hobby: false, pro: false, enterprise: true },
  { feature: "专属支持", hobby: false, pro: false, enterprise: true },
  { feature: "审计日志", hobby: false, pro: true, enterprise: true },
];

function getProgressColor(percentage: number) {
  if (percentage >= 100) return "bg-red-500";
  if (percentage >= 80) return "bg-yellow-500";
  return "bg-primary";
}

export default function BillingPage() {
  const params = useParams();
  const org = params.org as string;

  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState("80");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySlack, setNotifySlack] = useState(false);
  const [notifyWebhook, setNotifyWebhook] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, invRes] = await Promise.all([
          fetch(`/api/orgs/${org}/billing/subscription`),
          fetch(`/api/orgs/${org}/billing/invoices`),
        ]);

        if (subRes.ok) setSubscription(await subRes.json());
        if (invRes.ok) setInvoices(await invRes.json());
      } catch {
        // Silently fail for now
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [org]);

  const handleUpgrade = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const res = await fetch(`/api/orgs/${org}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/${org}/billing?success=true`,
          cancelUrl: `${window.location.origin}/${org}/billing?canceled=true`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "创建结账会话失败");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("出了点问题");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch(`/api/orgs/${org}/billing/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/${org}/billing`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "创建账单门户会话失败");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("出了点问题");
    }
  };

  const handleSaveAlerts = () => {
    toast.success("超额提醒设置已保存");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || Plan.HOBBY;
  const limits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS[Plan.HOBBY];

  const getDisplayPrice = (plan: (typeof PLANS)[number]) => {
    if (plan.price === 0) return { amount: "免费", period: "" };
    if (plan.price === null) return { amount: "联系我们", period: "" };
    const price = billingCycle === "annual" ? +(plan.price * ANNUAL_DISCOUNT).toFixed(2) : plan.price;
    const period = billingCycle === "annual" ? "/mo (年付)" : "/mo";
    return { amount: `$${price}`, period };
  };

  const usageCards = [
    {
      label: "带宽",
      used: MOCK_USAGE.bandwidth.used,
      total: MOCK_USAGE.bandwidth.total,
      unit: MOCK_USAGE.bandwidth.unit,
      displayTotal: currentPlan === Plan.PRO ? "1 TB" : `${MOCK_USAGE.bandwidth.total} ${MOCK_USAGE.bandwidth.unit}`,
    },
    {
      label: "构建时长",
      used: MOCK_USAGE.buildMinutes.used,
      total: MOCK_USAGE.buildMinutes.total,
      unit: MOCK_USAGE.buildMinutes.unit,
      displayTotal: `${MOCK_USAGE.buildMinutes.total} ${MOCK_USAGE.buildMinutes.unit}`,
    },
    {
      label: "函数调用",
      used: MOCK_USAGE.invocations.used,
      total: MOCK_USAGE.invocations.total,
      unit: MOCK_USAGE.invocations.unit,
      displayTotal: `${MOCK_USAGE.invocations.total} ${MOCK_USAGE.invocations.unit}`,
    },
    {
      label: "存储",
      used: MOCK_USAGE.storage.used,
      total: MOCK_USAGE.storage.total,
      unit: MOCK_USAGE.storage.unit,
      displayTotal: `${MOCK_USAGE.storage.total} ${MOCK_USAGE.storage.unit}`,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">账单</h1>
        <p className="text-muted-foreground text-sm mt-1">
          管理订阅、查看用量和下载发票
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="plans">方案</TabsTrigger>
          <TabsTrigger value="invoices">发票</TabsTrigger>
          <TabsTrigger value="payment-methods">支付方式</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>当前方案</CardTitle>
                  <CardDescription>
                    您的组织当前使用 {PLAN_DISPLAY_NAMES[currentPlan as keyof typeof PLAN_DISPLAY_NAMES]} 方案
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {PLAN_DISPLAY_NAMES[currentPlan as keyof typeof PLAN_DISPLAY_NAMES]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">项目</p>
                  <p className="font-medium">{limits.projects === 0 ? "无限" : limits.projects}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">成员</p>
                  <p className="font-medium">{limits.members === 0 ? "无限" : limits.members}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">带宽</p>
                  <p className="font-medium">{limits.bandwidth === 0 ? "自定义" : `${limits.bandwidth} GB`}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">构建时长</p>
                  <p className="font-medium">{limits.buildMinutes === 0 ? "自定义" : `${limits.buildMinutes} min`}</p>
                </div>
              </div>
              {subscription?.stripeSubscriptionId && (
                <Button variant="outline" onClick={handleManageBilling}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  管理账单
                </Button>
              )}
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-medium mb-4">本期用量</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {usageCards.map((item) => {
                const percentage = Math.round((item.used / item.total) * 100);
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="pt-6 space-y-3">
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="font-medium">
                          {item.used} / {item.displayTotal}
                        </p>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full transition-all ${getProgressColor(percentage)}`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                        {percentage >= 80 && (
                          <p className="text-xs text-yellow-600">即将达到上限</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>超额提醒设置</CardTitle>
              <CardDescription>当用量接近或超过限额时接收通知</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用超额预警</Label>
                  <p className="text-sm text-muted-foreground">在用量达到阈值时发送提醒</p>
                </div>
                <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
              </div>

              {alertsEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>提醒阈值</Label>
                    <Select value={alertThreshold} onValueChange={setAlertThreshold}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="80">80%</SelectItem>
                        <SelectItem value="100">100%</SelectItem>
                        <SelectItem value="custom">自定义</SelectItem>
                      </SelectContent>
                    </Select>
                    {alertThreshold === "custom" && (
                      <Input
                        type="number"
                        placeholder="输入百分比 (如 90)"
                        className="w-[180px]"
                        min={1}
                        max={200}
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>通知方式</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="notify-email"
                          checked={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.checked)}
                          className="h-4 w-4 rounded border-input"
                        />
                        <label htmlFor="notify-email" className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          Email
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="notify-slack"
                          checked={notifySlack}
                          onChange={(e) => setNotifySlack(e.target.checked)}
                          className="h-4 w-4 rounded border-input"
                        />
                        <label htmlFor="notify-slack" className="flex items-center gap-2 text-sm">
                          <MessageSquare className="h-4 w-4" />
                          Slack
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="notify-webhook"
                          checked={notifyWebhook}
                          onChange={(e) => setNotifyWebhook(e.target.checked)}
                          className="h-4 w-4 rounded border-input"
                        />
                        <label htmlFor="notify-webhook" className="flex items-center gap-2 text-sm">
                          <Link2 className="h-4 w-4" />
                          Webhook
                        </label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveAlerts}>保存设置</Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">选择方案</h3>
            <div className="flex items-center gap-3">
              <span className={billingCycle === "monthly" ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                月付
              </span>
              <Switch
                checked={billingCycle === "annual"}
                onCheckedChange={(checked) => setBillingCycle(checked ? "annual" : "monthly")}
              />
              <span className={billingCycle === "annual" ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                年付
              </span>
              {billingCycle === "annual" && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  省 17%
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const isPro = plan.id === Plan.PRO;
              const displayPrice = getDisplayPrice(plan);
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`relative ${currentPlan === plan.id ? "border-primary" : ""} ${
                      isPro ? "border-primary ring-2 ring-primary/20" : ""
                    }`}
                  >
                    {isPro && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">最热门</Badge>
                      </div>
                    )}
                    <CardHeader className="pt-6">
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">{displayPrice.amount}</span>
                        {displayPrice.period && (
                          <span className="text-sm font-normal text-muted-foreground">
                            {displayPrice.period}
                          </span>
                        )}
                        {billingCycle === "annual" && plan.price !== null && plan.price !== 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            原价 ${plan.price}/mo，年付省 17%
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {currentPlan !== plan.id && plan.priceId && (
                        <Button
                          className="w-full"
                          onClick={() => handleUpgrade(plan.priceId!)}
                          disabled={checkoutLoading === plan.priceId}
                        >
                          {checkoutLoading === plan.priceId ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {currentPlan === Plan.HOBBY ? "升级" : "切换方案"}
                        </Button>
                      )}
                      {currentPlan === plan.id && (
                        <Badge variant="secondary" className="w-full justify-center py-2">
                          当前方案
                        </Badge>
                      )}
                      {plan.id === Plan.ENTERPRISE && (
                        <Button className="w-full" variant="outline" asChild>
                          <a href="mailto:sales@deployx.com">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            联系销售
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>功能对比</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">功能</TableHead>
                    <TableHead className="text-center">Hobby</TableHead>
                    <TableHead className="text-center">Pro</TableHead>
                    <TableHead className="text-center">Enterprise</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FEATURE_COMPARISON.map((row) => (
                    <TableRow key={row.feature}>
                      <TableCell className="font-medium">{row.feature}</TableCell>
                      {[row.hobby, row.pro, row.enterprise].map((val, idx) => (
                        <TableCell key={idx} className="text-center">
                          {val === true ? (
                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                          ) : val === false ? (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          ) : (
                            <span className="text-sm">{val}</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>付款历史</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无发票</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">发票</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.hostedInvoiceUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                查看
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>已绑定卡片</CardTitle>
                  <CardDescription>管理您的支付卡片</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  添加支付方式
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {MOCK_PAYMENT_METHODS.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无绑定卡片</p>
              ) : (
                <div className="space-y-3">
                  {MOCK_PAYMENT_METHODS.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg">{CARD_LOGOS[card.brand]}</span>
                        <div>
                          <p className="font-medium">
                            •••• {card.last4}
                            {card.isDefault && (
                              <Badge variant="secondary" className="ml-2">
                                默认
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            过期 {card.expMonth.toString().padStart(2, "0")}/{card.expYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!card.isDefault && (
                          <Button variant="ghost" size="sm">
                            设为默认
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive">
                          删除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>账单地址</CardTitle>
              <CardDescription>用于发票和收据的账单地址</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>姓名</Label>
                  <Input placeholder="张三" />
                </div>
                <div className="space-y-2">
                  <Label>公司</Label>
                  <Input placeholder="公司名称（可选）" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>地址</Label>
                <Input placeholder="街道地址" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>城市</Label>
                  <Input placeholder="城市" />
                </div>
                <div className="space-y-2">
                  <Label>省份</Label>
                  <Input placeholder="省份" />
                </div>
                <div className="space-y-2">
                  <Label>邮编</Label>
                  <Input placeholder="邮编" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>国家/地区</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择国家/地区" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CN">中国</SelectItem>
                    <SelectItem value="US">美国</SelectItem>
                    <SelectItem value="JP">日本</SelectItem>
                    <SelectItem value="SG">新加坡</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => toast.success("账单地址已保存")}>保存地址</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
