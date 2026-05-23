你是一名资深的全栈架构师和云原生工程师。请帮我设计并实现一个对标 Vercel 的 PaaS 云端应用部署平台，名称暂定为 "DeployX"。

## 核心目标
构建一个支持 Git 集成、自动构建、Serverless 部署、自定义域名、实时日志、计费系统和企业级权限管理的云端应用部署平台。

## 技术栈要求
- 前端：Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui + Zustand
- 后端：NestJS + TypeScript + Prisma ORM + PostgreSQL + Redis
- 容器与编排：Docker + Kubernetes (K8s) + Knative (Serverless 运行时)
- 构建系统：BuildKit / Kaniko (容器化构建)
- 网关：Traefik / Nginx + Cert-Manager (自动 HTTPS)
- 对象存储：MinIO / S3 兼容存储
- 消息队列：BullMQ (基于 Redis) / Kafka
- 监控：Prometheus + Grafana + Loki (日志聚合)
- 计费：Stripe API + 自研用量计量服务
- 认证：JWT + OAuth2 (GitHub/GitLab/Google) + Casbin (RBAC/ABAC)

## 核心功能模块
1. 用户与组织管理（含 Team、Workspace、成员邀请）
2. Git 仓库集成（GitHub/GitLab/Bitbucket Webhook）
3. 项目与部署管理（Preview Deployment / Production Deployment）
4. 自动构建与发布流水线（CI/CD Pipeline）
5. 域名与 SSL 证书管理
6. 环境变量与密钥管理（含加密存储）
7. 实时部署日志与运行日志
8. 用量计量（带宽、构建分钟数、函数调用、存储）
9. 计费与订阅（免费版 / Pro / Enterprise）
10. 权限管理（RBAC + 资源级权限）
11. 监控告警与审计日志

请按照"领域驱动设计 (DDD)"和"微服务"思想进行模块拆分，并提供完整的目录结构、数据模型、API 设计和核心代码实现。
