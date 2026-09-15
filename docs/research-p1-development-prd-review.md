# Plane for AI4MS 科研管理 P1 开发 PRD 评审报告

| 项目     | 内容                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| 评审对象 | [`research-p1-development-prd.md`](./research-p1-development-prd.md) v1.0（Draft / 待评审）                   |
| 评审日期 | 2026-09-15                                                                                                    |
| 评审范围 | 需求编号完整性、数据模型可行性、接口契约自洽性、阶段划分与验收可测性、与代码基线的兼容性                      |
| 评审结论 | **有条件通过**：可进入分阶段开发；§4 的 14 项一致性问题与 §5 的 15 项实现层决策随开发同步回写 PRD（§10 清单） |
| 代码基线 | `develop`，工作区版本 `2.1.0`，迁移最新 `0130_research_approvals.py`（已实测核对，见 §2）                     |

## 1. 评审方法

| 维度         | 做法                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| 结构核对     | 逐章核对 §0–§15 与附录 A/B/C 是否闭合，章节间交叉引用是否可解析                 |
| 编号覆盖核对 | 抽取全部 `P1-<模块>-<序号>` 编号，与 §3 需求表、§7 阶段表、§13 验收清单三方对照 |
| 模型可行性   | 对 §4 每张表的字段、约束、索引逐条核对 Django 5.2 / PostgreSQL 15 可表达性      |
| 接口自洽性   | 对 §5 路径逐条核对方法、语义、错误码与 §3 需求的一一对应                        |
| 基线兼容性   | 在工作区实测版本号、迁移编号、路由前缀、既有开关/ACL/审计/附件实现              |
| 可测性       | 核对每条需求的验收要点能否落为 `pytest` 用例（unit / contract 两类）            |

## 2. 代码基线核对结果

| PRD 声明（§2.1）   | 实测结果                                                                                        | 结论 |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---- |
| 工作区版本 `2.1.0` | 根 `package.json`、`apps/web`、`apps/api`、`packages/ui` 均为 `2.1.0`                           | 一致 |
| 迁移最新 `0130`    | `apps/api/plane/db/migrations/` 最新为 `0130_research_approvals.py`                             | 一致 |
| 后端科研模块路径   | `apps/api/plane/research/{views,serializers,permissions,utils}` 与 `db/models/research/` 存在   | 一致 |
| 后端路由前缀       | `plane/urls.py:20` 在既有 `api/` 之前 include `plane.research.urls`，前缀 `/api/research/`      | 一致 |
| 前端科研模块路径   | `core/components/research/`、`core/services/research/`、`core/store/research/` 存在             | 一致 |
| 前端科研路由       | `app/routes/core.ts:120-151` 已注册 11 条 `research/*` 路由，均为追加式                         | 一致 |
| 共享常量 / 类型    | `packages/constants/src/research.ts`（221 行）、`packages/types/src/research.ts`（305 行）      | 一致 |
| 测试入口           | `plane/tests/{unit,contract}/`，含 `unit/research/`、`contract/app/test_research_*.py`          | 一致 |
| P0 复用能力        | `utils/acl.py::check_access`、`utils/audit.py`、`utils/settings.py`、`utils/page_guard.py` 齐备 | 一致 |

补充核对（PRD 未声明但直接影响 P1 实现）：

