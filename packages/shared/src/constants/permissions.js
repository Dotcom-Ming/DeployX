"use strict";
// Permission string constants in "resource:action" format
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS = exports.WEBHOOK_DELETE = exports.WEBHOOK_UPDATE = exports.WEBHOOK_READ = exports.WEBHOOK_CREATE = exports.TOKEN_REVOKE = exports.TOKEN_READ = exports.TOKEN_CREATE = exports.SETTINGS_UPDATE = exports.SETTINGS_READ = exports.LOG_EXPORT = exports.LOG_READ = exports.TEAM_LIST = exports.TEAM_UPDATE_ROLE = exports.TEAM_REMOVE = exports.TEAM_INVITE = exports.ORG_DELETE = exports.ORG_UPDATE = exports.ORG_READ = exports.BILLING_INVOICES = exports.BILLING_MANAGE = exports.BILLING_VIEW = exports.ENV_DELETE = exports.ENV_WRITE = exports.ENV_READ = exports.DOMAIN_DELETE = exports.DOMAIN_UPDATE = exports.DOMAIN_READ = exports.DOMAIN_CREATE = exports.DEPLOYMENT_PROMOTE = exports.DEPLOYMENT_ROLLBACK = exports.DEPLOYMENT_CANCEL = exports.DEPLOYMENT_READ = exports.DEPLOYMENT_CREATE = exports.PROJECT_TRANSFER = exports.PROJECT_DEPLOY = exports.PROJECT_DELETE = exports.PROJECT_UPDATE = exports.PROJECT_READ = exports.PROJECT_CREATE = void 0;
// Project permissions
exports.PROJECT_CREATE = "project:create";
exports.PROJECT_READ = "project:read";
exports.PROJECT_UPDATE = "project:update";
exports.PROJECT_DELETE = "project:delete";
exports.PROJECT_DEPLOY = "project:deploy";
exports.PROJECT_TRANSFER = "project:transfer";
// Deployment permissions
exports.DEPLOYMENT_CREATE = "deployment:create";
exports.DEPLOYMENT_READ = "deployment:read";
exports.DEPLOYMENT_CANCEL = "deployment:cancel";
exports.DEPLOYMENT_ROLLBACK = "deployment:rollback";
exports.DEPLOYMENT_PROMOTE = "deployment:promote";
// Domain permissions
exports.DOMAIN_CREATE = "domain:create";
exports.DOMAIN_READ = "domain:read";
exports.DOMAIN_UPDATE = "domain:update";
exports.DOMAIN_DELETE = "domain:delete";
// Environment variable permissions
exports.ENV_READ = "env:read";
exports.ENV_WRITE = "env:write";
exports.ENV_DELETE = "env:delete";
// Billing permissions
exports.BILLING_VIEW = "billing:view";
exports.BILLING_MANAGE = "billing:manage";
exports.BILLING_INVOICES = "billing:invoices";
// Organization permissions
exports.ORG_READ = "org:read";
exports.ORG_UPDATE = "org:update";
exports.ORG_DELETE = "org:delete";
// Team permissions
exports.TEAM_INVITE = "team:invite";
exports.TEAM_REMOVE = "team:remove";
exports.TEAM_UPDATE_ROLE = "team:update_role";
exports.TEAM_LIST = "team:list";
// Log permissions
exports.LOG_READ = "log:read";
exports.LOG_EXPORT = "log:export";
// Settings permissions
exports.SETTINGS_READ = "settings:read";
exports.SETTINGS_UPDATE = "settings:update";
// Token permissions
exports.TOKEN_CREATE = "token:create";
exports.TOKEN_READ = "token:read";
exports.TOKEN_REVOKE = "token:revoke";
// Webhook permissions
exports.WEBHOOK_CREATE = "webhook:create";
exports.WEBHOOK_READ = "webhook:read";
exports.WEBHOOK_UPDATE = "webhook:update";
exports.WEBHOOK_DELETE = "webhook:delete";
// All permissions grouped by resource
exports.PERMISSIONS = {
    PROJECT: {
        CREATE: exports.PROJECT_CREATE,
        READ: exports.PROJECT_READ,
        UPDATE: exports.PROJECT_UPDATE,
        DELETE: exports.PROJECT_DELETE,
        DEPLOY: exports.PROJECT_DEPLOY,
        TRANSFER: exports.PROJECT_TRANSFER,
    },
    DEPLOYMENT: {
        CREATE: exports.DEPLOYMENT_CREATE,
        READ: exports.DEPLOYMENT_READ,
        CANCEL: exports.DEPLOYMENT_CANCEL,
        ROLLBACK: exports.DEPLOYMENT_ROLLBACK,
        PROMOTE: exports.DEPLOYMENT_PROMOTE,
    },
    DOMAIN: {
        CREATE: exports.DOMAIN_CREATE,
        READ: exports.DOMAIN_READ,
        UPDATE: exports.DOMAIN_UPDATE,
        DELETE: exports.DOMAIN_DELETE,
    },
    ENV: {
        READ: exports.ENV_READ,
        WRITE: exports.ENV_WRITE,
        DELETE: exports.ENV_DELETE,
    },
    BILLING: {
        VIEW: exports.BILLING_VIEW,
        MANAGE: exports.BILLING_MANAGE,
        INVOICES: exports.BILLING_INVOICES,
    },
    ORG: {
        READ: exports.ORG_READ,
        UPDATE: exports.ORG_UPDATE,
        DELETE: exports.ORG_DELETE,
    },
    TEAM: {
        INVITE: exports.TEAM_INVITE,
        REMOVE: exports.TEAM_REMOVE,
        UPDATE_ROLE: exports.TEAM_UPDATE_ROLE,
        LIST: exports.TEAM_LIST,
    },
    LOG: {
        READ: exports.LOG_READ,
        EXPORT: exports.LOG_EXPORT,
    },
    SETTINGS: {
        READ: exports.SETTINGS_READ,
        UPDATE: exports.SETTINGS_UPDATE,
    },
    TOKEN: {
        CREATE: exports.TOKEN_CREATE,
        READ: exports.TOKEN_READ,
        REVOKE: exports.TOKEN_REVOKE,
    },
    WEBHOOK: {
        CREATE: exports.WEBHOOK_CREATE,
        READ: exports.WEBHOOK_READ,
        UPDATE: exports.WEBHOOK_UPDATE,
        DELETE: exports.WEBHOOK_DELETE,
    },
};
//# sourceMappingURL=permissions.js.map