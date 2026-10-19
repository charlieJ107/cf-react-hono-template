# AGENTS.md

基于 `cf-react-hono-template` 的全栈应用（React SPA + Hono API，npm workspaces）。用模板新建项目后的改名与初始化步骤见 [`README.md`](README.md)。
本文件只记录**已经确认**的约定；尚未拍板的设计不要写进来，也不要当作约定执行。

文档体系遵循 [`docs/coding.md`](docs/coding.md)（spec-driven development 工作约定），开工前先读它和 [`docs/README.md`](docs/README.md)。

## 工作方式

- 一步一步推进：先说明要做什么、改哪些文件，得到确认后再动手；只做被要求的部分。
- 优先使用各工具官方 CLI 的默认产物（create-vite、create-hono、shadcn、kysely init），再做有针对性的调整；不要凭空手写本该由 CLI 生成的配置。
- 只在被要求时提交（commit）或推送；不要运行 `git stash` 等会影响其他工作树的命令。
- 读取 `.env` 时只看需要的变量，不要整体打印（里面有其他 secret）。

## 仓库结构

npm workspaces（Node ≥ 24，npm 自带）：

```
.env / .env.example   项目唯一的环境变量文件（根目录）
docs/                 文档（见 docs/README.md）
frontend/             React SPA（Vite）
backend/              Hono API（主平台：Node + Docker + Postgres；Cloudflare Workers 为备选）
```

- 依赖统一提升到根目录 `node_modules` 与 `package-lock.json`；给某个 workspace 装依赖用 `npm i -w <frontend|backend> <pkg>`，仓库级工具（oxlint、concurrently、vitest）装在根目录。
- workspace 之间不用 `workspace:` 协议，前端以 `"backend": "*"` 依赖后端。

## 常用命令

在仓库根目录执行：

| 用途 | 命令 |
|---|---|
| 安装依赖 | `npm install` |
| 同时启动前后端开发服务器 | `npm run dev`（`[api]` 后端 :3000，`[web]` 前端 :5173） |
| 只启动后端 / 前端 | `npm run dev:api` / `npm run dev:web` |
| 构建全部（含类型检查） | `npm run build` |
| 以生产方式启动后端 | `npm run start`（托管前端需设置 `STATIC_ROOT`） |
| Lint 全仓库 | `npm run lint` |
| 运行全部测试 | `npm test`（只跑一个 workspace：`npx vitest run --project backend` / `--project frontend`） |
| 执行数据库迁移 | `npm run db:migrate` |
| 构建 Docker 镜像 | `docker build -t app .`（运行时 `docker run --env-file .env -p 3000:3000 …`） |

数据库迁移的其他操作和 better-auth 表结构变更流程见 [`docs/backend/runbook.md`](docs/backend/runbook.md)；Cloudflare Workers（备选平台，尚未实现）见 [`docs/deploy/cloudflare.md`](docs/deploy/cloudflare.md)。

一项改动完成前，至少跑通 `npm run lint`、`npm run build`、`npm test`（与 CI 相同，见 `.github/workflows/ci.yml`）。

## 开发服务器

- 端口固定：前端 5173（`strictPort`，OIDC 回调地址依赖它），后端 3000。端口被占用时不要换端口绕过。
- 人类开发者通常自己在终端里跑 `npm run dev`。Agent 启动开发服务器前，先检查 3000 / 5173 是否已被占用；若被占用，说明情况并询问，不要擅自结束别人的进程。
- Agent 自己启动的开发服务器，在任务完成后必须关掉，并确认 3000 / 5173 已释放，然后提醒人类自行启动开发服务器。
- Windows 上强制结束 `concurrently` 父进程不会结束它启动的子进程（Vite、Node）。要按端口或进程树结束（`taskkill /T /F /PID <pid>`），再确认端口确实已释放。

## Lint

- 根目录 `.oxlintrc.json` 是全仓库的基础配置；`frontend/.oxlintrc.json` 通过 `extends` 继承并加上 React 规则。Oxlint 为每个文件自动使用离它最近的 `tsconfig.json` 解析 import，前后端各自的 tsconfig 不需要额外配置。
- 后端核心层（`app.ts` 与 `routes/modules/ports/jobs/auth/db/config/http`）由 `no-restricted-imports` 禁止引用 `infra/`、`runtime/` 和 `node:*`。
- shadcn CLI 生成或照搬自 shadcn 文档的文件（`components/ui/**`、`hooks/use-mobile.ts`、`components/theme-provider.tsx`）不做 lint，也不手改。
- 改完代码后运行 `npm run lint`，**如实汇报**所有 error 和 warning（不要省略、不要只说"通过"）。自己引入的问题要修复；不确定该不该改的，说明原因并询问。不要为了让 lint 变绿而关闭规则、加忽略或 disable 注释，除非已得到确认。

## 技术栈与版本约定