| 事项                | 实测结果                                                                                    | 影响                                                          |
| ------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 测试运行模式        | `pytest.ini` 使用 `--nomigrations --reuse-db`，测试库由 ORM 建表                            | 部分唯一约束不落库，唯一性必须由应用层兜底（T-01）            |
| 既有上传限制        | `FILE_SIZE_LIMIT` 与 `DATA_UPLOAD_MAX_MEMORY_SIZE` 同为 5MB（`settings/common.py:352,387`） | 快照 500MB 只能走预签名直传，登记接口不得收 multipart（T-05） |
| 科研上传限制        | `RESEARCH_{IMAGE,PDF,MARKDOWN}_MAX_MB` 已独立存在（20/100/5），不污染 `FILE_SIZE_LIMIT`     | 快照上限按同一模式新增 `RESEARCH_CODE_SNAPSHOT_MAX_MB`        |
| 科研子开关          | `utils/settings.py::workspace_research_sections` 目前只返回 `org/reports/approvals`         | P1 需扩展 4 个键，前端 `identity.sections` 同步扩展（T-07）   |
| 审计表              | `ResearchAuditEvent` 只追加，`utils/audit.py` 提供动作/资源类型常量表                       | P1 只需追加常量，不新建表                                     |
| 通知载体            | `Notification.entity_name` 为自由文本；P0 已用 `research_report` / `research_approval`      | 阶段/评审/修订通知沿用同一模式（T-06）                        |
| Page 旁路守卫       | `utils/page_guard.py` 仅识别 `PeriodicReport`，普通 Page 立即返回 `None`                    | P1 扩展为同时识别阶段材料 Page，保持短路（T-04）              |
| Page 模型           | `Page.access` 为 `0=Public / 1=Private`，`owned_by` 必填，经 `ProjectPage` 关联项目         | 阶段材料 Page 的创建口径需固化（G-01）                        |
| 文件资产            | `FileAsset` 已有 `REPORT_ATTACHMENT` 实体类型与 `is_uploaded` 两段式校验                    | 文献 PDF、快照沿用同一链路，新增实体类型即可                  |
| Alembic/Django 版本 | Django 5.2.15、Python 3.12.5（测试容器实测）                                                | `GeneratedField`/部分约束语法均可用                           |

## 3. 结论摘要

1. **需求编号完整且可追溯**。共 145 条需求编号：STG 13、REV 12、LIT 12、OPN 10、MID 8、FIN 8、EXP 14、CODE 10、INT 12、KB 8、LAB 8、RD 7、CHAIN 7、UI 9、COMPAT 7。全文无重复编号、无孤立编号；§3 需求表、§7 阶段覆盖、§13 验收清单三方逐条对应（§8）。
2. **阶段划分可执行**。14 个阶段的工作量合计 164 人日，与 §8 的 14 周排期自洽；A1 → A2 → B1 → B2 → B3 → B4 主链无环，C 组与 D 组按正文依赖补充后仍无环。
3. **模型与接口总体可实现**，但有 14 处文档内部不一致（§4）与 15 处需在实现层固化的技术决策（§5），已逐条给出处理结论。
4. **最大风险是"约束不落库"与"聚合越权"**：前者因 `--nomigrations` 导致部分唯一约束在测试库缺席，必须应用层兜底；后者集中在外部引用缓存与时间线聚合，已给出缓存 key 与过滤口径（T-09、T-10）。
5. **P1 严格排除 AI 能力**：本轮实现不引入任何模型调用、评分或智能体链路，`§1.4` 的排除项在实现中逐条守住。
6. **待确认事项不阻塞开发**：§12 的 13 项全部给出实施默认值（§7），确认后可通过配置收敛，不需要改动数据模型主干。

## 4. 文档一致性问题与处理决定（D 类）

