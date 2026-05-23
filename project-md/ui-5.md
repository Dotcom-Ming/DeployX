## /[org]/projects - 项目列表页

### 顶部工具栏
- 左侧：搜索框（Input + Search 图标，带 ⌘F 快捷键提示）
- 中部：Filter 下拉（按 Framework / Status / Member）
- 右侧：视图切换（Grid / List Toggle）+ Sort 下拉 + Add New 按钮

### 项目卡片（Grid 视图）
3 列响应式网格，每个 Card：
- 顶部：彩色渐变条（按 framework 着色）
- 项目名（粗体大字）+ 私有/公开 Badge
- 主域名（mono 字体，可一键复制）
- Framework 图标 + 名称
- 最后部署：状态点 + commit hash + 相对时间
- 底部：协作者头像组（AvatarGroup，最多 5 个 + "+N"）
- hover 时显示右上角 ... DropdownMenu（Settings / Delete / Transfer）

### 空状态
插画 + "Import your first project" CTA

## /[org]/projects/new - 导入项目页

### 步骤 1：选择 Git 提供商
三个大卡片：GitHub / GitLab / Bitbucket，未连接显示 "Connect" 按钮

### 步骤 2：仓库列表
- 左侧：仓库列表（Command 风格，可搜索过滤）
  - 每个 item：仓库名 + 私有图标 + 最后更新时间 + Import 按钮
- 右侧：选中后显示项目配置面板

### 步骤 3：配置项目（右侧面板）
表单字段：
- Project Name（自动填充，可编辑）
- Framework Preset（Select：Next.js / Nuxt / Vite / Astro / Remix / Static / Other）
  - 选中后自动填充以下字段
- Root Directory（带 Browse 按钮）
- Build Command (Mono Input)
- Output Directory
- Install Command
- Environment Variables（KV 编辑器，可批量粘贴 .env）
- Deploy 按钮（大 + 主色）

### 部署中状态
点击 Deploy 后切换到全屏部署进度页：
- 阶段时间线（Cloning → Installing → Building → Deploying → Ready）
- 实时构建日志（黑色背景终端风格，自动滚动）
- 完成后展示部署 URL + 截图预览

请使用 shadcn 的 Card, Command, Form, Tabs, Accordion 等组件。
输出完整代码。
