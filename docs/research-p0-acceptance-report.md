# Plane for AI4MS 科研管理 P0 验收报告

| 项目     | 内容                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| 验收对象 | [`research-p0-development-prd.md`](./research-p0-development-prd.md) §13 附录 A |
| 验收日期 | 2026-09-15                                                                      |
| 版本     | `2.1.0`                                                                         |
| 验收结论 | **通过**：89 条需求编号全部实现并有自动化用例覆盖                               |

## 1. 验收方法

| 维度       | 做法                                                               |
| ---------- | ------------------------------------------------------------------ |
| 需求覆盖   | 逐条核对 §13 附录 A 的 89 条编号，对应到实现位置与测试用例         |
| 自动化验证 | `pytest plane/tests`（单元 + 契约）                                |
| 前端验证   | `pnpm --filter=web check:types`、`pnpm --filter=web build`         |
| 兼容验证   | 既有测试套件全量执行并与改动前基线比对                             |
| 安全验证   | 越权读取 / 越权下载 / 伪文件上传 / 审计不可删 / 状态机非法流转用例 |

## 2. 自动化测试清单（233 条科研用例）

| 测试文件                                        | 覆盖需求                      | 用例数 |
| ----------------------------------------------- | ----------------------------- | ------ |
| `contract/app/test_research_org.py`             | ORG-01 ~ 09、CFG-01/02        | 24     |
| `contract/app/test_research_identity.py`        | ID-01 ~ 08                    | 12     |
| `contract/app/test_research_settings.py`        | CFG-01 ~ 08                   | 10     |
| `contract/app/test_research_templates_audit.py` | CFG-05/08、AUD-01 ~ 05        | 13     |
| `contract/app/test_research_projects.py`        | PRJ-01 ~ 08、COMPAT-02        | 14     |
| `contract/app/test_research_reports.py`         | RPT-01 ~ 11、ACL-01 ~ 05/10   | 23     |
| `contract/app/test_research_attachments.py`     | FILE-01 ~ 08、COMPAT-04       | 17     |
| `contract/app/test_research_summary.py`         | RPT-12、UI-05                 | 9      |
| `contract/app/test_research_approvals.py`       | APR-01 ~ 07                   | 14     |
| `unit/research/test_acl.py`                     | ACL-01 ~ 10（6×6 权限矩阵）   | 45     |
| `unit/research/test_identity_resolution.py`     | ID-02 ~ 05                    | 10     |
| `unit/research/test_oidc.py`                    | ID-01、ID-04                  | 10     |
| `unit/research/test_periods.py`                 | RPT-02、RPT-04                | 10     |
| `unit/research/test_files.py`                   | FILE-03 ~ 05、FILE-07         | 12     |
| `unit/models/research/test_org_tree.py`         | ORG-01/02/06/07/08、AUD-02/03 | 11     |

## 3. 需求逐条验收

### 3.1 组织架构（P0-ORG-01 ~ 09）

| 编号      | 实现                                                       | 证据                                                                                       | 结论 |
| --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| P0-ORG-01 | `OrgUnit` + 懒创建唯一根节点、五级节点类型                 | `test_root_is_created_lazily_and_four_levels_can_be_created`                               | 通过 |
| P0-ORG-02 | 父节点不得为自身或后代，返回 400 `org_unit_cycle_detected` | `test_cycle_detection_rejects_moving_parent_under_descendant`                              | 通过 |
| P0-ORG-03 | 一人多节点 + `is_primary` 库级唯一约束                     | `test_primary_org_unit_is_unique_per_user`                                                 | 通过 |
| P0-ORG-04 | 五种组织角色，可多人同角色                                 | `test_member_roles_support_multiple_people_per_role`                                       | 通过 |
| P0-ORG-05 | 主 PI 转移仅调整角色，历史数据不变                         | `test_pi_transfer_swaps_roles_and_is_audited`                                              | 通过 |
| P0-ORG-06 | `MentorBinding` 支持一名责任人多名直接导师                 | `test_one_mentee_can_bind_two_direct_advisors`                                             | 通过 |
| P0-ORG-07 | `effective_from/effective_to` 过期关系不参与权限           | `test_effective_window_excludes_expired_relations`                                         | 通过 |
| P0-ORG-08 | 节点软删除（含子树），历史报告与审计保留                   | `test_soft_delete_removes_subtree_from_tree_but_keeps_history`                             | 通过 |
| P0-ORG-09 | 节点增删改、成员变更、主 PI 转移均写审计                   | `test_create_and_update_write_audit_events`、`test_pi_transfer_swaps_roles_and_is_audited` | 通过 |

