export declare const PROJECT_CREATE = "project:create";
export declare const PROJECT_READ = "project:read";
export declare const PROJECT_UPDATE = "project:update";
export declare const PROJECT_DELETE = "project:delete";
export declare const PROJECT_DEPLOY = "project:deploy";
export declare const PROJECT_TRANSFER = "project:transfer";
export declare const DEPLOYMENT_CREATE = "deployment:create";
export declare const DEPLOYMENT_READ = "deployment:read";
export declare const DEPLOYMENT_CANCEL = "deployment:cancel";
export declare const DEPLOYMENT_ROLLBACK = "deployment:rollback";
export declare const DEPLOYMENT_PROMOTE = "deployment:promote";
export declare const DOMAIN_CREATE = "domain:create";
export declare const DOMAIN_READ = "domain:read";
export declare const DOMAIN_UPDATE = "domain:update";
export declare const DOMAIN_DELETE = "domain:delete";
export declare const ENV_READ = "env:read";
export declare const ENV_WRITE = "env:write";
export declare const ENV_DELETE = "env:delete";
export declare const BILLING_VIEW = "billing:view";
export declare const BILLING_MANAGE = "billing:manage";
export declare const BILLING_INVOICES = "billing:invoices";
export declare const ORG_READ = "org:read";
export declare const ORG_UPDATE = "org:update";
export declare const ORG_DELETE = "org:delete";
export declare const TEAM_INVITE = "team:invite";
export declare const TEAM_REMOVE = "team:remove";
export declare const TEAM_UPDATE_ROLE = "team:update_role";
export declare const TEAM_LIST = "team:list";
export declare const LOG_READ = "log:read";
export declare const LOG_EXPORT = "log:export";
export declare const SETTINGS_READ = "settings:read";
export declare const SETTINGS_UPDATE = "settings:update";
export declare const TOKEN_CREATE = "token:create";
export declare const TOKEN_READ = "token:read";
export declare const TOKEN_REVOKE = "token:revoke";
export declare const WEBHOOK_CREATE = "webhook:create";
export declare const WEBHOOK_READ = "webhook:read";
export declare const WEBHOOK_UPDATE = "webhook:update";
export declare const WEBHOOK_DELETE = "webhook:delete";
export declare const PERMISSIONS: {
    readonly PROJECT: {
        readonly CREATE: "project:create";
        readonly READ: "project:read";
        readonly UPDATE: "project:update";
        readonly DELETE: "project:delete";
        readonly DEPLOY: "project:deploy";
        readonly TRANSFER: "project:transfer";
    };
    readonly DEPLOYMENT: {
        readonly CREATE: "deployment:create";
        readonly READ: "deployment:read";
        readonly CANCEL: "deployment:cancel";
        readonly ROLLBACK: "deployment:rollback";
        readonly PROMOTE: "deployment:promote";
    };
    readonly DOMAIN: {
        readonly CREATE: "domain:create";
        readonly READ: "domain:read";
        readonly UPDATE: "domain:update";
        readonly DELETE: "domain:delete";
    };
    readonly ENV: {
        readonly READ: "env:read";
        readonly WRITE: "env:write";
        readonly DELETE: "env:delete";
    };
    readonly BILLING: {
        readonly VIEW: "billing:view";
        readonly MANAGE: "billing:manage";
        readonly INVOICES: "billing:invoices";
    };
    readonly ORG: {
        readonly READ: "org:read";
        readonly UPDATE: "org:update";
        readonly DELETE: "org:delete";
    };
    readonly TEAM: {
        readonly INVITE: "team:invite";
        readonly REMOVE: "team:remove";
        readonly UPDATE_ROLE: "team:update_role";
        readonly LIST: "team:list";
    };
    readonly LOG: {
        readonly READ: "log:read";
        readonly EXPORT: "log:export";
    };
    readonly SETTINGS: {
        readonly READ: "settings:read";
        readonly UPDATE: "settings:update";
    };
    readonly TOKEN: {
        readonly CREATE: "token:create";
        readonly READ: "token:read";
        readonly REVOKE: "token:revoke";
    };
    readonly WEBHOOK: {
        readonly CREATE: "webhook:create";
        readonly READ: "webhook:read";
        readonly UPDATE: "webhook:update";
        readonly DELETE: "webhook:delete";
    };
};
//# sourceMappingURL=permissions.d.ts.map