- TypeScript `~7.0.2`（Go 原生实现）。TS 7 已移除 `baseUrl`，路径别名只写 `paths`。
- Lint 用 Oxlint；typescript-eslint 不支持 TS 7，不要引入 ESLint。
- 前端：React 19、Vite 8、Tailwind CSS 4（`@tailwindcss/vite`）、shadcn（style `base-vega`，底层 Base UI）。
  - Base UI 组件没有 `asChild`，用 `render` prop（例如 `render={<Link to="…" />}`）。
  - React Router 8 只作为路由库使用（`createBrowserRouter` + `RouterProvider`），不用 framework mode，不用 loader/action。
  - 数据请求见下方"前后端契约"中的 API 调用标准。登录会话用 better-auth 自带的 `authClient.useSession()`，不走 SWR。
  - 主题用 shadcn 官方 Vite 方案的 `components/theme-provider.tsx`，不用 `next-themes`。
- 后端：Hono、`@hono/node-server`、Kysely + `pg`、zod、better-auth 1.7。开发时用 `node --watch --import tsx`（`tsx watch` 在 `concurrently` 下无法启动）。

## 前端结构

- 路由：`/` 由 `GuestOnly` 包裹（已登录直接跳 `/home`）；受保护页面由 `RequireAuth` 包裹（未登录跳 `/` 并带 `returnTo`），其下是懒加载的 `AppShell`，落地页不下载 shell 代码。
- `src/app/`：路由、`brand.ts`、导航注册表 `nav.ts`、`shell/`（由 shadcn `sidebar-07` 区块改造）。
- `src/features/<feature>/`：按功能组织（如 `features/me/`：`/me` 个人资料页）；`src/api/` 是 hono client、`request()`、`ApiError` 与 SWR 配置；`src/platform/` 提供宿主相关能力（目前只有 `apiBaseUrl`）。

## 后端架构边界

后端 TypeScript 拆成三个项目，`tsconfig.json` 只做 references（`tsc -b` 一次构建全部）：

| 配置 | 范围 | 约束 |
|---|---|---|
| `tsconfig.core.json` | `src/{app,routes,modules,ports,jobs,auth,db,config,http}`（不含测试） | 只有 `ES2023` + `WebWorker`，`types: []`：只能用 Web 标准 API |
| `tsconfig.node.json` | `src/**`（排除 `src/runtime/cloudflare`、`src/infra/d1` 与测试） | Node 类型，输出到 `dist/` |
| `tsconfig.tools.json` | `auth.ts`、`.config/*.ts`、`db/migrations/*.ts`、`vitest.config.ts`、`src/**/*.test.ts` | 仅类型检查，不输出 |

- 核心层不得引用 `infra/`、`runtime/` 或任何平台 API（`process`、`Buffer`、`node:*`、Workers 绑定）。数据库驱动、KV、对象存储等由 `runtime/<platform>/` 组装后注入（`createApp(deps)`）。
- Cloudflare 相关目前只有占位：`backend/wrangler.jsonc`（绑定均已注释）、`src/runtime/cloudflare/README.md`，以及刻意自行维护（而非引入第三方包）的 D1 Kysely 方言 `src/infra/d1/kysely-d1.ts`。不要用第三方 D1 方言包替换它。
- import 使用 NodeNext 风格的 `.js` 扩展名。
- 后台作业（如 Agent 运行）不绑定在 HTTP 请求生命周期上：采用"队列投递 + 我们自己的步骤状态机"，平台只负责投递"继续执行作业 X"。

## 前后端契约

- 前端通过 Hono RPC 调用后端：`import type { AppType } from "backend/app"`，配合 `hono/client` 的 `hc<AppType>()`。前端直接读取后端源码的类型，不依赖构建产物。
- 后端用 zod 定义请求 schema；第三方协议（如 AI SDK 的流协议）沿用其自身定义，不另造契约。

### 后端：错误格式

- `/api` 下所有非 2xx 的 JSON 响应都是 `ErrorBody`：`{ code, message, issues? }`。`code` 是稳定的大写下划线标识（客户端据此分支），`message` 是给人看的英文，`issues` 放结构化细节（如 zod issues）。类型从 `backend/app` 导出。
- 业务错误一律 `throw new AppError(status, code, message, issues?)`（`src/http/errors.ts`），由 `createApp` 上的 `onError` 统一转成响应；不要在路由里手写错误 JSON。
- 内置的 code：`INVALID_REQUEST`（400，校验失败）、`UNAUTHORIZED`（401）、`NOT_FOUND`（404，未匹配的 `/api` 路由）、`HTTP_<status>`（Hono `HTTPException`）、`INTERNAL_ERROR`（500，未预期异常；真实错误只记日志，不返回给客户端）。
- 请求校验用 `validate(target, schema)`（`src/http/validate.ts`，包装 `@hono/zod-validator`），保留 RPC 的输入类型。
- 需要登录的路由用 `requireAuth(auth)` 中间件（`src/http/require-auth.ts`），之后通过 `c.var.session` 取 `{ user, session }`。

### 前端：API 调用标准（hono client + SWR）

