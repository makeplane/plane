# AI4MS Plane 系统管理改进 PRD（v2.4.0）

| 项目     | 内容                                                                                   |
| -------- | -------------------------------------------------------------------------------------- |
| 文档状态 | 已交付                                                                                 |
| 文档版本 | v1.0                                                                                   |
| 日期     | 2026-09-16                                                                             |
| 对应版本 | `2.4.0`                                                                                |
| 适用范围 | Plane 系统管理改造：双工作区、管理员标签、邀请码注册、批量导入、主PI聚合与验收         |
| 上游文档 | [research-management-prd-roadmap.md](./research-management-prd-roadmap.md) §5.3（P2）  |
| 验收记录 | [research-system-management-acceptance.md](./research-system-management-acceptance.md) |

## 1. 背景与目标

上线后的实际问题与最初设计不一致：

1. 每个人注册后都会自建工作区，组织无法统一管理。
2. 管理员等同于“工作区管理员”，无法表达“开发管理员 / 运维管理员 / 主PI”三类真实岗位。
3. 新用户注册没有门槛，无法控制谁能进入系统。
4. 人员名单维护在二维表里，需要一个可复用（开发环境用好、生产环境直接用）的导入通道。

本版目标：把“人和组织”先管起来，业务功能保持 P0/P1 已有行为不变。

## 2. 功能范围

### 2.1 两个工作区

- 公共工作区（`public`，名称「公共工作区」）：服务所有人，承载组织架构、科研项目、报告、阶段、实验、代码、成果与审批等全部业务数据。
- 主PI工作区（`pi`，名称「主PI工作区」）：只服务主PI与管理员；既是标准工作区（可处理主PI自己的科研事务），也提供跨组聚合看板与管理入口。
- 实例配置一律收紧：`DISABLE_WORKSPACE_CREATION=1`、`ENABLE_SIGNUP=0`、`ENABLE_MAGIC_LINK_LOGIN=0`。
- 新注册用户自动进入公共工作区（Member，role=15），不能自建工作区；只有主PI/管理员进入主PI工作区。
- 旧工作区（`fangyikai` / `testworkspace` / `testtest`）在开发环境备份后删除：`manage.py purge_workspaces --slugs ... --yes`，账号本身保留。

### 2.2 管理员标签

- 实例级模型 `InstanceRoleAssignment`：`DEV_ADMIN`（开发管理员）、`OPS_ADMIN`（运维管理员）、`MAIN_PI`（主PI）。
- 仅系统默认管理员（`admin@ai4ms.local` 等 `InstanceAdmin`）可以授予/撤销标签，入口在实例管理端（god-mode `:3001`）「用户与角色」页。
- 持有任一标签即拥有**全域配置权**：组织架构、报告模板、身份映射、平台配置、审计记录、邀请码、批量导入。
- 标签**不**扩大业务数据可见范围：报告/项目/阶段等仍按组织架构 ACL（主PI=本节点+子树，导师=被绑定学生，Research Owner=自己）。
- 授予标签会自动把账号加入 `public` 与 `pi` 两个工作区（Member，不设为工作区管理员），撤销最后一个标签时收回 `pi` 席位（公共工作区席位保留）。

### 2.3 邀请码注册

- 模型 `ResearchInviteCode`：`code`（URL 安全随机串）、`org_role`、`org_unit`、`max_uses`、`used_count`、`expires_at`、`status`。
- 状态：`ACTIVE / DISABLED / EXPIRED / EXHAUSTED`（后两者按时间与用量计算）。
- 接口：`GET/POST /api/research/workspaces/<slug>/invite-codes/`、`PATCH/DELETE .../<id>/`、`POST .../<id>/enable|disable/`。
- 注册门槛：开放注册关闭时，只有携带可用邀请码的注册请求可以通过；缺失/无效/过期/用尽分别返回 `5057 / 5058` 错误码，前端给出中英双语提示。
- 注册成功后原子消耗一次使用次数，账号自动加入公共工作区，并按邀请码写入 `OrgUnitMember`（角色 + 节点）与科研档案。
- 管理员可复制注册链接（`/sign-up?invite_code=...`）线下分发，注册页也会从 URL 预填邀请码。
- 注册入口常显：`ENABLE_SIGNUP=0` 关闭的是「自助注册」，不是注册入口本身；登录页右上角始终保留「创建账号（仅限邀请）」链接，否则邀请码没有兑换入口。
- 界面即门槛：注册页首屏提示「仅限邀请注册」，邀请码为必填项（未填写时「创建账号」不可提交），提交被拒后停留在注册页并回显邀请码字段与错误原因（`5057/5058`），邀请码在整页跳转间保留。
- 默认口径一致：`ENABLE_SIGNUP` 在注册门禁与实例配置接口（界面 `enable_signup`）中的缺省值统一为 `0`（关闭）；未配置该键时按「仅限邀请」处理，不再出现界面显示仅限邀请、接口仍接受自助注册的错位。

