"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageMetric = exports.InvoiceStatus = exports.SubscriptionStatus = void 0;
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["CANCELED"] = "CANCELED";
    SubscriptionStatus["TRIALING"] = "TRIALING";
    SubscriptionStatus["PAUSED"] = "PAUSED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["VOID"] = "VOID";
    InvoiceStatus["UNCOLLECTIBLE"] = "UNCOLLECTIBLE";
    InvoiceStatus["OPEN"] = "OPEN";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var UsageMetric;
(function (UsageMetric) {
    UsageMetric["BANDWIDTH"] = "BANDWIDTH";
    UsageMetric["BUILD_MINUTES"] = "BUILD_MINUTES";
    UsageMetric["INVOCATIONS"] = "INVOCATIONS";
    UsageMetric["STORAGE"] = "STORAGE";
})(UsageMetric || (exports.UsageMetric = UsageMetric = {}));
//# sourceMappingURL=billing.js.map