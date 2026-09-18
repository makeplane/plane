# 科研工作空间 v3 实现说明

| 项目     | 内容                                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 文档状态 | v3 实现契约                                                                                                                                            |
| 文档版本 | v1.3                                                                                                                                                   |
| 日期     | 2026-09-18                                                                                                                                             |
| 对应版本 | `3.0.3`                                                                                                                                                |
| 适用范围 | 组织关系、科研权限、公共科研概览、主 PI 私有空间、周期报告与只读 Agent 上下文                                                                          |
| 历史文档 | [`research-system-management-prd.md`](./research-system-management-prd.md)、[`research-navigation-visibility.md`](./research-navigation-visibility.md) |

本文记录 v3 已实现的产品和接口契约。v2.4、v2.5 文档继续作为历史交付记录；凡工作空间准入、管理员标签、科研概览或导航权限与本文冲突，以本文为准。

## 1. 设计目标与边界

v3 在 Plane 的工作空间、项目、任务和 Page 能力上增加科研语义，不建立一套平行的项目管理系统。普通 Plane 项目仍按原有权限创建和使用；只有带 `ResearchProjectProfile` 的项目、周期报告及科研资源进入科研 ACL。

本版解决四个问题：

1. 用稳定、易理解的四级视图表达约 300 人课题组，同时保留多导师和跨方向协作。
2. 分开系统职责、科研配置、内容可见范围和对象动作，避免管理员标签或菜单级别扩大科研数据权限。
3. 公共科研工作空间承载唯一业务数据和按人收敛的概览；主 PI 私有空间只承载标准 Plane 工作。
4. 给后续 Agent 提供受现有身份与 ACL 约束的只读、版本化上下文索引。

用户导入和邀请码注册保留 v2.4 的接口兼容边界，并增加 v3 人员类别、主归属和导师关系写入能力；旧字段和旧记录继续可用。

## 2. 组织结构与人员关系

### 2.1 四级展示

科研组织在界面上按以下四级理解：

```text
主 PI
├── 基础研究
│   └── 直接导师（导师组）
│       └── 学生 / 博士后 / 科研助理等科研成员
└── 产业化
    └── 直接导师（导师组）
        └── 学生 / 博士后 / 科研助理等科研成员
```

- 主 PI 是工作空间配置中的稳定用户 ID，不靠 `MAIN_PI` 标签或某个组织节点名称推断。
- `OrgUnit.business_category` 表达 `BASIC_RESEARCH`（基础研究）、`INDUSTRIALIZATION`（产业化）和 `MENTOR_GROUP`（导师组）。原有 `ROOT / INSTITUTE / LAB / GROUP / TEAM` 类型及 UUID 保留兼容。
- 学生、博士后、科研助理等是 `OrgUnitMember` 和 `ResearchUserProfile`，不创建为组织节点。
- 旧节点如果不能可靠分类，`business_category` 保持空值并进入迁移预览的待归类清单；系统不会按名称猜测或删除节点。

### 2.2 主归属、多导师和主导师

- `OrgUnitMember.is_primary=true` 表示成员的唯一主归属。同一工作空间、同一用户最多存在一个未删除的主归属；其他有效关系可用于跨方向参与。
- 所有人员关系按 `effective_from`、`effective_to` 计算有效期。过期或软删除关系不再产生科研范围。
- 一名成员可以有多个 `MentorBinding`。`is_primary_advisor=true` 指定负责日常退回/接受的主导师；同一学生的主导师有效期不得重叠。联合导师可以读取符合可见级别的正式内容，但不能替代主导师执行日常审核。
- 创建导师关系时，客户端提交的 `org_unit` 只作为选择条件。服务端以学生当前有效的主归属为准，再校验操作者是否能管理该归属，防止伪造节点绕过权限。
- 缺少主归属或主导师的成员不会被自动归类或自动分配。`migrate_research_workspace_v3` 的预览会分别列出 `members_missing_primary_org` 和 `members_missing_primary_advisor`，供管理员补齐。

旧导入数据中的 `GROUP` 节点、学生 `REVIEWER` 角色和非主归属关系继续有效。`REVIEWER` 只作为旧学生席位的兼容表达，不再等同于阶段评审权限；阶段评审权限来自实际的 `StageReviewerAssignment`。

## 3. 身份、职责与内容权限

### 3.1 四类判断彼此独立

一次请求可能同时经过以下判断，任何一项通过都不会替代其他项：

1. **工作空间准入**：用户能否进入该 Plane 工作空间。
2. **配置能力**：用户能否管理当前工作空间的组织、模板、身份映射等设置。
3. **内容范围**：用户能否读取某个报告、阶段材料、实验、代码或成果。
4. **对象动作**：用户能否编辑、提交、退回、接受或管理授权。