| 编号 | 问题                                                                                                       | 处理决定                                                                                                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | `P1-CHAIN-07`（引用清单导出）在 §7.0 归属 `P1-B4`，但 §7.13（E1）开发内容与 §9.2（E1 必测项）也包含导出    | 导出服务在 B4 交付最小实现（结题口径），E1 扩展为双链筛选口径并复用同一 service；两个阶段各有测试用例，编号只出现一次                                                            |
| D-02 | §7.0 依赖列写 B2 只依赖 B1、B3 只依赖 B2，正文 §7.4/§7.5 要求 B2 需 C2 仓库登记能力、B3 需 C1 实验登记能力 | 以正文为准，实现顺序为 A1 → A2 → C1/C2 基础能力 → B1 → B2 → B3 → B4；§7.0 表格依赖列随本文档回写修订                                                                             |
| D-03 | §1.3 依赖图未画出 C 组 → B 组的隐式依赖                                                                    | 同上，依赖图在回写时补 `C1/C2 → B2/B3` 的虚线依赖                                                                                                                                |
| D-04 | §5.2 给出 `GET/PATCH .../stages/{stageId}/materials/`，集合级 PATCH 与 REST 语义冲突且与明细路径重复       | 集合路径只支持 `GET/POST`；材料编辑只走 `PATCH .../materials/{materialId}/`                                                                                                      |
| D-05 | §5.2 `GET/PATCH .../stage-requirements/` 未给明细路径，PATCH 语义含糊                                      | 实现为 `GET` 列表 + `PATCH` 集合级 upsert（body 为 `items` 数组，支持 `org_unit` 维度），另加 `.../stage-requirements/{id}/` 用于停用                                            |
| D-06 | §4.2 材料状态 `DRAFT/SUBMITTED/ACCEPTED/REJECTED` 未定义驱动事件，§3.4 只说"提交后只读"                    | 材料状态由阶段流转驱动：阶段 `SUBMITTED` → 材料 `SUBMITTED`；`PASSED` → `ACCEPTED`；`NEEDS_REVISION` → `REJECTED`；gate 的 `material_set` 以 `DRAFT/SUBMITTED/ACCEPTED` 计为齐备 |
| D-07 | §3.1 STG-07 要求门槛"可按节点覆盖"，但 §5.2 只给一个无维度集合接口                                         | 门槛 upsert 支持 `org_unit` 维度，唯一约束为 `(workspace, stage, code, org_unit)`；未覆盖时回落 Workspace 默认值                                                                 |
| D-08 | §3.1 预开题默认 gate 含"评审规则满足"，但 §4.2 `requirement_type` 枚举没有对应取值                         | `requirement_type` 增加 `REVIEW_RULE`，由 gate 引擎映射到评审规则判定，不新增数据表                                                                                              |
| D-09 | §4.3 `StageReview.score` 为 0–100 的 DecimalField，但 §3.2 未说明是否必填                                  | 评分可选、缺省为空、不参与通过判定，仅作人工参考（明确非 AI 评分）                                                                                                               |
| D-10 | §4.1 的迁移编号（0131–0138）是规划值，§4.10 又要求按阶段单独提交迁移                                       | 迁移按阶段实际顺延（0131 起）；合入后把实际编号回写到 §4.1 表格                                                                                                                  |
| D-11 | §4.5 `ExperimentRecord.status` 含 `ARCHIVED`，但 §3.7 未定义归档后是否仍可提交/修订                        | `ARCHIVED` 为终态：不可提交、不可修订、不可删除；修订申请仅在 `SUBMITTED` 后且非归档状态可发起                                                                                   |
| D-12 | §3.9 P1-INT-06 与 §5.1 同时允许"降级返回 200"与"返回 424"                                                  | 读取类（检索/详情）返回 `200 + degraded=true`；写入类（建立引用/关联）在源不可用时返回 `424`；两者都带 `source_system` 与 `source_url`                                           |
| D-13 | §6.1 路由为 `/research/integrations`，§7.14 表述为"集成配置纳入科研设置区"                                 | 以 §6.1 为准：路由 `/research/integrations`，侧边栏归入"设置"分组渲染                                                                                                            |
| D-14 | §4.9 未定义 `ResearchProjectProfile.current_stage` 的类型与取值约束                                        | `CharField(16)` 可空，取值限定为阶段枚举；由阶段流转服务在 `enter/pass/reopen` 时维护，不提供直接写入口                                                                          |

## 5. 技术风险与实现层固化决策（T 类）

