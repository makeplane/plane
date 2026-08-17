# TestCopilot — 本 fork 要做什么

> 作者：**tuner**。这是我在 Plane v1.4.1 上的自研层。官方 Plane 是项目管理壳；测试能力的唯一真相源是绑定的测试 git 仓，不在本仓、也不在 Issue 里。
>
> 打开本仓用 Cursor 开发时：**先读本文 + [`docs/testhub/PLAN.md`](docs/testhub/PLAN.md)**。官方开发命令仍见根 [`AGENTS.md`](AGENTS.md)。
>
> 对外产品名是 **TestCopilot**。代码、URL、Django app 仍用 `testhub`（additive overlay，方便继续 merge 官方 tag）。

## 一句话目标

每个 Plane **Project** 绑定 **一个测试 git 仓库 + 一个 branch**，把该仓里已实现的东西可视化（apps、api_objects、action words、pytest、`.feature` 等），并在白名单内触发仓里已有 CLI（造数、dump_ddl、跑测）。Issue / Cycle 继续管缺陷和任务。

## 两仓分工（不要焊成一个 monorepo）

| 仓                     | 路径                                                     | 职责                                                                                |
| ---------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **本仓（Plane fork）** | `C:\dev\repo\plane` 分支 `testcopilot/v1.4.1`            | 绑定、catalog 快照、UI、Job、失败链到 Issue                                         |
| **测试平台仓**         | 由 Project 绑定的 git 仓（本地常见 `TESTHUB_HOST_REPO`） | 六层资产 + `python -m apps.*` / `packages.action_words`；另补 `apps/index_platform` |

领域逻辑（SQL、造数、Gherkin）**不搬进本仓**。本仓只编排、展示、跑白名单命令。

## 绑定规则

`Project` ↔ `repo_url` + `branch`（一对一）。例：项目 A → `https://git.example/项目A.git` → `main`。

## 本仓硬约束（合上游用）

- 新增独立 Django app `plane.testhub` + 独立前端目录；**尽量 additive**
- **不改** Issue / Cycle 语义；失败只创建/链接 Issue，不把用例双写进 Issue
- 社区版 `apps/web/app/routes/extended.ts` 是空数组，侧栏入口做成**尽量小的 adapter 补丁**
- 禁止在 API 容器里任意 `subprocess`；执行走旁路 Runner，命令必须来自白名单
- 密钥不进 git、不进 Job 日志；破坏性操作默认 dry-run
- 吸收官方修复：`git fetch upstream --tags` 后 `git merge <稳定tag>`；不要在 `preview` 上堆自研提交

## 落地节奏（本仓）

| 阶段   | 内容                                                                     |
| ------ | ------------------------------------------------------------------------ |
| **P0** | `ProjectTestRepo` 绑定；sync 测试仓；总览六层计数                        |
| **P1** | 可视化：feature / pytest / api_objects / action words / DDL 索引（只读） |
| **P2** | 白名单 Job：`action_words`（含 db_seed）、已登记 apps（dump_ddl 等）     |
| **P3** | behave / pytest 跑测；失败一键开 Issue                                   |
| **P4** | recorder、xmind、多 Runner、webhook 自动 sync                            |

P0 fork 卫生已完成：`upstream` = makeplane/plane（push 禁用），基线 tag **v1.4.1**。

## 明确不做

- 不在 Plane DB 里保存 `.feature` / pytest 作为主副本
- 不把测试仓的 `.cursor` skill/agent 搬进 Web
- 不重写 `packages.db` / 造数 SQL
- 首期：不多 branch 并行绑定、无任意 SQL 控制台、无 recorder 常驻

完整架构、模型、UI 信息架构、风险见 [`docs/testhub/PLAN.md`](docs/testhub/PLAN.md)。
