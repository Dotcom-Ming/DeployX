// Permission string constants in "resource:action" format

// Project permissions
export const PROJECT_CREATE = "project:create";
export const PROJECT_READ = "project:read";
export const PROJECT_UPDATE = "project:update";
export const PROJECT_DELETE = "project:delete";
export const PROJECT_DEPLOY = "project:deploy";
export const PROJECT_TRANSFER = "project:transfer";

// Deployment permissions
export const DEPLOYMENT_CREATE = "deployment:create";
export const DEPLOYMENT_READ = "deployment:read";
export const DEPLOYMENT_CANCEL = "deployment:cancel";
export const DEPLOYMENT_ROLLBACK = "deployment:rollback";
export const DEPLOYMENT_PROMOTE = "deployment:promote";

// Domain permissions
export const DOMAIN_CREATE = "domain:create";
export const DOMAIN_READ = "domain:read";
export const DOMAIN_UPDATE = "domain:update";
export const DOMAIN_DELETE = "domain:delete";

// Environment variable permissions
export const ENV_READ = "env:read";
export const ENV_WRITE = "env:write";
export const ENV_DELETE = "env:delete";

// Billing permissions
export const BILLING_VIEW = "billing:view";
export const BILLING_MANAGE = "billing:manage";
export const BILLING_INVOICES = "billing:invoices";

// Organization permissions
export const ORG_READ = "org:read";
export const ORG_UPDATE = "org:update";
export const ORG_DELETE = "org:delete";

// Team permissions
export const TEAM_INVITE = "team:invite";
export const TEAM_REMOVE = "team:remove";
export const TEAM_UPDATE_ROLE = "team:update_role";
export const TEAM_LIST = "team:list";

// Log permissions
export const LOG_READ = "log:read";
export const LOG_EXPORT = "log:export";

// Settings permissions
export const SETTINGS_READ = "settings:read";
export const SETTINGS_UPDATE = "settings:update";

// Token permissions
export const TOKEN_CREATE = "token:create";
export const TOKEN_READ = "token:read";
export const TOKEN_REVOKE = "token:revoke";

// Webhook permissions
export const WEBHOOK_CREATE = "webhook:create";
export const WEBHOOK_READ = "webhook:read";
export const WEBHOOK_UPDATE = "webhook:update";
export const WEBHOOK_DELETE = "webhook:delete";

// All permissions grouped by resource
export const PERMISSIONS = {
  PROJECT: {
    CREATE: PROJECT_CREATE,
    READ: PROJECT_READ,
    UPDATE: PROJECT_UPDATE,
    DELETE: PROJECT_DELETE,
    DEPLOY: PROJECT_DEPLOY,
    TRANSFER: PROJECT_TRANSFER,
  },
  DEPLOYMENT: {
    CREATE: DEPLOYMENT_CREATE,
    READ: DEPLOYMENT_READ,
    CANCEL: DEPLOYMENT_CANCEL,
    ROLLBACK: DEPLOYMENT_ROLLBACK,
    PROMOTE: DEPLOYMENT_PROMOTE,
  },
  DOMAIN: {
    CREATE: DOMAIN_CREATE,
    READ: DOMAIN_READ,
    UPDATE: DOMAIN_UPDATE,
    DELETE: DOMAIN_DELETE,
  },
  ENV: {
    READ: ENV_READ,
    WRITE: ENV_WRITE,
    DELETE: ENV_DELETE,
  },
  BILLING: {
    VIEW: BILLING_VIEW,
    MANAGE: BILLING_MANAGE,
    INVOICES: BILLING_INVOICES,
  },
  ORG: {
    READ: ORG_READ,
    UPDATE: ORG_UPDATE,
    DELETE: ORG_DELETE,
  },
  TEAM: {
    INVITE: TEAM_INVITE,
    REMOVE: TEAM_REMOVE,
    UPDATE_ROLE: TEAM_UPDATE_ROLE,
    LIST: TEAM_LIST,
  },
  LOG: {
    READ: LOG_READ,
    EXPORT: LOG_EXPORT,
  },
  SETTINGS: {
    READ: SETTINGS_READ,
    UPDATE: SETTINGS_UPDATE,
  },
  TOKEN: {
    CREATE: TOKEN_CREATE,
    READ: TOKEN_READ,
    REVOKE: TOKEN_REVOKE,
  },
  WEBHOOK: {
    CREATE: WEBHOOK_CREATE,
    READ: WEBHOOK_READ,
    UPDATE: WEBHOOK_UPDATE,
    DELETE: WEBHOOK_DELETE,
  },
} as const;
