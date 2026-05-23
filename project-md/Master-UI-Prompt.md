你是一名资深的前端架构师和产品设计师，擅长 Next.js 14、TailwindCSS 和 shadcn/ui。请帮我为 DeployX（对标 Vercel 的 PaaS 部署平台）设计并实现一套高品质的前端控制台。

## 设计哲学
- 极简主义：黑白灰为主色调，少量强调色（Vercel 风格）
- 信息密度高但不拥挤：参考 Vercel Dashboard、Linear、Railway
- 暗色模式优先（默认），完美支持亮色模式切换
- 流畅微交互：framer-motion 驱动
- 键盘友好：cmd+k 命令面板、快捷键导航

## 技术栈
- Next.js 14 (App Router) + TypeScript (strict mode)
- TailwindCSS 3.4+ + tailwindcss-animate
- shadcn/ui（全量组件）+ Radix UI primitives
- Lucide Icons（图标库）
- framer-motion（动画）
- next-themes（主题切换）
- Zustand（全局状态）+ TanStack Query（服务端状态）
- React Hook Form + Zod（表单与校验）
- Sonner（Toast 通知）
- cmdk（命令面板）
- recharts（图表）
- date-fns（日期处理）

## 设计规范
请严格遵循以下设计 Token：

### 颜色系统（基于 shadcn/ui CSS 变量）
亮色模式：
- background: hsl(0 0% 100%)
- foreground: hsl(0 0% 3.9%)
- primary: hsl(0 0% 9%)
- muted: hsl(0 0% 96.1%)
- border: hsl(0 0% 89.8%)

暗色模式：
- background: hsl(0 0% 3.9%)
- foreground: hsl(0 0% 98%)
- primary: hsl(0 0% 98%)
- muted: hsl(0 0% 14.9%)
- border: hsl(0 0% 14.9%)

状态色：
- success: hsl(142 76% 36%)
- warning: hsl(38 92% 50%)
- error: hsl(0 84% 60%)
- info: hsl(199 89% 48%)

### 字体
- Sans: Geist Sans / Inter
- Mono: Geist Mono / JetBrains Mono（日志、代码、commit hash 使用）

### 间距与圆角
- 圆角统一：rounded-lg (8px) / rounded-md (6px)
- 卡片间距：gap-4 / gap-6
- 容器最大宽度：max-w-7xl

请为我输出完整的项目初始化、布局、所有核心页面组件。
