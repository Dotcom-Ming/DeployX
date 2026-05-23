import { Plan } from "../types/organization";
export interface PlanLimits {
    bandwidth: number;
    buildMinutes: number;
    invocations: number;
    projects: number;
    members: number;
    price: number;
}
export declare const PLAN_LIMITS: Record<Plan, PlanLimits>;
export declare const PLAN_DISPLAY_NAMES: Record<Plan, string>;
export declare const PLAN_DESCRIPTIONS: Record<Plan, string>;
//# sourceMappingURL=plans.d.ts.map