| 编号 | 风险                                                                               | 固化决策                                                                                                                                                                            |
| ---- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-01 | `--nomigrations` 下部分唯一约束（`condition=Q(...)`）不进测试库，越权/重复可被绕过 | 每处约束在服务层用"事务内先查后写 + `select_for_update`"兜底；测试同时覆盖应用层拒绝与迁移文件中的约束定义（静态断言）                                                              |
| T-02 | 只追加表继承 `BaseModel` 会带上软删除语义，可能被上游批量操作误删                  | `StageTransition`/`StageMaterialVersion`/`StageReviewRevision`/`ExperimentRecordVersion`/`IntegrationCallLog` 覆写 `save()` 只允许 create、覆写 `delete()` 抛错，且外键用 `PROTECT` |
| T-03 | `ResearchExternalReference.metadata` 字段名与 Django/DRF 保留语义                  | 已确认可用（P0 `ResearchAuditEvent.metadata` 在用）；序列化器显式列出全部字段，不用 `__all__`，避免 `metadata` 被 DRF 特殊处理                                                      |
| T-04 | Page 旁路：P0 守卫只识别报告，P1 材料 Page 可被上游接口直接改写                    | 扩展 `page_guard`：一次额外查询 `StageMaterial.objects.filter(page_id=...)`，普通 Page 仍立即返回 `None`，不改动上游 Page 视图签名                                                  |
| T-05 | 快照 500MB 与 `DATA_UPLOAD_MAX_MEMORY_SIZE=5MB` 冲突                               | 一律走"预签名直传 + 登记 asset_id"两段式（复用 P0 报告附件链路），登记接口不收文件字节，`is_uploaded` 由服务端向对象存储复核                                                        |
| T-06 | 新增通知可能改变既有通知中心行为                                                   | 只新增 `entity_name`（`research_stage` / `research_stage_review` / `research_experiment_amendment`），不新增通道、不改既有查询                                                      |
| T-07 | 子开关扩展会改变 `identity` 响应结构，前端可能二次请求或渲染空白                   | `workspace_research_sections()` 一次性返回 7 个键；前端 `identity.sections` 同步扩展，页面守卫缺键时按"关闭"处理并回落首页                                                          |
| T-08 | 集成调用若在阶段提交事务内同步执行，会拖长事务并放大超时影响                       | 阶段提交/gate 计算只读缓存或本地已登记引用，绝不在事务内发起外部请求；外部请求统一走 `timeout=(connect, read)` 显式设置                                                             |
| T-09 | 外部引用缓存可能被不同权限的调用者命中                                             | 缓存 key = `workspace + system + 权限维度摘要`（Plane ACL 维度 + 源系统 `acl_hint` 摘要）；降级结果 TTL ≤ 30s，避免恢复后仍展示旧状态                                               |
| T-10 | 时间线聚合跨 8 类来源，易产生 N+1 与慢查询                                         | 按 `project + 时间范围` 分别批量查询后在 Python 归并；§4 各表复合索引必须落地；外部引用部分走缓存并支持分页                                                                         |
| T-11 | 审计与版本表只追加语义需在接口层守住                                               | 不提供任何 update/delete 路由；审计查询接口新增 `resource_type`/`action`/时间范围过滤，保持只读                                                                                     |
| T-12 | 评审指派部分唯一约束与"移除后重新指派"冲突                                         | 移除指派为 `is_active=False` + 保留记录；阶段重提把既有指派置 `superseded_at` 并重新生成新指派，约束按 `is_active=True` 生效                                                        |
| T-13 | 新增 10 个 i18n 命名空间易遗漏 key                                                 | 提交前用脚本比对 `packages/i18n/src/locales/{en,zh-CN}/common.json` 的 `research.*` key 集合，缺失即阻断提交                                                                        |
| T-14 | 版本号策略与仓库 `AGENTS.md` 的约束                                                | 阶段内提交不调整版本号；仅在 `P1-E2` 发布候选时把根/`apps/web`/`apps/api`/`packages/ui` 与界面版本统一升到 `2.2.0`                                                                  |
| T-15 | 迁移回滚需要显式顺序                                                               | 新增表与外键全部 `PROTECT`/`SET_NULL`，down 迁移按依赖逆序 drop；`ResearchStageRequirement` 等含部分约束的表在回滚时先删约束                                                        |

## 6. 需求空白与补充约定（G 类）

