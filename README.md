# PiLab

> 面向高校科研与新型研发机构的科研及办公管理模块

**PiLab** 是 [SynlysAI](https://github.com/SynlysAI) 基于开源项目 [Plane](https://github.com/makeplane/plane) 进行的二次开发仓库，目标是成为 [AI4MS](https://ai4ms.xmuzc.com/) 统一研发门户下的科研及办公管理模块。它把课题、任务、里程碑、实验协同、研究报告和日常办公协作放在同一个可追溯的工作空间中，帮助高校院系、重点实验室、新型研发机构和研发团队减少工具割裂与信息断层。

| 入口                 | 链接                                 |
| -------------------- | ------------------------------------ |
| SynlysAI 官网        | <https://synlysai.xmuzc.com/>        |
| AI4MS 统一门户       | <https://ai4ms.xmuzc.com/>           |
| SynlysAI GitHub 组织 | <https://github.com/SynlysAI>        |
| 本仓库               | <https://github.com/SynlysAI/plane>  |
| 上游 Plane 项目      | <https://github.com/makeplane/plane> |

## 项目定位

AI4MS 已经围绕材料研发形成“统一入口、智能分析、材料研发、实验执行、知识沉淀”的产品矩阵。PiLab 在这条链路中承担管理与协同层：

- **研发管理**：以工作空间、项目、模块和周期组织课题、子课题、工作包、里程碑、实验任务、采购事项和论文专利进度。
- **办公协同**：将安全审查、设备维护、会议决议、审批待办、行政事务和跨部门协作转化为可分配、可跟踪、可复盘的工作项。
- **知识沉淀**：以页面和评论承载研究报告、会议纪要、实验注意事项和项目决策，并保留与任务之间的关联。
- **平台融合**：作为 AI4MS 的办公模块，与 SpecLabOS、SpecAgent、PolyAgent 和 RAGPortal 互补，而不是替代这些专业科研系统。

办公模块选型采用 **Plane 迁移与二次开发** 路线，并参考 Huly、OpenProject、Taiga、AppFlowy 等项目在任务、知识库和团队协作上的产品形态。选择 Plane 的原因是它已经提供成熟的工作项、周期、模块、视图、页面、权限和 API 基础，适合在其上叠加科研管理场景。

## 当前状态

| 项目             | 内容                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 当前版本         | `3.0.0`（根 / `apps/web` / `apps/api` / `packages/ui` / `apps/api/pyproject.toml` 同步）                                                                                                     |
| 上游基线         | Plane `1.4.x`                                                                                                                                                    |
| 已交付           | 科研管理 P0（`2.1.0`）、阶段流程与集成 P1（`2.2.0`）、科研测试夹具（`2.3.0`）、系统管理改进（`2.4.0`）、科研目录分级可见（`2.5.0`）、演示组织树单链化（`2.5.1`） |
| 未交付           | P2 扩展与治理、P3 与 AI 结合的能力（AI 评分、辅助写作、智能体调用、记忆共享）                                                                                    |
| 科研模块默认状态 | 关闭。部署级 `RESEARCH_MODULE_ENABLED=0`，Workspace 级 `module_enabled` 默认 `false`                                                                             |

本仓库以 Plane `1.4.x` 为基线完成第一轮私有化改造：替换为 AI4MS 品牌、移除付费套餐与云注册遥测、改用私有 OpenAI 兼容网关，并在此基础上叠加「科研管理模块」。**科研模块是纯增量实现**：开关关闭时不渲染科研导航，Workspace / Project / Work Item / Page / Cycle / Module 仍按上游 Plane 行为工作。

### 已交付：P0 科研管理（`2.1.0`）

需求编号 89 条全部通过验收，详见 [P0 验收报告](docs/research-p0-acceptance-report.md)。

| 能力域           | 说明                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| 组织架构         | 组织树（`ROOT` / `INSTITUTE` / `LAB` / `GROUP` / `TEAM`）、成员科研角色、课题组主 PI、直接导师绑定                   |
| 账号与身份       | AI4MS OIDC 登录，按 `sub` / 邮箱 / `employee_id` 映射身份，可选自动建号                                              |
| 权限基础         | 科研 ACL 六级可见范围（`PRIVATE` → `DIRECT_ADVISOR` → `UNIT` → `ANCESTRY` → `WORKSPACE` → `CUSTOM`），提交人只可收窄 |
| 平台配置         | 科研开关分层、报告默认可见级别、报告模板、附件与文件限制独立配置                                                     |
| 审计基础         | 科研审计事件写入且不可修改、不可删除，管理员可只读查询                                                               |
| 个人科研 Project | 一人一个进行中的科研 Project（可配置允许多项目），支持归档与恢复                                                     |
| 周报 / 月报      | 周期规则、`DRAFT` / `SUBMITTED` / `NEEDS_REVISION` / `ACCEPTED` 状态机、退回原因与历史留痕                           |
| 文件能力         | 图片、PDF 上传与 Markdown 导入，独立大小限制（默认 20 / 100 / 5 MB）                                                 |
| 提交汇总与通知   | 按组织架构的提交情况看板，提交、退回与验收通知                                                                       |
| 办公审批         | 任务审批、采购审批，多级审批、或签 / 会签与逐级留痕                                                                  |
| 科研界面         | 独立科研导航，无权限用户隐藏入口；关闭开关后完全回退到原 Plane 界面                                                  |

### 已交付：P1 科研阶段流程与集成（`2.2.0`）

需求编号 145 条全部有实现落点与测试，详见 [P1 发布说明](docs/research-p1-release-notes.md) 与 [P1 开发 PRD](docs/research-p1-development-prd.md)。

| 能力域           | 说明                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 科研阶段状态机   | 预开题 → 开题 → 中期 → 结题（毕业）四阶段，状态流转与可解释 gate，阶段材料与版本留痕                                       |
| 多人评审         | 直接导师必评、主 PI 参与、最少评审人数与通过比例规则、否决分支、评审版本修订                                               |
| 预开题与文献登记 | 文献登记与状态流转、纳入质量门槛（默认纳入 20 条、最多 100 条）、DOI 去重、批量导入                                        |
| 开题与研究计划   | 10 项开题材料、实验参与要求、代码登记要求、报告模板、管理员代改留痕                                                        |
| 中期检查         | 进展汇总（只读引用实验、代码与报告）、未完成实验说明、汇总快照                                                             |
| 结题与成果登记   | 论文、专利、软件、数据集、奖项等成果登记，研发链条引用清单导出，结题后项目收口为只读                                       |
| 实验条目         | 逐条登记、序号唯一、字段锁定、修改需审批、版本不可变、失败实验归档                                                         |
| 代码仓库登记     | `GITHUB` / `GITLAB` / `GITEA` / `LOCAL_GIT` / `OTHER`，制品关联、快照上传（默认上限 500 MB）、同步降级                     |
| 集成基础层       | 连接配置、统一引用模型、权限映射、超时与缓存、降级为链接、外部调用日志与健康检查                                           |
| 已有系统对接     | RAGPortal / WeKnora 知识条目、SpecLabOS 运行记录与数据资产、SmartAccess 设备执行、Poly_Agent 研发项目、Spec_Agent 分析结果 |
| 思维链 / 研发链  | 全流程时间线（文献、阶段流转、评审、报告、实验、代码、成果、外部引用）、筛选与引用清单导出                                 |

### 尚未交付

- **P2**：课题组进度与风险看板、更多审批类型与流程配置、响应式移动网页、权限渗透与大数据量优化、审计导出、管理员与使用文档。
- **P3（暂缓）**：AI 创新性评分、AI 辅助研究计划、论文写作辅助、人机回环、智能体调用与调用审计、课题组主 PI 记忆共享。

P2 / P3 的范围与启动前置条件见 [科研管理 PRD 与路线图](docs/research-management-prd-roadmap.md)。

## 科研模块功能地图

所有入口只有在模块开关打开、且当前用户具备对应科研角色时才渲染。

| 入口         | 路径                                       | 说明                                    |
| ------------ | ------------------------------------------ | --------------------------------------- |
| 科研总览     | `/{workspace}/research`                    | 模块状态与快捷入口                      |
| 周报 / 月报  | `/{workspace}/research/reports`            | 报告列表、编辑、Markdown 导入、附件     |
| 提交汇总     | `/{workspace}/research/reports/summary`    | 按组织架构查看提交情况（管理员）        |
| 科研 Project | `/{workspace}/research/projects`           | 一人一项目，可进入项目级科研工作台      |
| 阶段流程     | `.../projects/{projectId}/stages`          | 四阶段材料、gate 结果与流转记录         |
| 文献调研     | `.../projects/{projectId}/literature`      | 文献登记、纳入门槛与批量导入            |
| 实验记录     | `.../projects/{projectId}/experiments`     | 实验条目、修订审批与版本历史            |
| 代码登记     | `.../projects/{projectId}/code`            | 仓库、制品与快照                        |
| 成果登记     | `.../projects/{projectId}/outcomes`        | 结题成果与研发链条引用                  |
| 时间线       | `.../projects/{projectId}/timeline`        | 思维链 / 研发链全流程时间线             |
| 评审工作台   | `/{workspace}/research/reviews`            | 待我评审、评审版本与修订                |
| 办公审批     | `/{workspace}/research/approvals`          | 任务审批、采购审批与审批历史            |
| 组织设置     | `/{workspace}/research/settings/org`       | 组织树、成员角色、课题组主 PI、导师关系 |
| 报告模板     | `/{workspace}/research/settings/templates` | 周报 / 月报与阶段材料模板               |
| 身份映射     | `/{workspace}/research/settings/identity`  | OIDC 身份绑定与解绑记录                 |
| 平台配置     | `/{workspace}/research/settings/platform`  | 子开关、默认可见级别、文件限制与门槛    |
| 审计查询     | `/{workspace}/research/audit`              | 只读审计事件查询                        |
| 集成配置     | `/{workspace}/research/integrations`       | 外部系统连接、健康状态、引用与调用日志  |

## AI4MS 集成架构

AI4MS 作为统一入口连接材料研发、实验管理和科研及办公管理；Plane 通过二次开发承接科研与办公协同，并与已有专业模块保持清晰边界。**身份链路与 P1 集成基础层已经落地**，外部系统一律按“只保存引用、不复制正文与原始文件”的方式对接。

| 模块            | 当前定位                                       | 与 Plane 的关系                                            | 状态                      |
| --------------- | ---------------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| AI4MS           | 统一入口、用户管理、权限治理和应用导航         | 通过 OIDC 建立统一身份链路与身份映射                       | 已实现（`2.1.0`）         |
| SpecAgent       | GPC、NMR、IR、Raman、LCMS 等谱学智能分析       | 分析结果作为外部引用回填实验、材料与成果上下文             | 已实现引用对接（`2.2.0`） |
| PolyAgent       | 高分子材料研发、计算任务、垂类算法与证据链     | 研发项目、任务与结果进入课题、阶段材料与研发链             | 已实现引用对接（`2.2.0`） |
| RAGPortal       | 知识库文档上传与检索门户                       | 知识条目按源系统 ACL 检索并引用，Plane 不自建索引与门户    | 已实现引用对接（`2.2.0`） |
| SpecLabOS       | 实验设备、工作流编排、任务运行、日志和数据资产 | 运行记录与数据资产以引用形式关联实验条目，不保存原始数据   | 已实现引用对接（`2.2.0`） |
| PiLab | 科研及办公管理模块                             | 承接任务、周期、模块、页面、任务审批、采购审批、报告和复盘 | 已交付 P0 / P1            |
| 算力系统        | 平台基础支撑能力                               | 提供计算资源，并参与 `sub` / 邮箱 / 工号驱动的用户身份映射 | 随 AI4MS 身份链路对接     |

### 用户身份映射与统一登录

登录链路（P0 已实现，未配置 OIDC 时前端不渲染 SSO 入口，本地账号登录保持可用）：

1. 用户登录 AI4MS，由 AI4MS Identity/SSO 发起统一认证。
2. 通过 OAuth2/OIDC 将身份上下文传递给 PiLab。
3. 根据 `sub`、邮箱或 `employee_id` 查找已有身份映射。
4. 已绑定时直接完成登录；未绑定时按管理员策略建立映射或自动创建账号（`OIDC_AUTO_PROVISION_USERS`，默认关闭）。

| 身份字段      | 目标用途       | 说明                                             |
| ------------- | -------------- | ------------------------------------------------ |
| `sub`         | 稳定身份标识   | OAuth2/OIDC 主体 ID，作为长期映射主键            |
| 邮箱          | 用户识别与通知 | 作为辅助匹配条件，需处理同一邮箱多身份或变更场景 |
| `employee_id` | 机构人事身份   | 面向高校和新型研发机构的工号、学工号或人员编号   |

身份映射的绑定、解绑与自动创建都会写入审计记录。自动创建、邮箱冲突和身份合并由管理员策略控制，避免因多个来源标识不一致而误合并账号。

### 外部系统引用与降级

每个 Workspace 在「科研 → 集成配置」中维护一套外部系统连接，配置项包含 `base_url`、认证方式（`HMAC` / `BEARER` / `OIDC_CLIENT` / `NONE`）、超时、缓存与降级模式（降级为链接或隐藏）。安全约定：

- 数据库只保存密钥的**引用名**（`credential_ref`），明文密钥仅存在于后端环境变量或密钥管理系统，接口只回显“是否已配置”。
- 外部系统不可用时读取请求返回降级结果（`degraded` 与 `degraded_reason`），写入请求快速失败，Plane 主流程不受影响。
- 每次调用写入调用日志，包含操作、耗时、返回码与请求 ID，便于审计与排障。

### 科研过程记录与汇报

科研记录划分为四类工作场景，均已具备对应的数据结构与界面：

- **论文调研**：沉淀文献阅读、方法对比、实验想法和可引用证据。
- **课题研究**：管理开题、中期、结题、Fellow 评审、毕业等课题节点材料。
- **日常工作汇报**：承载实验记录、周报、月报和异常处理进展。
- **关键节点汇报**：汇总开题、中期、毕业、评审等需要提交或评审的材料。

这些记录不是孤立表单，而是通过 Plane 页面、工作项、评论、阶段材料、时间线和知识引用保持知识沉淀与信息同步。

实验数据链路沿用“仪器日志 → 透视表 → 用户日志”的既有分工：设备侧保留原始事实，SpecLabOS 负责结构化和关联任务、样本、设备与时间，Plane 保存科研管理口径的实验条目与外部引用，自动记录与人工补充并行保留。

### Mobile Web 交付策略（P2）

移动端优先采用响应式手机网页，而不是首版开发原生 App：

- **低成本**：复用当前 React Router/Vite Web 技术栈、路由与组件体系，不为了移动端单独维护一套客户端。
- **快覆盖**：通过链接直接访问，免安装、免应用市场审核，适合科研和行政人员快速接入。
- **全兼容**：同一套部署可服务 SaaS 与自托管用户，不引入额外的分发差异。

## 科研与办公场景

### 课题与项目全生命周期

- 以工作空间对应学院、实验室、研究中心或课题组。
- 以项目对应纵向课题、横向项目、平台建设专项或内部改进项目。
- 以模块拆分子课题、工作包和交付专题。
- 以周期管理开题、实验、中期检查、结题、验收和成果转化节点。
- 以科研阶段流程承载预开题 → 开题 → 中期 → 结题的 gate、材料与评审。
- 通过视图跟踪负责人、优先级、截止时间、状态和风险事项。

### 实验与设备协同

- 在 Plane 中创建实验需求、样品准备、设备预约、安全确认和结果复盘任务。
- 实验条目逐条登记，字段修改需审批并保留不可篡改的版本历史。
- 引用 SpecLabOS 运行记录与数据资产、SmartAccess 设备执行记录，Plane 不保存原始数据副本。
- 通过透视表将仪器日志转换为用户可读、可检索的实验日志，并关联负责人、课题和样本上下文。
- 为设备维护、耗材采购、异常处理和安全整改建立独立工作流。

### 研究报告与知识证据

- 用页面与阶段材料组织开题报告、实验方案、阶段总结、结题报告和成果转化材料。
- 引用 RAGPortal / WeKnora 知识条目、Poly_Agent 研发结果与 Spec_Agent 分析结果，保留来源与权限口径。
- 保留报告与任务、负责人、时间和来源证据的关联，支持复盘与审计。
- 将重复出现的经验沉淀为实验室规范、操作手册和项目模板。

### 日常办公协作

- 管理会议决议、待办事项、责任人和完成时间。
- 跟踪采购申请、合同评审、报销材料、行政审批和材料交付。
- 建立设备维护、安全检查、实验室巡检和隐患整改任务。
- 管理论文投稿、专利申请、成果报奖、数据归档和知识转移。

## 实施路线图

| 阶段 | 目标                                                                                       | 当前状态                 |
| ---- | ------------------------------------------------------------------------------------------ | ------------------------ |
| P0   | 系统管理与项目管理：组织、身份、权限、审计、个人科研 Project、周报月报、办公审批、科研界面 | 已交付（`2.1.0`）        |
| P1   | 科研阶段流程与已有系统集成：阶段 gate、多人评审、文献、实验、代码、成果、时间线            | 已交付（`2.2.0`）        |
| P2   | 扩展、治理与发布：高级看板、更多审批类型、响应式移动端、治理与文档                         | 规划中                   |
| P3   | 与 AI 结合的能力：创新性评分、辅助研究计划、论文写作辅助、智能体调用、记忆共享             | 暂缓，前置条件确认后启动 |

路线图遵循“先保留 Plane 稳定基础，再叠加科研场景，最后完成跨系统证据链”的原则。每期范围与验收标准见 [科研管理 PRD 与路线图](docs/research-management-prd-roadmap.md)。

## 快速开始与本地开发

### 环境要求

- Docker Engine 已启动。
- Node.js `>= 22.22.0`。
- pnpm `11.10.0`，可通过 Corepack 启用。
- PostgreSQL 14+ 和 Redis 6.2.7+，本地开发可由 Docker Compose 提供。
- 建议至少 12 GB 可用内存。

### 初始化并启动

```bash
./setup.sh
docker compose -f docker-compose-local.yml up -d
pnpm dev
```

启动后访问：

- Web 应用：<http://localhost:3000>
- 实例管理端：<http://localhost:3001/god-mode/>

### 启用科研模块

科研模块默认关闭，需要按“部署级开关 → Workspace 开关 → 子开关 → 外部系统连接”的顺序逐层打开。变量模板见 [`apps/api/.env.example`](apps/api/.env.example)。

1. 在 `apps/api/.env` 打开部署级开关，并按需配置 AI4MS OIDC：

   ```env
   RESEARCH_MODULE_ENABLED=1
   OIDC_ISSUER_URL=
   OIDC_CLIENT_ID=
   OIDC_CLIENT_SECRET=
   OIDC_REDIRECT_URI=
   OIDC_AUTO_PROVISION_USERS=0
   ```

2. 以 Workspace 管理员身份进入「科研 → 平台配置」，打开 `module_enabled`，再按需打开 `stage_enabled` / `experiment_enabled` / `code_enabled` / `integration_enabled`。
3. 进入「科研 → 组织设置」建立组织树并分配科研角色；进入「科研 → 集成配置」逐个外部系统填写 `base_url`、认证方式与密钥引用名，并执行健康检查。
4. 通过 `GET /api/research/health/` 确认模块状态、文件限制与 OIDC 配置是否生效。

常用门槛默认值（可被 Workspace 配置覆盖）：文献纳入门槛 `RESEARCH_LITERATURE_MIN_INCLUDED=20`、评审最少人数 `RESEARCH_STAGE_MIN_REVIEWERS=3`、通过比例 `RESEARCH_STAGE_PASS_RATIO=0.5`、代码快照上限 `RESEARCH_CODE_SNAPSHOT_MAX_MB=500`。完整清单与回滚方式见 [P1 发布说明](docs/research-p1-release-notes.md)。

### 常用命令

| 命令               | 说明                      |
| ------------------ | ------------------------- |
| `pnpm dev`         | 启动所有开发服务          |
| `pnpm build`       | 构建所有应用和包          |
| `pnpm check`       | 运行格式、Lint 和类型检查 |
| `pnpm check:lint`  | 运行 OxLint               |
| `pnpm check:types` | 运行 TypeScript 类型检查  |
| `pnpm fix`         | 自动修复格式和 Lint 问题  |

### 测试

后端测试在独立 Docker 测试栈中运行：

```bash
# 全量
docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests

# 子集
docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit
```

科研用例位于 `apps/api/plane/tests/unit/research` 与 `apps/api/plane/tests/contract/app/test_research_*.py`，覆盖阶段 gate、文献门槛、实验留痕、集成降级、安全与性能回归。更多约定见 [`apps/api/tests/RUNNING_TESTS.md`](apps/api/tests/RUNNING_TESTS.md) 与 [`apps/api/plane/tests/TESTING_GUIDE.md`](apps/api/plane/tests/TESTING_GUIDE.md)。

## 文档索引

| 文档                                                                                  | 内容                                  |
| ------------------------------------------------------------------------------------- | ------------------------------------- |
| [`docs/README.md`](docs/README.md)                                                    | 文档总览、维护约定与阅读顺序          |
| [`research-management-prd-roadmap.md`](docs/research-management-prd-roadmap.md)       | 产品需求、生态边界与 P0–P3 分期路线图 |
| [`research-p0-development-prd.md`](docs/research-p0-development-prd.md)               | P0 开发规格（含实现回写记录）         |
| [`research-p0-development-prd-review.md`](docs/research-p0-development-prd-review.md) | P0 开发规格评审与实现复核结论         |
| [`research-p0-acceptance-report.md`](docs/research-p0-acceptance-report.md)           | P0 验收方法与逐条验收结论             |
| [`research-p0-release-notes.md`](docs/research-p0-release-notes.md)                   | P0 发布、开关与回滚说明               |
| [`research-p1-development-prd.md`](docs/research-p1-development-prd.md)               | P1 开发规格（含实现回写记录）         |
| [`research-p1-development-prd-review.md`](docs/research-p1-development-prd-review.md) | P1 开发规格评审与实现复核结论         |
| [`research-p1-release-notes.md`](docs/research-p1-release-notes.md)                   | P1 发布、开关、环境变量与回滚说明     |
| [`linting.md`](docs/linting.md)                                                       | 代码风格与静态检查约定                |

## 生态与文档

| 资源             | 链接                                      |
| ---------------- | ----------------------------------------- |
| SpecLabOS        | <https://github.com/SynlysAI/SpecLabOS>   |
| SpecAgent        | <https://github.com/SynlysAI/Spec_Agent>  |
| PolyAgent        | <https://github.com/SynlysAI/Poly_Agent>  |
| RAGPortal        | <https://github.com/SynlysAI/RAGPortal>   |
| SmartAccess      | <https://github.com/SynlysAI/SmartAccess> |
| Plane 用户文档   | <https://docs.plane.so/>                  |
| Plane 开发者文档 | <https://developers.plane.so/>            |
| 贡献指南         | [`CONTRIBUTING.md`](CONTRIBUTING.md)      |

## 许可证与上游致谢

本仓库基于 [makeplane/plane](https://github.com/makeplane/plane) 二次开发，继续遵循 [GNU Affero General Public License v3.0](LICENSE.txt)。二次开发和对外部署应保留上游版权声明、许可证声明和来源信息，并遵守 AGPL-3.0 对应的源代码提供义务。

感谢 Plane 上游团队和所有贡献者提供了成熟的开源项目管理基础。
