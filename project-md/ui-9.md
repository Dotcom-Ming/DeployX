## /[org]/billing - 计费页

### 顶部 Tabs：Overview / Plans / Invoices / Payment Methods

### Overview Tab

#### 当前套餐卡片（大卡片，主色边框）
- 套餐名 + 价格 + 周期
- 下次扣款日期
- Manage / Upgrade / Cancel 按钮

#### 用量进度卡片（4 个并列）
每个卡片：
- 指标名 + 已用 / 总额（如 "234 GB / 1 TB"）
- Progress 进度条（接近上限变黄/红）
- 预计本月用量（基于趋势）
- 详细图表入口

#### 用量趋势区
- 时间范围选择
- AreaChart 多指标叠加
- 按项目维度的堆叠柱状图

#### 超额提醒设置
- Switch：启用超额预警
- 阈值滑块（80% / 100% / 自定义）
- 通知方式 Checkbox（Email / Slack / Webhook）

### Plans Tab

#### 套餐对比卡片（3 列）
Hobby / Pro / Enterprise
- 价格大字 + 周期
- Feature 列表（带 Check 图标）
- CTA 按钮（当前套餐显示 "Current Plan"）
- Pro 卡片有 "Most Popular" Badge + 边框高亮

#### 计费周期切换（月付/年付，年付省 17%）
Toggle 在卡片顶部

#### Feature 详细对比 Table
横向：套餐，纵向：功能分类（含 ✓/✗/具体数值）

### Invoices Tab
Table：发票号 / 日期 / 金额 / 状态 Badge / Download PDF / View

### Payment Methods Tab
- 已绑定卡片列表（卡 Logo + 末四位 + 过期日 + 默认标识）
- Add Payment Method 按钮（Stripe Elements 集成）
- 账单地址表单

### 升级流程 Dialog
- 选择新套餐
- 显示价格变动（按比例计算 Proration）
- 输入支付信息（Stripe Checkout）
- 确认 → 立即生效 + 发送收据

请使用 Card, Tabs, Progress, Table, Switch, Slider, Dialog 等。
输出完整代码 + 所有子组件。
