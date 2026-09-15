# Plane for AI4MS 科研管理 P1 发布说明

| 项目     | 内容                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| 版本     | `2.1.0` → `2.2.0`（向下兼容的新功能，按次版本号递增）                              |
| 日期     | 2026-09-16                                                                         |
| 上游依据 | [`research-p1-development-prd.md`](./research-p1-development-prd.md)               |
| 评审依据 | [`research-p1-development-prd-review.md`](./research-p1-development-prd-review.md) |
| 迁移范围 | `0131` ~ `0139`（新增表 / 新增可空字段 / 新增索引，无破坏性变更，均可回滚）        |

## 1. 本版本交付范围

P1 十四个开发阶段全部完成：

| 阶段  | 交付内容                                                           | 主要落点                                                                             |
| ----- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| P1-A1 | 四阶段状态机、可解释 gate、阶段材料与版本留痕                      | `db/models/research/stage.py`、`services/stage_gate.py`、`services/stage_service.py` |
| P1-A2 | 多人评审：直接导师必评、主 PI 分支、最少人数、比例与否决、评审版本 | `db/models/research/review.py`、`services/review_rules.py`                           |
| P1-B1 | 预开题与文献登记：状态流转、纳入质量、数量门槛、DOI 去重、批量导入 | `db/models/research/literature.py`、`views/literature.py`                            |
| P1-B2 | 开题与研究计划：10 项材料、实验参与、代码登记、模板、管理员代改    | `views/stages.py`、`views/stage_overrides.py`、`utils/templates.py`                  |
| P1-B3 | 中期检查：进展汇总（只读引用）、未完成实验说明、汇总快照           | `services/progress.py`、`views/progress.py`                                          |
| P1-B4 | 结题与成果登记、研发链条引用清单导出、项目收口与只读沉淀           | `db/models/research/outcome.py`、`views/outcomes.py`、`utils/chain.py`               |
| P1-C1 | 实验条目：序号唯一、字段锁定、修订审批、版本不可变、失败归档       | `db/models/research/experiment.py`、`services/experiment_service.py`                 |
| P1-C2 | 代码仓库登记、制品关联、快照上传与大小限制、同步降级               | `db/models/research/code.py`、`views/code.py`                                        |
| P1-D1 | 集成基础层：连接配置、统一引用模型、权限映射、降级、缓存、调用日志 | `db/models/research/integration.py`、`services/integrations/`                        |
| P1-D2 | 知识库对接：知识条目检索与引用、归属标注、降级为链接               | `services/integrations/adapters.py`、`views/integrations.py`                         |
| P1-D3 | 湿实验与设备对接：SpecLabOS 运行记录回传、数据资产引用、待补标记   | `services/lab_ingest.py`                                                             |
| P1-D4 | 研发平台对接：Poly_Agent / Spec_Agent 引用、结果多版本保留         | `views/integrations.py`（reference sync）                                            |
| P1-E1 | 思维链 / 研发链与全流程时间线、筛选、引用清单导出                  | `services/chain.py`、`views/chain.py`                                                |
| P1-E2 | 导航与开关整合、安全与性能回归、版本号同步、发布与回滚说明         | 本文档、侧边栏与项目内导航、回归测试                                                 |

P1 期间未引入任何 AI 能力（评分、辅助写作、智能体调用、记忆共享均留在 P3）。

## 2. 环境变量清单（默认值即"未配置可安全运行"）

```env
# 科研模块总开关（部署级，默认关闭）
RESEARCH_MODULE_ENABLED=false

# P1 子开关（Workspace 配置可覆盖）
RESEARCH_STAGE_ENABLED=true
RESEARCH_EXPERIMENT_ENABLED=true
RESEARCH_CODE_ENABLED=true
RESEARCH_INTEGRATION_ENABLED=true

# P1 门槛默认值（ResearchStageRequirement 与 Workspace 配置优先）
RESEARCH_LITERATURE_MIN_INCLUDED=20
RESEARCH_LITERATURE_MAX_ENTRIES=100
RESEARCH_STAGE_MIN_REVIEWERS=3
RESEARCH_STAGE_PASS_RATIO=0.5
RESEARCH_CODE_SNAPSHOT_MAX_MB=500

# 集成基础层
RESEARCH_INTEGRATION_TIMEOUT_SECONDS=3
RESEARCH_INTEGRATION_CACHE_TTL_SECONDS=300
RESEARCH_INTEGRATION_DEGRADED_MODE=link_only

# 外部系统（仅后端；未配置时对应入口降级为链接或不可用）
RAGPORTAL_BASE_URL=
RAGPORTAL_AUTH_SECRET=
WEKNORA_BASE_URL=
WEKNORA_AUTH_SECRET=
SPECLABOS_BASE_URL=
SPECLABOS_AUTH_SECRET=
SMARTACCESS_BASE_URL=
SMARTACCESS_AUTH_SECRET=
POLY_AGENT_BASE_URL=
POLY_AGENT_AUTH_SECRET=
SPEC_AGENT_BASE_URL=
SPEC_AGENT_AUTH_SECRET=
```