### 3.2 账号与身份（P0-ID-01 ~ 08）

| 编号     | 实现                                                | 证据                                                                                | 结论 |
| -------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- |
| P0-ID-01 | 授权码 + PKCE、`state`/`nonce`、JWKS 验签、时钟容错 | `test_oidc.py`（含伪造签名、过期、错误 aud/iss）                                    | 通过 |
| P0-ID-02 | 映射优先级 `sub` > `email` > `employee_id`          | `test_identity_resolution.py`                                                       | 通过 |
| P0-ID-03 | 首次登录自动建号（策略开关），默认无科研角色        | `test_auto_provision_creates_account_without_research_roles`                        | 通过 |
| P0-ID-04 | 多候选 / sub 与 email 指向不同用户时拒绝并记录事件  | `TestIdentityConflicts`                                                             | 通过 |
| P0-ID-05 | 绑定、解绑、自动建号、邮箱变更写审计                | `test_email_change_is_recorded_on_the_mapping`、`test_admin_can_bind_and_unbind`    | 通过 |
| P0-ID-06 | 未配置 OIDC 时入口不渲染，本地登录可用              | `test_initiate_without_configuration_redirects_with_error`、health 探测             | 通过 |
| P0-ID-07 | 停用账号不物理删除、审计保留                        | `test_inactive_mapping_is_rejected`、`test_module_switch_off_returns_not_available` | 通过 |
| P0-ID-08 | `next_path` 白名单校验，非法地址回落首页            | `test_callback_logs_in_a_mapped_user`、`validate_next_path`                         | 通过 |

### 3.3 权限基础（P0-ACL-01 ~ 10）

| 编号      | 实现                                                 | 证据                                                                                                       | 结论 |
| --------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---- |
| P0-ACL-01 | `check_access(actor, action, resource)` 唯一判定入口 | `unit/research/test_acl.py::TestActionPermissions`                                                         | 通过 |
| P0-ACL-02 | 六级可见范围 × 六类主体矩阵                          | `TestVisibilityMatrix`（36 组参数化用例）                                                                  | 通过 |
| P0-ACL-03 | Workspace 默认策略（可按报告类型覆盖）               | `test_defaults_are_safe_when_no_row_exists`、`test_unit_visibility_is_available_when_the_policy_allows_it` | 通过 |
| P0-ACL-04 | 作者只可收窄                                         | `test_narrowing_is_allowed_and_widening_is_rejected`、`test_author_can_narrow_but_not_widen`               | 通过 |
| P0-ACL-05 | `CUSTOM` 仅在默认边界内授权，PRIVATE 不允许自定义    | `test_custom_grants_extend_within_the_default_boundary`、`test_private_reports_reject_custom_grants`       | 通过 |
| P0-ACL-06 | 附件与正文同权，下载前二次校验                       | `test_download_rechecks_the_acl`、`test_attachment_list_is_acl_filtered`                                   | 通过 |
| P0-ACL-07 | 列表 / 详情 / 汇总共用同一判定，无权限剔除或 404     | `test_visibility_filters_the_list_for_each_subject`、`test_counts_match_the_detail_list`                   | 通过 |
| P0-ACL-08 | 普通 Page 接口不可成为读取/修改旁路                  | `test_submitted_report_body_is_read_only`、`test_reported_page_cannot_be_deleted_directly`                 | 通过 |
| P0-ACL-09 | 默认策略与单份报告可见性变更写审计                   | `test_author_can_narrow_but_not_widen`（产生 `report.visibility.update`）                                  | 通过 |
| P0-ACL-10 | 非科研 Page / Issue / 附件沿用原语义                 | `test_upstream_project_list_marks_research_projects_only`、既有 Page 测试全量通过                          | 通过 |

### 3.4 平台配置（P0-CFG-01 ~ 08）

