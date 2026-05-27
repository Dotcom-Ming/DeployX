import * as casbin from "casbin";
import path from "path";

export interface AbacContext {
  resourceOwnerId?: string;
  resourceProjectId?: string;
  resourceOrgId?: string;
  resourceVisibility?: string;
}

export class CasbinEnforcer {
  private enforcer: casbin.Enforcer | null = null;

  async init(adapter?: casbin.Adapter): Promise<void> {
    const modelPath = path.resolve(__dirname, "model.conf");
    if (adapter) {
      this.enforcer = await casbin.newEnforcer(modelPath, adapter);
    } else {
      const policyPath = path.resolve(__dirname, "policy.csv");
      this.enforcer = await casbin.newEnforcer(modelPath, policyPath);
    }
    await this.enforcer.loadPolicy();
  }

  async enforce(sub: string, dom: string, obj: string, act: string): Promise<boolean> {
    if (!this.enforcer) {
      throw new Error("CasbinEnforcer not initialized. Call init() first.");
    }
    return this.enforcer.enforce(sub, dom, obj, act);
  }

  async enforceWithAbac(
    sub: string,
    dom: string,
    obj: string,
    act: string,
    context: AbacContext = {},
  ): Promise<boolean> {
    if (!this.enforcer) {
      throw new Error("CasbinEnforcer not initialized. Call init() first.");
    }

    const rbacAllowed = await this.enforcer.enforce(sub, dom, obj, act);
    if (!rbacAllowed) return false;

    if (sub === "owner" || sub === "admin") return true;

    if (context.resourceOwnerId && context.resourceOwnerId !== sub) {
      if (sub === "viewer" || sub === "billing_manager") {
        const readActions = ["view", "read", "list"];
        const action = act.toLowerCase();
        if (!readActions.includes(action)) {
          return false;
        }
      }
    }

    if (context.resourceOrgId && context.resourceOrgId !== dom) {
      return false;
    }

    return true;
  }

  async addPolicy(sub: string, dom: string, obj: string, act: string): Promise<boolean> {
    if (!this.enforcer) {
      throw new Error("CasbinEnforcer not initialized. Call init() first.");
    }
    return this.enforcer.addPolicy(sub, dom, obj, act);
  }

  async removePolicy(sub: string, dom: string, obj: string, act: string): Promise<boolean> {
    if (!this.enforcer) {
      throw new Error("CasbinEnforcer not initialized. Call init() first.");
    }
    return this.enforcer.removePolicy(sub, dom, obj, act);
  }

  async addRoleForUser(user: string, role: string, domain: string): Promise<boolean> {
    if (!this.enforcer) {
      throw new Error("CasbinEnforcer not initialized. Call init() first.");
    }
    return (this.enforcer as any).addRoleForUserInDomain(user, role, domain);
  }

  async deleteRoleForUser(user: string, role: string, domain: string): Promise<boolean> {
    if (!this.enforcer) {
      throw new Error("CasbinEnforcer not initialized. Call init() first.");
    }
    return (this.enforcer as any).deleteRoleForUserInDomain(user, role, domain);
  }

  async getRolesForUser(user: string, domain: string): Promise<string[]> {
    if (!this.enforcer) {
      throw new Error("CasbinEnforcer not initialized. Call init() first.");
    }
    return this.enforcer.getRolesForUserInDomain(user, domain);
  }

  async getUsersForRole(role: string, domain: string): Promise<string[]> {
    if (!this.enforcer) {
      throw new Error("CasbinEnforcer not initialized. Call init() first.");
    }
    return this.enforcer.getUsersForRoleInDomain(role, domain);
  }
}
