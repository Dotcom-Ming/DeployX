"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plan, PLAN_DISPLAY_NAMES, PLAN_LIMITS } from "@deployx/shared";
import { ExternalLink, Loader2, CreditCard, Download } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    id: Plan.HOBBY,
    name: "Hobby",
    price: 0,
    description: "For personal projects and experiments",
    features: ["10 projects", "3 team members", "100 GB bandwidth", "1000 build minutes"],
  },
  {
    id: Plan.PRO,
    name: "Pro",
    price: 20,
    description: "For professional developers and small teams",
    features: ["Unlimited projects", "Unlimited members", "1 TB bandwidth", "10000 build minutes", "Priority support"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro",
  },
  {
    id: Plan.ENTERPRISE,
    name: "Enterprise",
    price: null,
    description: "For large teams with advanced needs",
    features: ["Everything in Pro", "Custom limits", "SLA guarantee", "Dedicated support", "SSO/SAML"],
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
  },
];

export default function BillingPage() {
  const params = useParams();
  const org = params.org as string;

  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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
        toast.error(data.message || "Failed to create checkout session");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
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
        toast.error(data.message || "Failed to create billing portal session");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
    }
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your subscription, view usage, and download invoices
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Your organization is on the {PLAN_DISPLAY_NAMES[currentPlan as keyof typeof PLAN_DISPLAY_NAMES]} plan
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
                  <p className="text-sm text-muted-foreground">Projects</p>
                  <p className="font-medium">{limits.projects === 0 ? "Unlimited" : limits.projects}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="font-medium">{limits.members === 0 ? "Unlimited" : limits.members}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Bandwidth</p>
                  <p className="font-medium">{limits.bandwidth} GB</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Build Minutes</p>
                  <p className="font-medium">{limits.buildMinutes} min</p>
                </div>
              </div>
              {subscription?.stripeSubscriptionId && (
                <Button variant="outline" onClick={handleManageBilling}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage This Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Bandwidth</span>
                    <span className="text-muted-foreground">0 / {limits.bandwidth} GB</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "0%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Build Minutes</span>
                    <span className="text-muted-foreground">0 / {limits.buildMinutes} min</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <Card key={plan.id} className={currentPlan === plan.id ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-2">
                    {plan.price === 0 ? (
                      <span className="text-2xl font-bold">Free</span>
                    ) : plan.price ? (
                      <span className="text-2xl font-bold">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                    ) : (
                      <span className="text-2xl font-bold">Contact us</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
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
                      {currentPlan === Plan.HOBBY ? "Upgrade" : "Switch Plan"}
                    </Button>
                  )}
                  {currentPlan === plan.id && (
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      Current Plan
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Invoice</TableHead>
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
                                View
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
      </Tabs>
    </div>
  );
}