私有仓库与外部系统的凭证只以"引用名"形式进入数据库（`credential_ref`），
明文仅在环境变量或密钥管理系统中；接口只回显"是否已配置"。

## 3. 发布流程

```text
备份数据库
  → 执行迁移 0131–0139（可回滚）
  → 部署后端（所有 P1 子开关保持关闭）
  → 部署前端（科研入口隐藏）
  → 冒烟：通用功能回归 + 科研接口不可用性 + P0 科研功能回归
  → 试点 Workspace 打开 stage_enabled
  → 依次打开 experiment_enabled / code_enabled / integration_enabled
  → 逐个打开外部系统连接并按系统验证引用与降级
  → 业务方验收 → 全量或分批扩大开关范围
```

顺序约束：`stage_enabled` 先于 `experiment_enabled` 与 `code_enabled`；
`integration_enabled` 打开前必须完成连接配置与健康检查；每次打开新开关前，
先验证关闭状态回到上一版本行为。

## 4. 开关层级

| 层级         | 位置                                                                            | 作用                 |
| ------------ | ------------------------------------------------------------------------------- | -------------------- |
| 全局总开关   | `RESEARCH_MODULE_ENABLED`                                                       | 部署级熔断，默认关闭 |
| Workspace    | `WorkspaceResearchSetting.module_enabled`                                       | 按 Workspace 灰度    |
| P0 子开关    | `org_enabled` / `report_enabled` / `approval_enabled`                           | P0 功能域            |
| P1 子开关    | `stage_enabled` / `experiment_enabled` / `code_enabled` / `integration_enabled` | P1 功能域            |
| 集成连接开关 | `ExternalSystemConnection.is_enabled`（按系统）                                 | 单系统灰度与熔断     |

## 5. 回滚策略

| 问题类型        | 回滚动作                                                     |
| --------------- | ------------------------------------------------------------ |
| 阶段流程异常    | 关闭 `stage_enabled`，阶段数据保留，报告与审批不受影响       |
| 实验 / 代码异常 | 关闭 `experiment_enabled` / `code_enabled`，回落阶段流程可用 |
| 外部系统异常    | 关闭对应连接或 `integration_enabled`，引用降级为链接         |
| 影响通用功能    | 关闭全局开关，必要时回滚后端镜像                             |
| 迁移升级失败    | 回滚到 `0130`，恢复数据库备份                                |
| 数据一致性问题  | 封存受影响的阶段 / 实验并置只读，人工核对后按修订流程纠正    |

要求：`StageTransition`、`StageReviewRevision`、`ExperimentRecordVersion`、
`StageMaterialVersion` 与科研审计事件在任何回滚场景下都不删除。

## 6. 验证结论（发布门禁）

| 项             | 结果                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------- |
| 后端测试       | `pytest plane/tests` 全量 **1029 passed**（unit + contract + smoke，7m45s）                        |
| 科研专项       | 科研相关套件（unit/research + contract/app）594 passed，覆盖 145 条 P1 需求编号                    |
| 安全回归       | Page 旁路、快照下载、跨 Workspace、凭证回显、审计不可改 —— 全部通过（`test_research_security.py`） |
| 性能回归       | gate / timeline / progress 在大数据量下均低于预算（`test_research_performance.py`）                |
| 类型与静态检查 | `apps/web` 类型检查通过；OxLint 0 error；后端 Ruff 通过（新增文件无告警）                          |
| 国际化         | 中英文 key 集合一致，无缺失 key                                                                    |
| 版本号         | 根 / `apps/web` / `apps/api` / `packages/ui` 全部为 `2.2.0`                                        |

## 7. 变更记录

| 版本 | 日期       | 变更内容                                      | 作者 |
| ---- | ---------- | --------------------------------------------- | ---- |
| v1.0 | 2026-09-16 | 首版：P1 十四个阶段交付、开关、发布与回滚说明 | —    |
