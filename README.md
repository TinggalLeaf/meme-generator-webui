# 表情包制作工坊 (Meme Generator WebUI)

基于 **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui** 的在线表情包制作应用。

> 说明：目标文档要求使用 Vite，但本仓库已初始化为 Next.js 16 脚手架（且 `AGENTS.md` 为 Next 专属）。经确认，本项目沿用 **Next.js 16** 技术栈实现，测试仍使用 **Vitest + React Testing Library + MSW**（与目标文档一致），包管理使用 **pnpm**。

## 功能

- 左侧模板列表：调用 `GET /memes/keys`，支持按 key / 名称搜索。
- 选择模板后自动加载 `GET /memes/{key}/info` 与 `GET /memes/{key}/preview`。
- 参数编辑区：
  - 文本：根据 `info.texts` 动态生成输入框，支持添加 / 删除。
  - 图片：多选上传、缩略图预览、按 `info.images.max` 限制数量。
  - `args`：JSON 编辑器，提供「格式化 JSON」按钮与实时校验提示。
- 生成：`POST /memes/{key}/`（multipart/form-data），收集 `images / texts / args`。
- 结果预览：兼容「二进制图片」与「JSON 带 url」两种返回；支持点击放大、下载、重新生成。
- 顶部版本号（`GET /meme/version`）、刷新按钮、加载骨架屏、Toast 错误提示、422 校验错误解析。

## 健壮性（兼容未定义 schema 的后端）

- `/memes/keys` 同时兼容 `string[]` 与 `{ key, name }[]`。
- `/memes/{key}/info` 缺失字段时回退到通用模式（文本可自由添加，args 默认 `{"user_infos": []}`）。
- 预览 / 生成接口根据 `Content-Type` 自动判断图片二进制或 JSON（`url` / `data` 字段）。

## 环境要求

- Node.js 18+
- pnpm

## 安装与运行

```bash
pnpm install
pnpm dev          # 开发服务器，默认 http://localhost:3000
pnpm build        # 生产构建（next build）
pnpm start        # 运行生产构建
```

### 后端代理

API 基址为 `http://192.168.10.103:2233`。前端通过同源的 `/api/meme/*` 与 `/api/memes/*` 路由（`app/api/meme/[...path]`、`app/api/memes/[...path]`）转发到后端，由 `lib/server-proxy.ts` 在 **服务端** 用 `fetch({ redirect: "follow" })` 完成。这样后端返回的 307 重定向会在服务端跟随，浏览器始终只与本应用同源通信，从而避免后端未配置 CORS 时的跨域失败。可用环境变量覆盖目标：

```bash
MEME_API_BASE=http://your-backend:port pnpm dev
```

> 说明：之所以不用 `next.config.ts` 的 `rewrites`，是因为它会把后端带绝对 `Location` 的 307 直接透传给浏览器，导致浏览器跨域直连后端而被 CORS 拦截。

## 测试

测试基于 **Vitest + React Testing Library + MSW**，完全模拟后端，不依赖真实服务。

```bash
pnpm test         # 一次性运行全部测试（vitest run）
pnpm test:watch   # 监听模式
```

测试覆盖（共 47 个用例，全部通过）：

- **API 封装**：`getVersion / getKeys / getMemeInfo / getMemePreview / generateMeme` 的请求与响应解析，含 422 → `ValidationError`、其他错误 → `ApiError`。
- **工具函数**：`normalizeKeys`、`formatJson`、`tryParseJson`、`buildFormData`、`parseValidationErrors`、`resolveDefaultArgs`、`resolveImageResult`（blob / json）。
- **组件**：模板列表渲染与搜索过滤、文本输入增删、图片上传与删除、args 格式化、选择模板后加载 info + preview、生成按钮发送正确 FormData、422 错误提示。
- **集成**：`MemeStudio` 全流程（选择模板 → 加载信息/预览 → 填写 → 生成 → 结果展示）。

## 目录结构

```
app/
  layout.tsx          # 根布局：Providers(QueryClient) + Toaster
  page.tsx            # 入口，渲染 <MemeStudio/>
  providers.tsx       # TanStack Query 的 QueryClientProvider
  globals.css         # Tailwind v4 + shadcn 设计令牌（含深色模式）
components/
  ui/                 # shadcn/ui 基础组件（button/input/textarea/card/tabs/
                       #   scroll-area/label/separator/skeleton/dialog/sonner）
  meme/               # 业务组件（studio / template-list / text-fields /
                       #   image-uploader / args-editor / preview-panel）
lib/
  api.ts              # fetch 封装（含错误类型 ApiError / ValidationError）
  meme-utils.ts       # 兼容性解析与工具函数
  types.ts            # 数据模型
test/                 # 测试与 MSW 服务（setup.ts / server.ts / lib / components）
```

## 技术栈对照

| 类别     | 技术                                          |
| -------- | --------------------------------------------- |
| 框架     | Next.js 16 (App Router) / React 19            |
| 语言     | TypeScript                                    |
| 样式     | Tailwind CSS v4 + shadcn/ui                   |
| 数据获取 | TanStack Query (React Query)                  |
| 表单     | React Hook Form + Zod（类型/校验工具）         |
| HTTP     | fetch（兼容 blob/json 响应）                   |
| 测试     | Vitest + React Testing Library + MSW          |
| 包管理   | pnpm                                          |
