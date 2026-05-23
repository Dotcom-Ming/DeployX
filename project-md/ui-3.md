请设计 /login 和 /signup 页面：

## 布局
- 全屏居中卡片布局，背景为微妙的 grid 纹理或渐变
- 左侧：Logo + 平台介绍（仅大屏显示）
- 右侧：登录/注册卡片（max-w-md）

## 登录页
卡片内容：
- 标题："Log in to DeployX"
- 三个 OAuth 按钮（GitHub / GitLab / Google），带各自图标
- "Or continue with email" 分隔线（Separator）
- Email + Password 表单（react-hook-form + zod 校验）
- "Forgot password?" 链接
- 提交按钮（loading 时显示 Spinner）
- 底部："Don't have an account? Sign up"

## 注册页
- 类似布局，多 Name 字段
- 邮箱验证流程提示
- 服务条款 Checkbox

## 交互细节
- 按钮 hover 有微妙 scale 动画
- 表单错误用 shadcn FormMessage 红色提示
- 提交成功 sonner toast + 跳转
- 登录失败 Alert 组件展示错误

使用 shadcn 的 Card, Form, Input, Button, Separator, Alert 组件。
输出 app/(auth)/login/page.tsx 和 app/(auth)/signup/page.tsx 完整代码。