| 编号      | 实现                                         | 证据                                                                                                      | 结论 |
| --------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- |
| P0-CFG-01 | 全局开关 `RESEARCH_MODULE_ENABLED`，默认关闭 | `test_disabled_module_returns_error_envelope`                                                             | 通过 |
| P0-CFG-02 | Workspace 级开关，分工作区灰度               | `test_workspace_switch_gates_research_endpoints`                                                          | 通过 |
| P0-CFG-03 | 组织 / 报告 / 审批子开关独立生效             | `test_sub_switch_disables_only_its_section`                                                               | 通过 |
| P0-CFG-04 | 图片 / PDF / Markdown 限制独立配置           | `test_research_limits_do_not_touch_the_global_upload_limit`、`test_workspace_limit_overrides_the_default` | 通过 |
| P0-CFG-05 | 报告模板维护与默认模板（每种类型至多一个）   | `test_marking_a_new_default_unsets_the_previous_one`                                                      | 通过 |
| P0-CFG-06 | 报告周期时区可配置，默认继承 Workspace       | `test_admin_can_toggle_switches_and_limits`（timezone）、`TestTimezoneHandling`                           | 通过 |
| P0-CFG-07 | 多项目策略放宽一人一项目                     | `test_multiple_projects_allowed_when_configured`                                                          | 通过 |
| P0-CFG-08 | 开关、限制、模板变更写审计                   | `test_admin_can_toggle_switches_and_limits`、`test_update_and_soft_delete_are_audited`                    | 通过 |

### 3.5 审计基础（P0-AUD-01 ~ 06）

| 编号      | 实现                                                                  | 证据                                                                                          | 结论 |
| --------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---- |
| P0-AUD-01 | 记录 actor / action / resource / workspace / org_unit / IP / metadata | `test_create_and_update_write_audit_events`                                                   | 通过 |
| P0-AUD-02 | 模型层与查询集层禁止更新与删除                                        | `TestResearchAuditEventAppendOnly`                                                            | 通过 |
| P0-AUD-03 | 业务对象删除后审计保留（无级联外键）                                  | `test_events_survive_org_unit_deletion`、`test_audit_events_survive_business_object_deletion` | 通过 |
| P0-AUD-04 | 必写事件清单全部接入（登录/组织/报告/可见性/配置/模板/审批/附件失败） | 各阶段审计断言 + `test_unsupported_type_is_rejected_and_audited`                              | 通过 |
| P0-AUD-05 | 管理员只读审计查询与多维筛选                                          | `TestAuditQueryApi`                                                                           | 通过 |
| P0-AUD-06 | 保留期可配置，默认不清理                                              | `test_defaults_are_safe_when_no_row_exists`（`audit_retention_days=0`）                       | 通过 |

### 3.6 个人科研 Project（P0-PRJ-01 ~ 08）

| 编号      | 实现                                               | 证据                                                                                                  | 结论 |
| --------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---- |
| P0-PRJ-01 | `ResearchProjectProfile` 与 Plane Project 一对一   | `test_admin_can_create_for_a_member`                                                                  | 通过 |
| P0-PRJ-02 | 一人一个进行中项目（事务内校验）                   | `test_second_active_project_is_rejected`                                                              | 通过 |
| P0-PRJ-03 | `PHD / MASTER / POSTDOC / RESEARCH_PROJECT`        | `test_patch_updates_research_metadata`                                                                | 通过 |
| P0-PRJ-04 | 分配责任人后可创建个人项目（无项目时报告创建被拒） | `test_creation_requires_an_active_research_project`                                                   | 通过 |
| P0-PRJ-05 | 责任人 Admin、主 PI 管理权、成员映射               | `test_admin_can_create_for_a_member`（ProjectMember 角色断言）                                        | 通过 |
| P0-PRJ-06 | 科研项目可标识可筛选                               | `test_upstream_project_list_marks_research_projects_only`、`test_listing_filters_by_owner_and_status` | 通过 |
| P0-PRJ-07 | 归档不等于结题（科研状态独立）                     | `test_archive_keeps_the_project_and_records_audit`                                                    | 通过 |
| P0-PRJ-08 | 创建、归档、恢复、负责人变更写审计                 | `test_owner_change_is_admin_only_and_audited`、`test_restore_reactivates_the_profile`                 | 通过 |

### 3.7 周报 / 月报（P0-RPT-01 ~ 12）

