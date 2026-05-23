export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    PAST_DUE = "PAST_DUE",
    CANCELED = "CANCELED",
    TRIALING = "TRIALING",
    PAUSED = "PAUSED"
}
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    PAID = "PAID",
    VOID = "VOID",
    UNCOLLECTIBLE = "UNCOLLECTIBLE",
    OPEN = "OPEN"
}
export declare enum UsageMetric {
    BANDWIDTH = "BANDWIDTH",
    BUILD_MINUTES = "BUILD_MINUTES",
    INVOCATIONS = "INVOCATIONS",
    STORAGE = "STORAGE"
}
export interface SubscriptionDto {
    id: string;
    orgId: string;
    plan: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface InvoiceDto {
    id: string;
    orgId: string;
    amount: number;
    currency: string;
    status: InvoiceStatus;
    dueDate: Date;
    paidAt?: Date;
    createdAt: Date;
}
export interface UsageRecordDto {
    id: string;
    orgId: string;
    metric: UsageMetric;
    value: number;
    periodStart: Date;
    periodEnd: Date;
    createdAt: Date;
}
export interface UsageSummaryDto {
    orgId: string;
    periodStart: Date;
    periodEnd: Date;
    bandwidth: number;
    buildMinutes: number;
    invocations: number;
    storage: number;
    limits: Record<UsageMetric, number>;
}
//# sourceMappingURL=billing.d.ts.map