`identity/me` 继续返回旧字段，并同时返回 `is_system_admin`、`is_research_admin`、`is_workspace_admin`、`admin_roles`、`research_level`、`capabilities.nav`、组织关系和导师关系。前端按这些具体能力显示入口，不应从一个最高角色推导所有权限。

### 3.2 系统管理员与职责标签

| 身份           | v3 权威语义                                                            | 是否自动获得科研配置、内容或私有空间席位                 |
| -------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| 系统管理员     | `InstanceAdmin`；创建和配置工作空间、任命主 PI、管理职责标签和私有准入 | 可执行实例管理；科研正文仍经过工作空间成员关系和对象 ACL |
| 工作空间管理员 | 当前工作空间中 role `20`                                               | 可管理该空间科研配置；草稿正文仍使用科研 Page 保护       |
| `DEV_ADMIN`    | 开发和集成职责标签                                                     | 否                                                       |
| `OPS_ADMIN`    | 运行维护职责标签                                                       | 否                                                       |
| 旧 `MAIN_PI`   | 为兼容保留的历史标签                                                   | 否；不等同于主 PI 任命                                   |

系统管理员的权威来源是 `InstanceAdmin`。`DEV_ADMIN`、`OPS_ADMIN` 和旧 `MAIN_PI` 仍可由系统管理员给已有用户打标，并由 `identity/me` 返回，但标签本身不会：

- 把用户提升为科研 `ADMIN`；
- 打开组织、模板、平台、审计等科研配置入口；
- 扩大报告、项目、阶段或科研正文的可见范围；
- 自动加入公共或主 PI 私有工作空间。

开发与运维职责可分别用于集成配置和运行维护流程的后续细分，不能用作读取科研内容的替代授权。

### 3.3 科研内容规则

- 作者可以读取自己的内容；处于 `DRAFT` 或 `NOT_STARTED` 的科研正文和私人笔记不继承技术管理员、组织管理链或工作空间管理员的读取范围。
- 正式个人材料依据对象可见级别，向有效直接导师、指定评审人和对应组织管理链开放；周期报告的日常退回/接受只允许有效主导师、组织管理链、明确评审人或已任命主 PI 执行。工作空间管理员身份本身不产生正文读取或审核权。
- 团队正式材料依据 Plane 项目成员关系和科研对象 ACL 开放。团队成员可创建、读取和维护自己创建的实验、文献、代码及成果，不能修改另一成员创建的内容。
- 自定义授权逐一匹配实际用户或组织受众，并受工作空间默认可见级别的边界约束。
- 时间线和进展聚合对代码仓库、代码产物和成果使用与列表、详情相同的 ACL，不因进入聚合接口而扩大范围。
- 普通 Plane 对象没有科研元数据时继续走 Plane 原权限，不受科研 ACL 影响。

## 4. 工作空间与科研概览

### 4.1 工作空间用途

`WorkspaceResearchSetting.purpose` 有三种稳定值：

| 值                | 用途                        | 科研模块默认状态             |
| ----------------- | --------------------------- | ---------------------------- |
| `GENERAL`         | 普通 Plane 工作空间         | 关闭，可由有权管理员显式启用 |
| `PUBLIC_RESEARCH` | 公共课题组科研空间          | 承载组织和科研业务数据       |
| `PI_PRIVATE`      | 主 PI 的独立 Plane 工作空间 | 强制关闭，不能启用科研模块   |

只有系统管理员能从实例管理端创建工作空间。新空间默认 `GENERAL` 且科研关闭；普通注册用户仍可在已经加入的工作空间中按 Plane 原权限创建普通项目。

### 4.2 主 PI 私有空间

系统只允许一个未删除的 `PI_PRIVATE` 工作空间。它保留标准 Plane 项目、任务和 Page，不显示科研导航、不提供科研聚合，也不承载公共科研数据副本。

进入 `PI_PRIVATE` 必须同时满足 Plane 的常规成员校验以及以下显式准入之一：

- 当前配置的 `main_pi`；
- `InstanceAdmin`；
- `ResearchWorkspaceAccessGrant` 中未撤销的用户。

普通组织节点的 `OWNER / PI`、`DEV_ADMIN / OPS_ADMIN / MAIN_PI` 标签都不会产生席位。任命、撤销主 PI 或修改显式授权时会同步工作空间成员状态；被撤权用户会从工作空间列表和普通 Plane 项目、Page 等接口中同时失去访问。