| 编号 | 空白                                           | 补充约定                                                                                                                       |
| ---- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| G-01 | 阶段材料 Page 的创建口径未定义                 | 沿用 P0 报告做法：新建 `Page(workspace, owned_by=owner, access=PRIVATE, name=材料标题)` 并经 `ProjectPage` 关联项目            |
| G-02 | `StageMaterialVersion.snapshot` 最小字段未定义 | 固化 `{name, description_json, description_html_stripped, attachment_ids[], page_id}`，只存摘要不存二进制                      |
| G-03 | 阶段提交时"材料齐备"的判定口径未定义           | 由 D-06 固化：必填材料存在且状态 ∈ {DRAFT, SUBMITTED, ACCEPTED}                                                                |
| G-04 | `ExperimentRecord.sequence_no` 的并发分配策略  | 事务内 `select_for_update` 锁定项目维度最大序号 +1；序号不回收、不复用                                                         |
| G-05 | 修订 `change_set` 的字段白名单来源             | 实现常量 `LOCKED_FIELDS`（进入 RUNNING 锁定）与 `AMENDABLE_FIELDS`（可修订白名单），两者互补，后续可配置化                     |
| G-06 | 外部系统未配置时的接口行为                     | 未配置/关闭连接：读取返回 `200 + degraded=true + degraded_reason=not_configured` 且 `items=[]`；写引用返回 `424`               |
| G-07 | 时间线 `kind` 枚举未定义                       | 固化 8 类：`stage_transition`/`stage_review`/`literature`/`experiment`/`code_artifact`/`report`/`outcome`/`external_reference` |
| G-08 | 搜索口径（P1-COMPAT-03）的落地方式             | 科研对象不进入上游多类型索引；新增科研专用检索接口按 ACL 过滤返回，上游搜索行为不变                                            |
| G-09 | 门槛默认值的种子数据来源                       | 不强制插入种子数据：读取时按 `ResearchStageRequirement` → Workspace 配置 → §14 环境变量三级回落                                |
| G-10 | `gate_result=WAIVED` 的产生条件未定义          | 仅管理员 `reopen`/`override` 且填写原因并写审计时允许记录 `WAIVED`，正常提交/通过永远为 `PASS`/`BLOCKED`                       |
| G-11 | 研发链条清单导出的传输方式未定义               | `GET .../chain/export/` 返回 `text/markdown` 附件流，文件名 `research-chain-<project>-<yyyymmdd>.md`                           |
| G-12 | `IntegrationCallLog.request_id` 生成规则未定义 | `uuid4().hex`，若请求带 `X-Research-Request-Id` 则沿用，用于跨系统追踪                                                         |

## 7. §12 待确认事项的实施默认值

| #   | 事项                  | P1 实施默认值                                                                  |
| --- | --------------------- | ------------------------------------------------------------------------------ |
| 1   | 阶段门槛数值          | 文献纳入下限 20、登记上限 100、成果下限 1、最少评审 3、通过比例 > 0.5          |
| 2   | 评审规则细节          | 仅直接导师否决；授权评审人由主 PI/管理员指派且有有效期；材料重提后评审全部失效 |
| 3   | 开题实验参与口径      | `PLANNED` 计入，最少 1 条                                                      |
| 4   | 实验关键字段与白名单  | 按 §4.5 固化 `LOCKED_FIELDS`，可修订白名单与其互补                             |
| 5   | 修订审批人范围        | 直接导师 / 主 PI / 组织内授权管理者                                            |
| 6   | 代码仓库凭证策略      | 只存 `credential_ref`；快照上限 500MB                                          |
| 7   | 外部系统接口契约      | 适配器隔离契约差异，未就绪系统保持引用 + 降级可用                              |
| 8   | 外部引用可见性映射    | 交集可见、源侧无法判定即拒绝，无人工白名单                                     |
| 9   | 降级口径与缓存时长    | 超时 3s、缓存 300s、降级仅展示标题与链接、降级 TTL ≤ 30s                       |
| 10  | 成果登记字段          | 六类成果最小必填：标题 + 类型 + 状态，其余字段可空                             |
| 11  | 中期/结题是否纳入报告 | 纳入近一个周期范围，可配置                                                     |
| 12  | 阶段材料 PDF 归档     | P1 不做，仅研发链条清单可导出                                                  |
| 13  | 版本号发布策略        | 阶段内不动版本号，E2 统一升 `2.2.0`                                            |

## 8. 编号与验收可测性核对

编号统计（脚本抽取，全文 `| P1-XXX-NN |` 形式共 145 条，全部唯一）：

