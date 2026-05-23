import { Plan } from "../types/organization.js";

export interface PlanLimits {
  bandwidth: number;       // GB
  buildMinutes: number;    // minutes
  invocations: number;     // GB-hours
  projects: number;        // count (0 = unlimited)
  members: number;         // count (0 = unlimited)
  price: number;           // USD per user/month (0 = free)
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  [Plan.HOBBY]: {
    bandwidth: 100,
    buildMinutes: 6000,
    invocations: 100,
    projects: 10,
    members: 3,
    price: 0,
  },
  [Plan.PRO]: {
    bandwidth: 1000,
    buildMinutes: 24000,
    invocations: 1000,
    projects: 0, // unlimited
    members: 0,  // unlimited
    price: 20,
  },
  [Plan.ENTERPRISE]: {
    bandwidth: 0, // custom
    buildMinutes: 0,
    invocations: 0,
    projects: 0,
    members: 0,
    price: 0, // contact sales
  },
};

export const PLAN_DISPLAY_NAMES: Record<Plan, string> = {
  [Plan.HOBBY]: "Hobby",
  [Plan.PRO]: "Pro",
  [Plan.ENTERPRISE]: "Enterprise",
};

export const PLAN_DESCRIPTIONS: Record<Plan, string> = {
  [Plan.HOBBY]: "Perfect for personal projects and experiments",
  [Plan.PRO]: "For teams that need more power and flexibility",
  [Plan.ENTERPRISE]: "Custom solutions for large-scale deployments",
};