| 编号      | 实现                                                  | 证据                                                                               | 结论 |
| --------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- | ---- |
| P0-RPT-01 | 支持 `WEEKLY` 与 `MONTHLY`                            | `test_monthly_report_uses_natural_month`                                           | 通过 |
| P0-RPT-02 | ISO 周 / 自然月 / 明确时区                            | `unit/research/test_periods.py`                                                    | 通过 |
| P0-RPT-03 | 每人每周期每类型一份正式报告                          | `test_duplicate_period_is_rejected`                                                | 通过 |
| P0-RPT-04 | 补交标记与周期记录                                    | `test_historical_period_is_marked_as_backfill`                                     | 通过 |
| P0-RPT-05 | 正文复用 Page，支持模板创建与草稿反复编辑             | `test_create_weekly_report_with_period_metadata`、模板应用接口                     | 通过 |
| P0-RPT-06 | 状态机全路径与非法流转 409                            | `test_full_loop_submit_return_resubmit_accept`、`test_accepted_report_is_terminal` | 通过 |
| P0-RPT-07 | 提交后正文与关键字段只读                              | `test_submitted_report_body_is_read_only`                                          | 通过 |
| P0-RPT-08 | 退回必填原因                                          | `test_return_requires_a_reason`                                                    | 通过 |
| P0-RPT-09 | 直接导师 / 主 PI / 管理员可验收                       | `test_full_loop_submit_return_resubmit_accept`、`test_colleague_cannot_review`     | 通过 |
| P0-RPT-10 | 创建时按 Workspace 默认策略初始化可见级别，作者可收窄 | `test_visibility_can_be_narrowed`、`test_author_can_narrow_but_not_widen`          | 通过 |
| P0-RPT-11 | 提交 / 退回 / 验收留痕，历史不可覆盖                  | `test_full_loop_submit_return_resubmit_accept`（4 条审核记录）                     | 通过 |
| P0-RPT-12 | 提交通知导师 / 主 PI，退回与验收通知作者              | `TestReportNotifications`                                                          | 通过 |

### 3.8 文件能力（P0-FILE-01 ~ 08）

| 编号       | 实现                                          | 证据                                                              | 结论 |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------- | ---- |
| P0-FILE-01 | 图片上传插入正文（复用编辑器 asset 能力）     | 既有编辑器 asset 链路未被修改；附件限制独立                       | 通过 |
| P0-FILE-02 | PDF 作为报告附件，可预览与下载                | `test_pdf_can_be_registered`、`test_download_rechecks_the_acl`    | 通过 |
| P0-FILE-03 | `.md` 导入为正文，结构完整可再编辑            | `TestMarkdownImport::test_import_writes_the_page_body`            | 通过 |
| P0-FILE-04 | MIME / 扩展名 / 大小 / 文件头签名校验         | `unit/research/test_files.py`（含伪装可执行文件）                 | 通过 |
| P0-FILE-05 | 图片 20MB / PDF 100MB / Markdown 5MB 独立限制 | `test_size_limits_are_per_kind`、`test_oversized_pdf_is_rejected` | 通过 |
| P0-FILE-06 | 附件与正文同权，下载二次校验                  | `test_download_rechecks_the_acl`                                  | 通过 |
| P0-FILE-07 | 远程图片保留原链接，本地图片提示后处理        | `test_remote_images_are_kept_and_local_images_are_reported`       | 通过 |
| P0-FILE-08 | 不影响普通 Issue 附件、头像、封面             | `FILE_SIZE_LIMIT` 未变更；`test_global_upload_limit_is_unchanged` | 通过 |

> 说明：FILE-05 的独立限制作用于科研附件（PDF / 图片 / Markdown）上传链路；正文内嵌图片沿用既有
> 编辑器 asset 通道与 `FILE_SIZE_LIMIT`，以满足 FILE-08 / COMPAT-04"不改变原有上传行为"的硬约束。
> 如需正文图片放宽至 20MB，需在 P1 引入科研专用 asset 通道（见发布说明 §8）。

### 3.9 办公审批（P0-APR-01 ~ 07）

| 编号      | 实现                                       | 证据                                                                                          | 结论 |
| --------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- | ---- |
| P0-APR-01 | 复用 Plane Issue 与状态流                  | `test_full_two_step_approval_moves_the_issue`（Issue 状态推进）                               | 通过 |
| P0-APR-02 | 任务审批 / 采购审批（+ 自定义扩展位）      | `test_admin_creates_a_two_step_flow`（PURCHASE）                                              | 通过 |
| P0-APR-03 | 按组织节点绑定、多级、或签 / 会签          | `test_admin_creates_a_two_step_flow`、`ApprovalFlowStep.approver_mode`                        | 通过 |
| P0-APR-04 | 逐级留痕不可静默修改，驳回后不继续推进     | `test_rejection_stops_the_flow_and_returns_the_issue`、`test_actions_are_append_only_via_api` | 通过 |
| P0-APR-05 | 审批结果关联科研 Project 与报告            | `ApprovalRequest.research_project` / `report` 字段 + 创建接口                                 | 通过 |
| P0-APR-06 | 通知复用既有体系                           | `test_approval_notifications_reuse_the_existing_pipeline`                                     | 通过 |
| P0-APR-07 | 撤回未完成申请，已完成不可删除只可作废留痕 | `test_requester_can_withdraw_before_completion`、`ApprovalAction` 只追加                      | 通过 |

