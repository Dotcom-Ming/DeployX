请帮我初始化前端项目并配置 shadcn/ui：

1. 使用 create-next-app 创建 Next.js 14 项目（TypeScript + Tailwind + App Router + src 目录）
2. 安装并初始化 shadcn/ui (style: "new-york", baseColor: "neutral")
3. 安装以下 shadcn 组件：
   button, card, input, label, textarea, select, checkbox, switch, 
   dialog, sheet, popover, dropdown-menu, command, tooltip, 
   tabs, table, badge, avatar, skeleton, separator, scroll-area,
   alert, alert-dialog, toast, sonner, form, calendar, date-picker,
   navigation-menu, breadcrumb, sidebar, collapsible, accordion,
   progress, slider, radio-group, hover-card, context-menu, toggle, toggle-group

4. 安装额外依赖：
   - framer-motion next-themes lucide-react cmdk
   - zustand @tanstack/react-query
   - react-hook-form @hookform/resolvers zod
   - recharts date-fns
   - geist (字体)

5. 配置 next-themes 实现暗色模式默认 + 切换
6. 配置全局字体 Geist Sans / Geist Mono
7. 设置 tailwind.config.ts 扩展（状态色、动画、字体等）
8. 在 globals.css 中定义完整的 CSS 变量主题

请输出：
- 完整的 package.json
- tailwind.config.ts
- globals.css
- app/layout.tsx（含 ThemeProvider、QueryProvider、Toaster）
- components/providers.tsx
- components/theme-toggle.tsx
