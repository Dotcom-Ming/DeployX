## /[org]/team - 团队管理页

### 顶部
- 标题：Team Members
- 描述：Manage who has access to {orgName}
- 右侧：Invite Members 按钮（打开 Dialog）

### 邀请 Dialog
- Email 输入（多个，回车分隔，Tag 显示）
- Role 选择（Select，含每个角色的描述 Tooltip）
- 项目级权限（可选，多选 Combobox）
- 自定义邀请消息（Textarea）
- 发送按钮 → 成功后 Toast

### 成员列表 Table
列：
- Avatar + Name + Email
- Role（Badge + 下拉编辑，OWNER 不可改）
- Joined（相对时间）
- Last active
- 2FA 状态（绿锁/灰锁）
- 操作（DropdownMenu：Change Role / Remove）

### Pending Invitations 区域
- 折叠 Section（Accordion）
- 待接受邀请列表，可重发或取消

### Roles 配置 Tab（高级）
- 内置角色卡片展示（Owner / Admin / Developer / Viewer / Billing）
  - 每个角色展示权限列表（Checkbox 灰显，不可改）
- Custom Roles（Pro 套餐解锁）
  - "Create Custom Role" 按钮
  - 权限矩阵编辑器：分类（Project / Deployment / Domain / Billing / Settings）× 操作（View / Create / Edit / Delete）

### Audit Log 入口
- 底部链接到 /[org]/audit-log

请使用 Table, Dialog, DropdownMenu, Badge, Avatar, Combobox, Accordion 等。
输出完整代码。