| 模块   | 数量 | §7 覆盖阶段                    | §13 清单 | 结论            |
| ------ | ---- | ------------------------------ | -------- | --------------- |
| STG    | 13   | P1-A1                          | 有       | 一致            |
| REV    | 12   | P1-A2                          | 有       | 一致            |
| LIT    | 12   | P1-B1                          | 有       | 一致            |
| OPN    | 10   | P1-B2                          | 有       | 一致            |
| MID    | 8    | P1-B3                          | 有       | 一致            |
| FIN    | 8    | P1-B4                          | 有       | 一致            |
| EXP    | 14   | P1-C1                          | 有       | 一致            |
| CODE   | 10   | P1-C2                          | 有       | 一致            |
| INT    | 12   | P1-D1                          | 有       | 一致            |
| KB     | 8    | P1-D2                          | 有       | 一致            |
| LAB    | 8    | P1-D3                          | 有       | 一致            |
| RD     | 7    | P1-D4                          | 有       | 一致            |
| CHAIN  | 7    | P1-B4(07) + P1-E1(01–06)       | 有       | 一致（见 D-01） |
| UI     | 9    | P1-E1(01–06,09) + P1-E2(07–08) | 有       | 一致            |
| COMPAT | 7    | P1-E2                          | 有       | 一致            |

可测性核对结论：

- 145 条需求均具备"规则 + 验收要点"两段式描述，可直接映射为 `pytest` 用例；无"仅描述意向、无判定口径"的条目。
- 需注意 6 条需求只能做静态/存在性断言（P1-STG-10、P1-REV-07、P1-OPN-06、P1-EXP-09、P1-CODE-07、P1-INT-09），实现时必须提供可断言的证据面（路由不存在、模型抛错、前端产物无凭证）。
- 3 条需求依赖外部系统（P1-KB、P1-LAB、P1-RD），验收以"契约 + 降级路径"为准，不阻塞其他阶段（已由 §3.9 P1-INT-12 授权）。

## 9. 规模与排期复核

- §7.0 工作量合计 164 人日：13+11+12+12+9+10+17+12+13+10+12+10+11+12 = 164，与文档声明一致。
- §8 排期 14 行（W1–W14）与 14 个阶段一一对应；W1–W2 的 A 组为串行前置，W5–W6 B/C 并行，W9–W12 D 组按系统独立开路，W13–W14 为收敛与发布。
- 本次实现按"阶段可独立验收"推进，每阶段完成即验证并提交；阶段内改动不升版本号，避免与 §15.2 冲突。

## 10. 评审后需回写 PRD 的清单

1. §7.0 依赖列修正：`P1-B2` 增依赖 `P1-C2`（仓库登记），`P1-B3` 增依赖 `P1-C1`（实验登记）。
2. §1.3 依赖图补充 `C1/C2 → B2/B3` 依赖连线。
3. §5.2 材料与门槛接口语义修正（D-04、D-05）。
4. §4.2 `requirement_type` 增加 `REVIEW_RULE`（D-08），材料状态驱动口径补入 §3.4（D-06）。
5. §4.1 迁移编号回写实际值（D-10）。
6. §5.1 降级返回码口径收敛为"读 200 / 写 424"（D-12）。
7. §4.9 `current_stage` 字段类型与维护方补充（D-14）。
8. §15.3 变更记录追加 v1.1（评审回写）+ 实现回写记录章节（对齐 P0 PRD §16 的做法）。

## 11. 评审结论

**有条件通过，可进入分阶段开发。**

- 前置条件（已完成）：代码基线核对无差异；需求编号完整可追溯；14 个阶段的依赖无环。
- 开发期间约束：按 §5 的 15 项实现层决策固化；按 §6 的 12 项补充约定补齐契约；每阶段出口执行 §9.2 必测项与 §9.3 相关回归行。
- 交付期约束：P1-E2 完成前必须回写 §10 清单并更新本报告结论。

## 12. 变更记录

| 版本 | 日期       | 变更内容                                                             | 作者 |
| ---- | ---------- | -------------------------------------------------------------------- | ---- |
| v1.0 | 2026-09-15 | 首版：完成 PRD v1.0 的基线核对、编号覆盖、一致性问题与实现层决策评审 | —    |