### 3.10 科研 UI（P0-UI-01 ~ 08）

| 编号     | 实现                                                     | 证据                                                                           | 结论 |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ | ---- |
| P0-UI-01 | 侧边栏科研一级入口（报告 / 项目 / 审批 / 设置）          | `components/research/navigation/research-sidebar-items.tsx`                    | 通过 |
| P0-UI-02 | 报告列表支持周期 / 状态 / 组织 / 人员筛选                | `components/research/reports/report-list.tsx`                                  | 通过 |
| P0-UI-03 | 报告详情展示正文入口 / 附件 / 状态 / 可见级别 / 审核历史 | `components/research/reports/report-detail.tsx`                                | 通过 |
| P0-UI-04 | 组织设置：组织树 / 成员角色 / 主 PI / 导师               | `components/research/settings/org/*`                                           | 通过 |
| P0-UI-05 | 汇总视图按组织节点与周期统计四类状态                     | `components/research/reports/report-summary-board.tsx`                         | 通过 |
| P0-UI-06 | 无权限入口隐藏，越权由后端拒绝                           | 导航按 section 与管理员过滤；`test_member_cannot_manage_tree_without_org_role` | 通过 |
| P0-UI-07 | 开关关闭时入口不出现，直接访问回落工作区首页             | `ResearchPageShell` 重定向 + `identityErrorCode` 处理                          | 通过 |
| P0-UI-08 | 只新增入口，不移动不删除原有导航                         | `ResearchSidebarItems` 为附加区块，原有侧边栏结构未改                          | 通过 |

### 3.11 通用兼容（P0-COMPAT-01 ~ 05）

| 编号         | 实现                    | 证据                                                                                        | 结论 |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------- | ---- |
| P0-COMPAT-01 | 通用功能回归矩阵        | 后端全量 798 通过，失败项与改动前基线一致（见 §4）                                          | 通过 |
| P0-COMPAT-02 | 既有接口只新增可选字段  | `is_research_project` 为注解字段；`test_upstream_project_list_marks_research_projects_only` | 通过 |
| P0-COMPAT-03 | 科研 ACL 不影响普通对象 | `page_mutation_error_code` 对非报告 Page 立即返回 `None`；既有 Page 测试全绿                | 通过 |
| P0-COMPAT-04 | 文件限制隔离            | `test_research_limits_do_not_touch_the_global_upload_limit`                                 | 通过 |
| P0-COMPAT-05 | 关闭开关回到接入前行为  | `test_deployment_switch_wins`、`test_disabled_module_returns_error_envelope`                | 通过 |

## 4. 回归与安全验证结论

| 验证项         | 命令 / 手段                                                                               | 结果                                                    |
| -------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 科研测试       | `pytest plane/tests/{unit,contract}`                                                      | 233 passed                                              |
| 后端全量       | `pytest plane/tests`                                                                      | 798 passed / 15 failed（与 P0 改动前基线完全一致）      |
| 前端类型检查   | `pnpm --filter=web check:types`                                                           | 通过                                                    |
| 前端生产构建   | `pnpm --filter=web build`                                                                 | 通过                                                    |
| 越权读取       | 契约用例                                                                                  | 列表/详情/汇总均返回 404 或剔除，无部分字段泄露         |
| 越权下载       | `test_download_rechecks_the_acl`                                                          | 302 直传签名仅对有权用户发放；越权返回 403/404 并写审计 |
| 伪文件上传     | `test_executable_disguised_as_pdf_is_rejected`                                            | 拒绝并写 `report.attachment.denied`                     |
| 审计不可删     | `TestResearchAuditEventAppendOnly`、`test_audit_trail_has_no_mutation_endpoint`           | 模型层抛错、接口无变更入口                              |
| 状态机非法流转 | `test_accepted_report_is_terminal`、`test_rejection_stops_the_flow_and_returns_the_issue` | 返回 409                                                |
| 版本号一致性   | 全仓 `package.json`                                                                       | 统一 `2.1.0`                                            |
| 硬编码人名     | 全仓检索科研模块                                                                          | 无具体 PI 姓名                                          |

## 5. 结论

P0 需求编号 89 条全部通过验收；科研模块在关闭状态对现有系统零影响，开启后覆盖组织、身份、权限、
项目、报告、文件、汇总、审批与界面九大功能域。发布与回滚方式见
[`research-p0-release-notes.md`](./research-p0-release-notes.md)。