### 2.4 二维表批量导入

- 模型：`UserImportBatch`（批次）、`UserImportRow`（逐行结果）、`ResearchUserProfile`（科研档案：学号/年级/学位/电话/人员类别/分组/来源批次）。
- 输入列（表头中英文容错）：分组、姓名、学号、年级、学位、负责导师、邮件、电话；另可传「导师姓名 → 邮箱」对照表。
- 落库规则：
  - 分组自动建为 `GROUP` 节点，挂在根节点（默认「材料科学与工程学院」）下；
  - 分组为空的行挂根节点并在报告中单列；
  - 学生建为 Research Owner 账号（组织角色 `REVIEWER`，无节点管理权），写入科研档案；
  - 导师按对照表创建/复用账号并写 `MentorBinding`；缺少导师邮箱映射的行标记为 `PENDING`，不阻塞其他行；
  - 按邮箱（其次按学号）幂等 upsert，重复导入不重复建号；学号冲突视为数据错误并逐行拒绝。
- 凭证：新账号生成一次性初始密码并置 `is_password_reset_required=True`，导入报告（CSV）可下载；首次登录会强制改密，改密后自动清除标记。
- 双通道：管理页 `/research/settings/system`（预检 → 正式导入 → 报告下载/历史批次）与命令
  `manage.py import_users_from_csv --students roster.csv [--advisors advisors.csv] --dry-run|--yes [--strict]`。

### 2.5 主PI看板

- `GET /api/research/workspaces/<slug>/aggregate/`：只读聚合 `public` 工作区中「调用者管理节点 + 子树」的项目、报告、阶段、评审、审批与成员数量，并回传范围内的组织节点。
- 数据权威仍在公共工作区，主PI工作区不复制、不双写；看板卡片跳回公共工作区对应页面。
- 无任何组织关系的账号返回空范围（`scope.is_empty=true`），前端给出明确说明。

## 3. 接口与数据变更

| 类型     | 变更                                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 模型     | `InstanceRoleAssignment`（license）、`ResearchInviteCode`、`ResearchUserProfile`、`UserImportBatch`、`UserImportRow`（db）                                      |
| 迁移     | `license/0008_instanceroleassignment`、`db/0140_research_system_management`                                                                                     |
| 接口     | `/api/instances/users/`、`/api/instances/users/<id>/roles/`；`/api/research/workspaces/<slug>/invite-codes/…`、`user-imports/…`、`user-profiles/`、`aggregate/` |
| 命令     | `seed_system_baseline`、`purge_workspaces`、`import_users_from_csv`                                                                                             |
| 前端类型 | `TAdminRole`、`TInviteCode`、`TResearchUserProfile`、`TUserImportBatch`、`TUserImportRow`、`TPiAggregate`、`TInstanceUser`                                      |
| 兼容性   | 研究命名空间只增不改；`identity/me` 只新增字段（`is_research_admin`/`is_system_admin`/`admin_roles`/`workspaces`/`profile`），既有字段保留                      |

## 4. 权限矩阵

| 能力                       | 系统默认管理员 | 三类管理员标签 | 工作区管理员 | 组织管理角色（PI/OWNER/UNIT_ADMIN） | 普通成员 |
| -------------------------- | -------------- | -------------- | ------------ | ----------------------------------- | -------- |
| 授予/撤销管理员标签        | ✅             | ❌             | ❌           | ❌                                  | ❌       |
| 组织架构 / 报告模板配置    | ✅             | ✅             | ✅           | 仅本节点及子树                      | ❌       |
| 身份映射 / 平台配置 / 审计 | ✅             | ✅             | ✅           | ❌                                  | ❌       |
| 邀请码 / 批量导入          | ✅             | ✅             | ✅           | ❌                                  | ❌       |
| 本组业务数据               | 按组织         | 按组织         | 按组织       | 本节点及子树                        | 按 ACL   |
| 主PI工作区成员席位         | ✅             | ✅             | ❌           | ❌                                  | ❌       |

## 5. 术语

- **公共工作区**：`public`，全员业务工作区，业务数据唯一权威来源。
- **主PI工作区**：`pi`，主PI/管理员的聚合与管理工作区。
- **管理员标签**：实例级岗位标签（开发/运维/主PI），只影响配置权，不影响数据可见范围。
- **邀请码**：一次性或多次可用的注册凭据，携带目标组织角色与节点。
- **待处理行**：导入过程中缺少导师邮箱映射或分组为空的记录，账号已创建但仍需管理员补充信息。
