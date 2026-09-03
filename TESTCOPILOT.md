# TestCopilot — 本 fork 要做什么

> 作者：**tuner**。这是我在 Plane v1.4.2 上的自研层。官方 Plane 是项目管理壳；测试能力的唯一真相源是绑定的 git 仓，不在本仓、也不在 Issue 里。
>
> 打开本仓用 Cursor 开发时：**先读本文 + [`docs/testhub/PLAN.md`](docs/testhub/PLAN.md)**。官方开发命令仍见根 [`AGENTS.md`](AGENTS.md)。
>
> 对外产品名是 **TestCopilot**。执行相关代码、URL、Django app 仍用 `testhub`。数据源绑定走独立 app `plane.gitsync`。

## 一句话目标

每个 Plane **Project** 对应一个被测系统。项目在 **配置** 里登记一条或多条本地 git 数据源，再把产品模块分别绑上去：

- **Formulation** — 场景（`.feature`）、可复用操作（action words，可执行）、API、Page objects 与 DDL（活文档）
- **环境** — SUT 地址与数据源模板（不含密钥）
- **TestCopilot** — 引用 Formulation 的 feature，记录测程、跑白名单 CLI、常用 SQL、形成报告
- **作业** — 汇总各页触发的白名单异步任务结果

Issue / Cycle 继续管缺陷和任务。**不要**因为文件在同一个仓里，就把说明书、连接信息和跑测塞进同一个产品模块。

## 两仓分工（不要焊成一个 monorepo）

| 仓                     | 路径                                                                         | 职责                                                                                                                                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **本仓（Plane fork）** | `C:\dev\repo\plane` 分支 `testcopilot/v1.4.1`                                | 配置绑定、约定扫描、UI、Job、测程 overlay、失败链到 Issue                                                                                                                                                                                                             |
| **测试 / 规格 git 仓** | 由配置模块的 `ProjectGitRemote` 指向（`local_mount` 或公开 HTTPS `git_url`） | 六层资产 + `packages.action_words`（BDD/pytest 组合）。Plane 只展示并运行测试仓 `@plane_*` 注册项：`@plane_app` → `python -m apps.*`；`@plane_db_seed` 等 → `python -m packages.action_words run`。本地维护工具（dump_ddl / recorder / init_repo / index_ai）不上平台 |

领域逻辑（SQL、造数、Gherkin）**不搬进本仓**。本仓只绑定、按约定展示、编排白名单命令。

## 绑定规则

项目在侧栏 **配置** 登记数据源（`local_mount` 或公开 HTTPS `git_url`）。每个产品模块通过 `ModuleBinding` 指向其中 **一条** 数据源。三条绑定可以指向同一条 Remote（常见：测试平台仓同时满足三种约定），也可以分仓。

文件夹靠约定发现（如 Formulation 读 `./*/feature/`），**不把路径配进数据库**。

测程等平台状态存在 TestCopilot overlay 表，**不回写 git**。

远程 `git_url` 支持公开 HTTPS clone/fetch（testhub-runner `POST /v1/git-sync`，工作副本在 `/opt/gitsync/clones`）。私有仓与 `credential_ref` 尚未实现。API 容器不跑 git。

## 本仓硬约束（合上游用）

- 新增独立 Django app `plane.testhub` / `plane.gitsync` + 独立前端目录；**尽量 additive**
- **不改** Issue / Cycle 语义；失败只创建/链接 Issue，不把用例双写进 Issue
- 社区版 `apps/web/app/routes/extended.ts` 是空数组，侧栏入口做成**尽量小的 adapter 补丁**
- 禁止在 API 容器里任意 `subprocess`；执行走旁路 Runner，命令必须来自白名单
- 密钥不进 git、不进 Job 日志、不经通用 files API 读取 `env_local.py`；Admin 可经专用接口编辑 workdir 副本。破坏性操作默认 dry-run
- 吸收官方修复：`git fetch upstream --tags` 后 `git merge <稳定tag>`；不要在 `preview` 上堆自研提交

## 落地节奏（本仓）

| 阶段    | 内容                                                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **P0**  | `ProjectTestRepo` 绑定；sync 测试仓；总览六层计数                                                                                          |
| **P1**  | 可视化：feature / pytest / api_objects / action words / DDL 索引（只读）                                                                   |
| **P1b** | 项目成分拆分：Formulation / 环境 / TestCopilot；gitsync 分模块绑定                                                                         |
| **P2**  | 白名单 Job：硬编码 `index_platform`；`@plane_app` 走 `apps.*`；Formulation action words 走 `packages.action_words`；本地 dump_ddl 不上平台 |
| **P3**  | behave / pytest 跑测；失败一键开 Issue                                                                                                     |
| **P4**  | recorder、xmind、多 Runner、webhook 自动 sync                                                                                              |

P0 fork 卫生已完成：`upstream` = makeplane/plane（push 禁用），基线 tag **v1.4.2**（已从 v1.4.1 合入）。

## 明确不做

- 不在 Plane DB 里保存 `.feature` / pytest / env 正文作为主副本
- 不把测试仓的 `.cursor` skill/agent 搬进 Web
- 不重写 `packages.db` / 造数 SQL
- 不在 Formulation 做 Gherkin 编辑器
- 首期：无任意 SQL 控制台、无 recorder 常驻

完整架构、模型、UI 信息架构、风险见 [`docs/testhub/PLAN.md`](docs/testhub/PLAN.md)。