### 4.3 公共科研概览

科研概览位于当前 `PUBLIC_RESEARCH` 工作空间的 `/<slug>/research`。旧 `/research/dashboard` 地址只做兼容跳转，不再维护第二个看板页面。聚合接口为：

```http
GET /api/research/workspaces/<slug>/aggregate/
```

接口只读取 URL 中的当前工作空间，不再硬编码 `public`，并拒绝从 `PI_PRIVATE` 聚合科研数据。范围规则如下：

| 调用者                            | 概览范围                             |
| --------------------------------- | ------------------------------------ |
| 已任命主 PI                       | 当前公共科研空间中的全部有效组织节点 |
| 方向负责人 / 组织 PI / 单元管理员 | 本人管理节点及子树                   |
| 直接导师                          | 本人及当前有效指导成员               |
| 普通科研成员                      | 个人工作入口；不显示管理聚合卡片     |
| 纯技术职责标签                    | 不产生额外科研范围                   |

聚合返回项目、非草稿报告、阶段、待评审、待审批、成员及组织范围，并按对象去重。报告“提交汇总”继续作为下钻视图，支持 `report_type`、`period_key` 和 `org_unit`；未提交统计以工作空间的 `required_reporter_categories` 为准，默认是 `STUDENT`、`POSTDOC`，同时兼容已有的有效培养项目。

## 5. 项目、周期报告与正式版本

### 5.1 两类科研项目

科研项目继续使用 `Project + ResearchProjectProfile`：

| 类型         | `research_type`              | 规则                                                              |
| ------------ | ---------------------------- | ----------------------------------------------------------------- |
| 个人培养项目 | `PHD` / `MASTER` / `POSTDOC` | 每人在同一工作空间最多一个进行中的项目；创建时初始化培养阶段      |
| 团队课题     | `RESEARCH_PROJECT`           | 可创建多个；使用 Plane 任务、周期和模块推进，不自动初始化培养阶段 |

新建科研项目默认为 Plane 私有项目（`network=0`），自动采用负责人的有效主归属；没有主归属时接口保留空值，前端明确提示补齐。创建、恢复、负责人转移或从团队课题改为培养项目时都会重新校验“一个进行中培养项目”。科研项目列表由服务端分页，默认每页 50 条、最多 100 条。

团队课题以 Plane `ProjectMember` 为协作边界。项目 Admin 和 Member 可新增并读取团队正式科研记录；当前实现中，每人只能维护自己创建的内容，项目负责人修改他人内容仍需后续显式对象授权，不从工作空间管理员身份隐式推导。

### 5.2 人本周期报告

- 周报和月报按“工作空间 + 人 + 报告类型 + 周期”唯一，而不是按项目唯一。
- 报告的培养项目 `project` 可为空；创建人只要有有效主归属，即使没有培养项目、没有团队课题，也可以创建和提交。
- `team_projects` 可引用多个本人已加入的团队课题。引用只用于汇总个人进展，不会让其他团队成员获得整份个人报告权限。
- 报告归属优先取进行中的个人培养项目，否则取本人主归属；不会再从多个团队项目中任取一个作为培养项目。
- 有培养项目时，报告草稿 Page 沿用该项目的 Plane Page 编辑入口；没有培养项目时，Page 不挂接任何 `ProjectPage`，正文直接在科研报告详情内编辑。系统不会为此新建隐藏项目，也不会把该 Page 暴露到普通 Plane 项目或科研项目列表。

### 5.3 草稿与不可变正式快照

报告正文的可编辑草稿保存在关联 Plane Page 中，状态流为：

```text
DRAFT → SUBMITTED → ACCEPTED
                   ↘ NEEDS_REVISION → SUBMITTED
```

- 每次提交在同一事务中创建下一版 `PeriodicReportSnapshot`，冻结 JSON、HTML、纯文本和二进制正文，并把版本号写入评审日志。
- `PeriodicReportSnapshot` 是 append-only 记录，不能更新或删除。
- 报告退回后，作者继续编辑 Page 草稿；导师和管理链通过报告接口仍读取最近一次正式快照，不会看到正在修改的草稿。
- 报告附件随提交版本冻结。退回修订期间，审核人继续看到上一正式版本的附件集合；作者的新附件和删除调整在重新提交前不会改变审核人视图。
- 作者的报告详情返回当前草稿编辑入口；其他获授权读者的报告详情通过 `official_content` 和 `latest_official_version` 返回最近正式版本。
- 科研报告 Page 和阶段材料 Page 从普通 Page 列表及搜索结果中排除。非作者不能通过 Page 详情、二进制正文、历史或实时协作连接读取草稿；科研 Page 的直接更新、访问级别变更、归档、复制和删除也受统一保护。
- 实时协作连接每次都向 Page API 重新鉴权，包括缓存命中文档；撤权后不能继续依赖旧连接权限。

