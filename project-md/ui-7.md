请设计 /[org]/projects/[id]/deployments/[did] 部署详情页：

## 布局：左右分栏

### 左侧栏（固定，宽 320px）
- 部署状态卡片：大状态图标 + 状态文字 + 持续时间
- Source 信息：
  - 分支名 + commit hash（mono）+ 复制
  - commit message（多行截断）
  - 作者头像 + 名称
- Build 信息：
  - Started at / Completed at
  - Duration
  - Builder（runtime, region）
- Domains 列表
- 操作按钮组（垂直）：Visit / Inspect / Redeploy / Rollback / Cancel

### 右侧主区（Tabs）

#### Build Logs Tab（核心）
- 终端风格容器：黑底（dark mode）/ 浅灰底（light mode）
- 字体：Geist Mono 13px
- 行号（左侧灰色）+ 时间戳 + 内容
- ANSI 颜色支持
- 折叠分组（▼ Cloning repository / ▼ Installing dependencies / ▼ Building）
  - 每组显示耗时 + 折叠状态
- 底部工具栏：搜索（带匹配高亮）、跳转到错误、下载日志、自动滚动开关
- 错误行红色背景高亮，自动滚动到首个错误
- 实时部署时显示打字机效果 + 闪烁光标

#### Runtime Logs Tab
- 类似 Build Logs，但展示函数运行日志
- 实时通过 WebSocket 推送

#### Source Tab
- 文件树（左）+ 代码预览（右，shiki 高亮）
- 显示构建产物结构

#### Functions Tab
- Serverless Functions 列表
- 每个函数：路径 + region + 调用次数 + 平均耗时

请重点优化日志组件性能：
- 虚拟滚动（react-virtuoso）
- 增量渲染
- 大日志支持（10w+ 行）

输出完整代码。
