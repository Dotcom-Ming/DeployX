请设计 DeployX 的整体 Dashboard 布局，参考 Vercel 风格：

## 顶部导航栏 (TopBar)
固定顶部，高度 56px，包含：
- 左侧：DeployX Logo + 组织切换器（Popover + Command 实现，可搜索切换组织和创建组织）
- 中部：面包屑导航（Org > Project > Deployment）
- 右侧：
  - Feedback 按钮
  - Changelog 按钮（带未读小红点）
  - 帮助文档下拉
  - 通知铃铛（Popover 展示通知列表）
  - 主题切换
  - 用户头像下拉菜单（账户、设置、API Token、登出）

## 顶部 Tab 导航栏（Vercel 风格次级导航）
高度 48px，根据当前层级动态显示：
- 组织级：Overview / Projects / Deployments / Activity / Usage / Settings
- 项目级：Project / Deployments / Analytics / Logs / Storage / Settings
使用 underline 风格的高亮指示器（有滑动动画）

## 命令面板 (CMD+K)
基于 cmdk 实现全局快速操作：
- 跳转项目、部署、设置
- 创建新项目
- 切换组织
- 主题切换
- 文档搜索

## 全局快捷键
- ⌘K: 命令面板
- ⌘B: 折叠侧边栏（如有）
- G then P: 跳转项目列表
- G then D: 跳转部署列表

## 内容区
最大宽度 max-w-7xl mx-auto，左右 padding px-6，顶部 py-8

请使用 shadcn/ui 的 NavigationMenu、Command、Popover、DropdownMenu 等组件实现。
输出 components/layout/ 下的全部组件代码。
