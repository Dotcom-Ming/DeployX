请设计 /[org] 概览页：

## 页面结构

### 顶部欢迎区
- 标题："Welcome back, {userName}"
- 副标题：组织名 + 当前套餐 Badge
- 右侧：Import Project 主按钮 + New Project 下拉

### 数据概览卡片（4 列网格）
每个卡片包含：
- 标签 + 数值（大字体）+ 趋势小图（mini sparkline）
- 同比变化百分比（绿色↑/红色↓）
指标：
1. Total Projects
2. Deployments (Last 7 days)
3. Bandwidth Used (含进度条占比 / 总额度)
4. Build Minutes Used

### 最近部署列表（Card 包裹的 Table）
列：状态图标 / 项目名 / commit message / 分支 / 触发者头像 / 时长 / 时间
- 状态用 Badge：Building (蓝色 + spinner)、Ready (绿色)、Error (红色)、Canceled (灰色)
- 行 hover 高亮，点击进入详情
- 空状态：插画 + "No deployments yet"

### 项目快速访问网格（最近 6 个项目）
每个 Card：
- 项目名 + framework 图标
- 最新部署状态点 + 域名（截断）
- 最近部署时间
- hover 时显示快捷操作（重新部署、查看日志）

### 用量趋势图（Recharts AreaChart）
- 7天/30天 切换 Tabs
- 双 Y 轴：带宽（GB）+ 请求数

请使用 Card, Table, Badge, Tabs, Avatar, Progress, Tooltip 等 shadcn 组件。
所有数据用 mock 生成，结构清晰可替换为 API。
输出完整 page.tsx 与子组件。
