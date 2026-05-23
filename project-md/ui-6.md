请设计 /[org]/projects/[id] 项目详情页（默认 Project 标签）：

### 页面顶部
- 项目名（大标题）+ Production 域名（带"复制"+"打开"按钮）
- 右侧：Visit 按钮 + Settings 按钮

### Production Deployment 卡片（核心展示）
- 左侧：截图缩略图（aspect-video，悬浮放大）
- 右侧：
  - 状态 Badge：Ready
  - Domain 列表（每个域名一行，可一键管理）
  - Source：分支图标 + 分支名 + commit hash + commit message
  - Deployed by：头像 + 用户名 + 相对时间
  - Build Duration: 1m 23s
- 底部按钮组：Visit / Inspect / Rollback / Promote / ...更多

### Deployments Tab 内容
Table 展示所有部署：
列：Status / Environment(Production/Preview Badge) / Source / Commit / Author / Duration / Created
- 顶部 Filter：按状态、分支、环境
- 行点击进入部署详情
- 支持无限滚动加载

### Domains Tab
- 已配置域名列表（Card 列表）
  - 域名 + SSL 状态（绿锁 Verified / 黄色 Pending / 红色 Invalid）
  - DNS 配置指引（CNAME 值，复制按钮）
  - Remove 按钮（带 AlertDialog 确认）
- 添加域名表单（顶部）

### Environment Variables Tab
- 三栏 Tabs：Production / Preview / Development
- KV 表格，Value 默认隐藏（Eye 图标切换）
- 支持加密标识、批量导入 .env、按目标环境复制

### Logs Tab
- 实时运行时日志（黑色终端风格）
- 顶部过滤器：时间范围 / 日志级别 / 搜索关键词 / Function 选择
- 自动滚动 Toggle、Pause、Download、Clear 按钮
- 每条日志：时间戳 (mono 灰色) + 级别 Badge + 内容（高亮关键词）

### Analytics Tab
- 时间范围选择器（DatePicker Range）
- 4 个指标卡：Visitors / Page Views / Bounce Rate / Avg Duration
- 折线图：访问量趋势
- 柱状图：Top Pages / Top Referrers / Countries（World Map 可选）

请使用 Tabs, Table, Card, Badge, Tooltip, Progress, Skeleton, AlertDialog, Sheet 等组件。
输出完整代码 + 子组件分文件组织。