## 6. 只读 Agent 上下文 API

```http
GET /api/research/workspaces/<slug>/context/?project_id=<uuid>&page=1&page_size=50
```

该接口接受现有会话认证或 `X-API-Key`。API Token 只继承持有者在指定工作空间中的权限，不扩大组织、项目或对象范围。

响应包含：

- `schema_version`、`generated_at`；
- 当前工作空间和调用者范围，且 `business_records_mutated` 固定为 `false`；
- `page`、`page_size`、`total`、`has_more`，按项目分页，默认每页 50 个项目、最多 100 个；每个项目后跟该项目经授权的资源引用；
- 经 ACL 过滤的项目和时间线资源引用：`kind`、`id`、`title`、`status`、`owner`、`project`、`source`、`updated_at`、`version`、`link`。

`project_id` 可选，用于把结果限定到一个项目。非法分页参数返回 400；不可见的项目返回空资源列表而不泄露其存在。

当前 v3 契约只提供引用元数据，不返回报告、Page、实验、阶段材料或外部系统正文，也没有写入、流程执行或模型调用能力。资源详情兼容入口同样只返回 `kind`、`id`、`source`、`version`、`status`、`updated_at` 和 `link`；`version=draft` 统一按不存在处理。每次读取写入 `context.read` 审计事件，审计元数据只记录筛选条件、资源类型、版本和返回数量，不记录正文、API Token 或其他凭证。

时间线中的外部引用还要通过对应适配器的权限确认；无法确认源系统权限时不会进入上下文结果。已有适配器只代表 Plane 侧契约，不代表外部服务已经完成生产联调。

## 7. 导入、邀请码与旧数据兼容

账号生命周期在保持旧契约的基础上使用 v3 关系模型：

- 新邀请码为 `provisioning_version=2`，统一创建普通成员兼容席位 `REVIEWER`，并可选人员类别、现有主归属组织和现有主导师。邀请码不能签发 `PI / OWNER / UNIT_ADMIN / ADVISOR` 管理角色；旧 v1 邀请码不迁移、不失效，仍按原字段兑换。
- 邀请码兑换继续原子消耗使用次数，同时加入公共工作空间、创建科研档案、写入唯一主归属和主导师关系；未指定组织或导师时允许注册并进入待补齐清单。
- 新单表名册可选列为 `人员类别 / category`、`业务方向 / business_category`、`主归属组织 / primary_org_unit`、`主导师邮箱 / primary_advisor_email`、`联合导师邮箱 / co_advisor_emails`。联合导师邮箱以分号分隔；主归属接受 UUID 或完整组织路径。
- v3 导入只绑定已有有效组织和当前工作空间成员。组织或导师不存在、业务方向不符、已有主归属或主导师冲突时保留权威关系并将该行标为 `PENDING`，不会猜测、自动建树或静默覆盖。
- 名册预检完全在内存中完成，返回 `id=null` 的临时逐行结果，不创建导入批次、导入行、账号、组织或关系；只有正式导入进入历史并提供凭证报告。
- 用户档案列表和修改接口只接受当前工作空间的有效成员，已撤销或仅属于其他工作空间的用户按不存在处理。
- 旧二维表、导师映射文件、预检、正式导入、初始密码、幂等和报告下载契约继续工作。旧 `分组` 仍可创建 `GROUP`，学生仍可写入 `REVIEWER`，已有主归属时兼容关系可以保持非主。
- `identity/me.capabilities.management.accounts` 是账号生命周期专属能力。账号接口继续使用 `is_account_compat_admin`；旧职责标签用户还必须持有当前工作空间席位，且只获得 `system` 入口，不能外推为组织配置、科研正文、评审权限或主 PI 私有空间席位。

## 8. 迁移与发布操作

### 8.1 Schema 迁移

正常执行 Django migration 后，`0141_research_workspace_model_foundation` 会：

- 按现有 slug 把 `public` 标为 `PUBLIC_RESEARCH`，把 `pi` 标为 `PI_PRIVATE`；
- 强制关闭 `pi` 的科研模块；
- 新增工作空间用途、主 PI、私有准入、组织业务分类、主导师、团队课题引用和报告正式快照等结构，并沿用已有 `is_primary` 字段表达唯一主归属；
- 将现有 Profile 的语言一次性迁移为 `zh-CN`，并把新 Profile 默认语言设为 `zh-CN`。用户迁移后仍可手动切换语言。

