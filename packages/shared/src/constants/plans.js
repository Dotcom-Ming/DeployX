"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_DESCRIPTIONS = exports.PLAN_DISPLAY_NAMES = exports.PLAN_LIMITS = void 0;
const organization_1 = require("../types/organization");
exports.PLAN_LIMITS = {
    [organization_1.Plan.HOBBY]: {
        bandwidth: 100,
        buildMinutes: 6000,
        invocations: 100,
        projects: 10,
        members: 3,
        price: 0,
    },
    [organization_1.Plan.PRO]: {
        bandwidth: 1000,
        buildMinutes: 24000,
        invocations: 1000,
        projects: 0, // unlimited
        members: 0, // unlimited
        price: 20,
    },
    [organization_1.Plan.ENTERPRISE]: {
        bandwidth: 0, // custom
        buildMinutes: 0,
        invocations: 0,
        projects: 0,
        members: 0,
        price: 0, // contact sales
    },
};
exports.PLAN_DISPLAY_NAMES = {
    [organization_1.Plan.HOBBY]: "Hobby",
    [organization_1.Plan.PRO]: "Pro",
    [organization_1.Plan.ENTERPRISE]: "Enterprise",
};
exports.PLAN_DESCRIPTIONS = {
    [organization_1.Plan.HOBBY]: "Perfect for personal projects and experiments",
    [organization_1.Plan.PRO]: "For teams that need more power and flexibility",
    [organization_1.Plan.ENTERPRISE]: "Custom solutions for large-scale deployments",
};
//# sourceMappingURL=plans.js.map