- 所有调用都写成 `request(api.<path>.$<method>(...))`（`src/api/client.ts`）：基于 hono 的 `parseResponse`，返回带类型的成功响应体；非 2xx 抛出 `ApiError`（`status`、`code`、`message`、`issues`）；网络错误原样抛出。
- 读取用 SWR，每个功能一个薄 hook，key 就是 API 路径：`useSWR("/api/me", () => request(api.me.$get()))`（参考 `features/me/use-me.ts`）。其他地方用 `mutate("<路径>")` 刷新。
- 写操作直接 `await request(api.….$post(...))`，成功后 `mutate` 相关 key。不要在 hono client 之上再包通用请求层。
- 全局 SWR 配置在 `src/api/swr-config.ts`：4xx 不重试，网络错误和 5xx 重试。

## 测试

- Vitest：根目录 `vitest.config.ts` 用 projects 汇总两个 workspace。后端配置在 `backend/vitest.config.ts`（node 环境），前端测试配置在 `frontend/vite.config.ts` 的 `test` 字段（jsdom，复用 Vite 的别名和插件）。
- 测试文件与源码放在一起：`*.test.ts` / `*.test.tsx`。后端路由测试用 `createApp(deps)` 注入假的依赖，再调用 `app.request()`，不连真实数据库；前端组件测试用 Testing Library，用 `vi.stubGlobal("fetch", …)` 模拟后端。
- 只写有实际验证价值的测试，不写示例或占位测试。

## 部署与 CI

- 根目录 `Dockerfile` 构建单一镜像：同时提供 API 和前端静态文件（`STATIC_ROOT`），以 `node` 用户运行，带 `/api/health` 健康检查。运行时配置全部来自环境变量；镜像不执行迁移。
- `.github/workflows/ci.yml`：push 到 master 和所有 PR 时运行 lint、build、test，并验证 Docker 镜像能构建。部署流水线尚未建立。

## 配置与环境变量

- 项目只有一份 `.env`，在仓库根目录。后端开发脚本、kysely-ctl 配置、better-auth CLI 都从根目录读取它；已经存在的环境变量（CI、shell）优先于文件。前端 `envDir` 也指向根目录，只有 `VITE_` 前缀的变量会进入前端代码。
- 后端所有环境变量只在 `backend/src/config/env.ts` 里用 zod 解析：`parseEnv(source)` 返回类型化的 `Env`，使用处直接取值。不要为某个模块再自造一层 config 类型去重新打包环境变量。
- `parseEnv` 不读 `process.env`，由调用方传入（Node 传 `process.env`，Cloudflare 传 Worker `env`）。
- 新增变量时同步更新根目录 `.env.example`（只放占位值，不放真实 secret）。
- 开发时 `BETTER_AUTH_URL` 必须是浏览器访问的前端地址 `http://localhost:5173`（请求经 Vite 代理到后端），OIDC 回调地址为 `<BETTER_AUTH_URL>/api/auth/callback/oidc`。
- 密钥轮换用 `BETTER_AUTH_SECRETS=<version>:<secret>,...`（最新在前）；设置后 `BETTER_AUTH_SECRET` 只用于解密旧格式数据。

## 认证（better-auth）

- 配置唯一来源：`backend/src/auth/options.ts` 的 `createAuthOptions(db, dbType, env)`，运行时与 CLI 共用，保证 `auth generate` 看到的插件集合与生产一致。
- 插件：`admin`、`apiKey`（`@better-auth/api-key`）、`bearer`、`genericOAuth`（providerId `oidc`，provider 由 `OIDC_DISCOVERY_URL` / `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` 配置，三者齐全才启用登录）；开启 `session.cookieCache`（5 分钟）；关闭邮箱密码登录。前端用 `authClient.signIn.social({ provider: "oidc" })` 登录（1.7 已移除 `genericOAuthClient`）。前后端的 providerId 常量必须一致。
- `rateLimit` 使用内存存储，不建 `rateLimit` 表。
- `backend/auth.ts` 只给 better-auth CLI 用（CLI 自动发现 `./auth.ts`），应用代码不得 import 它。
- 不使用 `auth init`（Hono 下无法生成可用代码）和 `auth migrate`（会绕过 Kysely 迁移时间线）。

## 数据库与迁移

- 只有一条迁移时间线：`backend/db/migrations/`，由 kysely-ctl 管理，只用 `kysely_migration` 表记录。better-auth 只负责用 `auth generate` 生成差异 SQL（放在 `backend/db/sql/`，与迁移同名），由迁移原样执行。完整流程见 [`docs/backend/runbook.md`](docs/backend/runbook.md)。
- 迁移及其 `.sql` 在任何环境执行过后即冻结，要改就新建迁移。
- 没有影子库：`DATABASE_URL` 在开发环境指向开发库，在生产环境指向生产库。
- 生产环境的迁移由 CI 部署脚本执行，不由应用进程或运行时镜像执行。
- 本地开发使用本机共享的 Postgres 实例（例如容器 `dev-postgres`，`postgres:18`，`127.0.0.1:5432`），每个项目一个开发库。新建库或用户用 `docker exec dev-postgres psql -U postgres -c "…"`，不要改容器环境变量，也不要为单个项目另起 Postgres 容器。