### 8.2 业务数据预览

业务数据命令默认只读，输出 JSON，不写数据库也不生成备份：

```bash
docker compose -f docker-compose-local.yml exec api \
  python manage.py migrate_research_workspace_v3
```

预览会验证 `public`、`pi` 两个 slug 及其用途，列出：

- 公共空间缺少主归属、缺少主导师的成员和待分类组织节点；
- 主 PI 私有空间将被清理的项目及所有关联业务对象数量；
- 当前实例管理员，以及 `fangyikaii@163.com` 降为 `DEV_ADMIN` 的预期变化；
- `MAIN_PI` 历史标签不会自动转换为唯一主 PI。

预览不会自动调整公共组织树，也不会猜测主 PI、主归属、导师或业务分类。

### 8.3 审核后执行

只有审核预览结果并准备好持久化备份目录后才执行：

```bash
docker compose -f docker-compose-local.yml exec api \
  python manage.py migrate_research_workspace_v3 \
  --apply \
  --backup-dir /absolute/private/backup-dir
```

`--apply` 必须同时提供容器内的绝对 `--backup-dir`。目录不能是文件系统根、符号链接，也不能允许 group/other 写入。命令先生成权限为 `0600` 的 JSON 备份并对敏感字段脱敏，再在数据库事务中重新锁定和校验目标；若备份后数据发生变化，事务拒绝执行。

执行内容严格限定为：清理 `pi` 中现有项目、报告、Page、阶段、附件等关联业务数据；保留工作空间、用户、必要审计和备份；清空 `pi.main_pi`、关闭科研；把 `fangyikaii@163.com` 从 `InstanceAdmin` 降为 `DEV_ADMIN`；按显式准入重新同步私有空间席位。再次执行会返回 `already-applied`，不会重复授权或重复删除。

## 9. 验证命令与验收重点

首次运行 Docker 测试前执行 `./setup.sh`。v3 后端重点回归：

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest -q \
  plane/tests/unit/research/test_workspace_model_foundation.py \
  plane/tests/unit/research/test_research_workspace_v3_commands.py \
  plane/tests/contract/app/test_instance_workspace_research.py \
  plane/tests/contract/app/test_pi_private_plane_access.py \
  plane/tests/contract/app/test_research_admin_roles.py \
  plane/tests/contract/app/test_research_org.py \
  plane/tests/contract/app/test_research_projects.py \
  plane/tests/contract/app/test_research_reports.py \
  plane/tests/contract/app/test_research_summary.py \
  plane/tests/contract/app/test_research_team_content.py \
  plane/tests/contract/app/test_research_chain.py \
  plane/tests/contract/app/test_research_context.py
```

完整后端和前端门禁：

```bash
docker compose -f docker-compose-test.yml up --build \
  --abort-on-container-exit --exit-code-from api-tests
docker compose -f docker-compose-test.yml down -v

pnpm check:format
pnpm check:lint
pnpm check:types
pnpm build
```

手工验收至少覆盖：

1. 主 PI、方向负责人、双导师、学生、团队成员、系统管理员及 DEV/OPS 标签用户的范围矩阵。
2. 主归属和主导师有效期、跨方向导师、撤权后列表/详情/Page/协作连接同步失效。
3. 培养项目的唯一性，以及团队课题多项目和成员自有内容边界。
4. 报告无培养项目、多团队引用、退回修订和正式快照隔离。
5. 公共概览的导师/子树范围、草稿排除、统计与下钻一致性。
6. `PI_PRIVATE` 的三类显式准入、普通 Plane 功能可用、所有科研入口关闭。
7. Context API 的会话/API Token 等价权限、分页、跨空间隔离、只读审计。
8. 用户导入、邀请码注册和普通 Plane 项目、任务、Page、附件回归。

## 10. 变更记录

| 文档版本 | 日期       | 变更摘要                                                                              |
| -------- | ---------- | ------------------------------------------------------------------------------------- |
| v1.3     | 2026-09-18 | 3.0.3：统一科研状态反馈、报告与组织高风险操作、列表空态、导航及 ICU 文案插值          |
| v1.2     | 2026-09-18 | 3.0.1：收紧 Agent Context 为纯元数据、预检零落库、用户档案按工作空间隔离              |
| v1.1     | 2026-09-18 | 补齐 v3 邀请码、单表成员导入、账号兼容 capability 与旧数据兼容                        |
| v1.0     | 2026-09-17 | 建立 v3 权威契约：组织、权限、双工作空间、两类项目、正式快照、Context API、迁移与测试 |
