# Plane for AI4MS 科研测试夹具（P0 + P1）

面向手工测试的账号与数据速查表。夹具由管理命令 `seed_research_demo` 生成，覆盖
P0（组织架构、身份、权限、报告、审批、审计）与 P1（阶段流程、评审、文献、实验、代码、成果）的全部状态，
用于在真实界面上验证「提交 → 退回 → 评审 → 审批」链路与六级可见范围的收敛行为。

实现位置：

- `apps/api/plane/research/seed/scenario.py`（纯数据定义）
- `apps/api/plane/research/seed/builder.py`（幂等写入）
- `apps/api/plane/research/seed/verify.py`（只读校验）
- `apps/api/plane/db/management/commands/seed_research_demo.py`（命令入口）

## 1. 快速开始

所有命令在仓库根目录执行，目标是本机开发栈（web `:3000` → API 容器 `:8001` → `plane-db`）：

```bash
# 生成（或补齐）夹具：幂等，可重复执行
docker compose -f docker-compose-local.yml exec api python manage.py seed_research_demo

# 生成并立即校验：打印 ACL 6x6 矩阵、待办队列与门槛结果，失败返回非 0
docker compose -f docker-compose-local.yml exec api python manage.py seed_research_demo --verify

# 先删除本夹具创建的账号与记录，再重建（不动你手建的数据）
docker compose -f docker-compose-local.yml exec api python manage.py seed_research_demo --reset

# 彻底清空该工作区的科研数据：先看清单，再执行
docker compose -f docker-compose-local.yml exec api python manage.py seed_research_demo --wipe
docker compose -f docker-compose-local.yml exec api python manage.py seed_research_demo --wipe --yes

# 对象存储不可用时：只写附件/快照元数据，不上传真实文件
docker compose -f docker-compose-local.yml exec api python manage.py seed_research_demo --no-files
```

工作区：`public`（<http://192.168.3.245:3000/public/research/>）。夹具账号统一初始密码
**`Research@12345`**，邮箱域名 `@ai4ms.local`，仅用于本地无 SMTP / 无 OIDC 的测试环境。

> v2.4.0 起旧工作区 `fangyikai` 已退役，夹具数据落在双工作区模型的 `public` 里；
> 账号与身份的最新实测速查（含登录排错与实况差异）见
> [`research-test-accounts.md`](./research-test-accounts.md)。

## 2. 账号速查表

`fangyikaii@163.com` 保持原密码不变，只补齐科研角色：实例管理员 + 学院主 PI + `材料课题组`
主 PI + 阶段评审人 + 审批人。

| 邮箱                            | 姓名 | 身份与组织位置                             | 预期能看到什么                                                    |
| ------------------------------- | ---- | ------------------------------------------ | ----------------------------------------------------------------- |
| `zhangwei.pi@ai4ms.local`       | 张伟 | 材料课题组主 PI（primary）+ 科研项目负责人 | 本课题组全部报告/阶段/审批；被自动指派为本组阶段评审人            |
| `liming.pi@ai4ms.local`         | 李明 | 能源材料实验室 PI（primary）               | 实验室层面的 `ANCESTRY` 级记录；看不到材料课题组的 PRIVATE 级记录 |
| `wangfang.lab@ai4ms.local`      | 王芳 | 能源材料实验室负责人（OWNER，primary）     | 实验室下课题组的 `ANCESTRY` 级记录（非管理员，验证上级节点主 PI） |
| `zhaoqiang.admin@ai4ms.local`   | 赵强 | 学院组织管理员（UNIT_ADMIN）               | 组织架构管理入口；学院范围的 `DIRECT_ADVISOR` / `UNIT` 记录       |
| `chenjing.advisor@ai4ms.local`  | 陈静 | 直接导师（ADVISOR，材料课题组）            | 被绑定学生（刘洋 / 周敏 / 孙浩）的全部报告；阶段必评人            |
| `zhengkai.reviewer@ai4ms.local` | 郑凯 | 评审人（材料课题组）+ 石墨负极小组负责人   | 被指派的阶段评审；本小组记录                                      |
| `liuyang.phd@ai4ms.local`       | 刘洋 | 博士生（材料课题组）                       | 自己项目全链路数据 + 6 篇不同可见范围的报告（ACL 矩阵所有者）     |
| `zhoumin.master@ai4ms.local`    | 周敏 | 硕士生（材料课题组）                       | 被显式授权的 `CUSTOM` 报告；同课题组 `UNIT` 级记录                |
| `sunhao.postdoc@ai4ms.local`    | 孙浩 | 博士后（材料课题组）                       | 自己的项目：预开题已通过、开题门槛全绿可现场提交                  |
| `wuting.project@ai4ms.local`    | 吴婷 | 科研项目人员（材料课题组，导师=fangyikai） | 自己的项目：预开题被退回（带退回原因），报告直接导师是 fangyikai  |
| `gaopeng.member@ai4ms.local`    | 高鹏 | 工作区成员，未挂任何科研组织关系           | 只能看到 `WORKSPACE` 级报告（ACL 反向用例）                       |
| `hexue.guest@ai4ms.local`       | 何雪 | 访客（Guest）                              | 科研接口一律 403，导航不渲染                                      |

> 学生使用 `REVIEWER` 角色登记所属课题组：这是组织角色里唯一不授予节点管理权的角色，
> 因此学籍成员只能"看得到"，不能"管得着"。

## 2.1 系统管理基线（v2.4.0）

`manage.py seed_system_baseline` 建立在 `2.4.0` 的双工作区模型上：公共工作区 `public`
（全员）与主PI工作区 `pi`（主PI/管理员）。命令幂等，可重复执行。

```bash
# 建两个工作区 + 管理员标签 + 组织根节点 + 测试组（可加 --with-demo 重建演示夹具）
docker compose -f docker-compose-local.yml exec api python manage.py seed_system_baseline --with-demo

# 把已注册账号补进公共工作区
docker compose -f docker-compose-local.yml exec api python manage.py seed_system_baseline --backfill-members

# 退役旧工作区（先备份数据库；账号保留）
docker compose -f docker-compose-local.yml exec api python manage.py purge_workspaces --slugs fangyikai,testworkspace,testtest --yes
```

| 邮箱                        | 姓名           | 管理员标签  | 说明                                             |
| --------------------------- | -------------- | ----------- | ------------------------------------------------ |
| `admin@ai4ms.local`         | 系统管理员     | -           | 实例管理员，唯一可授予标签的账号                 |
| `dev.admin@ai4ms.local`     | 开发管理员     | `DEV_ADMIN` | 全域配置权（组织、模板、身份、平台、审计、账号） |
| `ops.admin@ai4ms.local`     | 运维管理员     | `OPS_ADMIN` | 同上；业务数据仍按组织架构                       |
| `mainpi@ai4ms.local`        | 主PI管理员     | `MAIN_PI`   | 同上；进入主PI工作区                             |
| `test.pi@ai4ms.local`       | 测试主PI       | -           | 测试组 `PI`，同时是测试科研责任人的导师          |
| `test.advisor@ai4ms.local`  | 测试导师       | -           | 测试组 `ADVISOR`                                 |
| `test.owner@ai4ms.local`    | 测试科研责任人 | -           | 测试组 `REVIEWER`（科研责任人）                  |
| `test.reviewer@ai4ms.local` | 测试评审人     | -           | 测试组 `REVIEWER`，用于多人评审                  |

邀请码与批量导入的完整流程见
[系统管理改进 PRD](./research-system-management-prd.md) §2.3 / §2.4 与
[验收记录](./research-system-management-acceptance.md)。

## 3. 组织树

自上而下每个类别只保留一个节点，形成一条 4 层单链（+ 既有 ROOT）：

```text
fangyikai（既有 ROOT 节点）
└── 材料科学与工程学院（INSTITUTE）
    └── 能源材料实验室（LAB）—— 负责人 王芳（OWNER）；PI 李明
        └── 材料课题组（GROUP）—— 主 PI 张伟；主 PI fangyikai
            └── 石墨负极小组（TEAM）—— 负责人 郑凯
```

每个类别（`INSTITUTE` / `LAB` / `GROUP` / `TEAM`）各一个节点，用于验证层级可见范围、
祖宗节点主 PI 与组织架构页面的树形交互。

> 旧版本的夹具还会生成 `张伟课题组` / `李明课题组` / `王芳课题组` / `智能材料实验室` /
> `AI4MS 计算材料课题组`。这些名字已退役：`seed_research_demo --reset` 会连它们一起删除，
> 所以老库执行 `--reset` 后再跑一次即可收敛到单链。若手建报告以 PROTECT 外键指向旧节点导致
> `--reset` 失败，退路是 `seed_research_demo --wipe --yes` 后重新 seed。

## 4. 生成的数据

### 4.1 P0

| 项目         | 数量与覆盖                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 科研项目     | 8 个（1 个已归档，用于归档/恢复测试；1 个空态）                                                                                |
| 周报 / 月报  | 27 篇（22 篇周报 + 6 篇月报，含 6 篇 ACL 矩阵报告）：DRAFT / SUBMITTED / NEEDS_REVISION / ACCEPTED 全覆盖                      |
| 报告审核历史 | 34 条 `SUBMIT` / `RETURN` / `ACCEPT`，退回记录带可读原因                                                                       |
| 报告附件     | 3 个真实对象（PDF / PNG / MD），存入 MinIO，可下载与预览                                                                       |
| 自定义授权   | 1 条 `CUSTOM` 报告的用户级授权（周敏）                                                                                         |
| 办公审批     | 3 条审批流（采购 2 级 ANY / 任务 1 级 / 实验室 PI 会签 ALL）+ 5 个实例：待第 1 级、待第 2 级、已通过、已驳回（带原因）、已撤回 |
| 工作项       | 20 条（采购、安全审查、投稿准备、设备机时等），审批实例均绑定到具体工作项                                                      |
| 身份映射     | 5 条 `ai4ms-oidc` 映射（4 ACTIVE + 1 SUSPENDED）                                                                               |
| 报告模板     | 2 个报告模板（周报 / 月报，均为默认）+ 2 个阶段材料模板（选题说明 / 技术路线）                                                 |
| 审计记录     | 组织、成员、导师、身份、报告、审批、阶段、文献、实验、代码、成果等动作均写入只追加审计                                         |
| 站内通知     | 报告提交/退回/验收与阶段提交/退回/通过按现有通知管道写入（不发邮件）                                                           |

### 4.2 P1

| 项目            | 数量与覆盖                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| 阶段实例        | 36 个（8 个项目 × 4 阶段；已初始化）                                                                    |
| 阶段材料        | 33 篇（刘洋 16、孙浩 12、周敏 1、吴婷 2、张伟 2），均带 Page 正文与 v1 版本快照                         |
| 阶段评审        | 9 条评审 + 13 条评审人指派（自动指派导师/主 PI，手工指派学院主 PI、组织管理员、评审人）                 |
| 阶段流转记录    | 17 条 `ENTER` / `SUBMIT` / `PASS` / `RETURN`，含门槛快照与评审快照                                      |
| 文献登记        | 95 条：INCLUDED / COLLECTED / SCREENED / EXCLUDED，含 1 条缺摘要与 gap 的不完整记录、1 条无可验证来源   |
| 实验记录        | 14 条：PLANNED / RUNNING / COMPLETED / FAILED，含 1 条未填写状态说明的 RUNNING（中期门槛红项）          |
| 实验版本与修订  | 11 个版本快照 + 2 条已批准的修订（v1 → v2，锁定字段不变）                                               |
| 代码仓库 / 制品 | 5 个仓库（GitHub / GitLab / Gitea / Local git；含 1 个 `SYNC_FAILED`）+ 9 个制品（含 2 个真实快照 zip） |
| 成果登记        | 8 条（论文 / 专利 / 软件 / 数据集 / 奖项），含与代码快照的关联                                          |

### 4.3 阶段状态一览

| 项目                | 预开题        | 开题           | 中期   | 结题   | 用途                                   |
| ------------------- | ------------- | -------------- | ------ | ------ | -------------------------------------- |
| 刘洋（博士）        | 已通过        | 已通过         | 进行中 | 未开始 | 完整通过链 + 中期门槛红项（4/7 材料）  |
| 孙浩（博士后）      | 已通过        | 进行中（全绿） | 未开始 | 未开始 | 现场演示"提交评审"成功                 |
| 周敏（硕士）        | 进行中（1/2） | 未开始         | 未开始 | 未开始 | 材料不齐 + 文献不达标的红项            |
| 吴婷（科研项目）    | 退回修改      | 未开始         | 未开始 | 未开始 | 退回原因与历史留痕                     |
| 张伟（课题组主 PI） | 待评审        | 未开始         | 未开始 | 未开始 | 「待我评审」队列（fangyikai 为必评人） |
| 李明 / 王芳         | 未开始        | 未开始         | 未开始 | 未开始 | 空态                                   |

## 5. 每个身份"应该看到什么"

`--verify` 会用生产 ACL（`visibility_allows`）重建六级可见范围 × 六类主体的决策矩阵，
结果必须与 P0 验收矩阵逐格一致：

```text
                 PRIVATE  DIRECT_AD       UNIT   ANCESTRY  WORKSPACE     CUSTOM
owner                yes        yes        yes        yes        yes        yes
advisor               no        yes        yes         no        yes         no
unit_member           no         no        yes         no        yes        yes
ancestor_pi           no         no         no        yes        yes         no
admin                yes        yes        yes        yes        yes        yes
stranger              no         no         no         no        yes         no
```

- `owner` = 刘洋（矩阵报告作者）；`advisor` = 陈静（MentorBinding）；`unit_member` = 周敏（同课题组）；
  `ancestor_pi` = 王芳（上级能源材料实验室的 OWNER，非管理员）；`admin` = fangyikai；`stranger` = 高鹏。
- `CUSTOM` 报告只授权给 `周敏`（用户级）：若改成节点级授权，`advisor` 一列会因为同节点成员关系变成
  `yes`，矩阵就不再与验收口径一致，所以夹具刻意只发用户级授权。
- 矩阵报告由夹具直接写库：API 的作者路径受"只能收窄"约束（工作区默认级别是 `DIRECT_ADVISOR`），
  宽于默认级别的报告在生产里需要管理员或放宽默认级别后才能出现。

## 6. 手工验证流程（建议顺序）

1. **执行夹具**：`seed_research_demo --verify`，确认矩阵全绿、`fangyikai` 可见 28 篇报告、
   1 条待评审、1 条待审批。
2. **报告页**（`/research/reports`）：切换周期 `2026-W38`，确认能看到学生的 DRAFT /
   SUBMITTED / NEEDS_REVISION / ACCEPTED 四类报告；打开刘洋本周报告，下载 PDF 附件。
3. **提交汇总**（`/research/reports/summary`）：确认「未提交」名单里出现李明与王芳（他们当期没有报告）。
4. **待我评审**（`/research/reviews`）：张伟的预开题在队列中；进入后查看材料与门槛清单，
   可提交评审（通过 / 否决 / 退回）。
5. **待我审批**（`/research/approvals`）：一条采购申请停在第 1 级（PI）等你处理；另有一条停在第 2 级、
   一条已通过、一条已驳回（带原因）、一条已撤回。
6. **组织架构**（`/research/settings/org`）：确认 4 层单链组织树、成员角色（PI / ADVISOR / REVIEWER /
   UNIT_ADMIN / OWNER）与导师绑定（陈静→刘洋/周敏/孙浩，fangyikai→吴婷）。
7. **科研项目**：打开刘洋的「石墨负极界面调控机理研究」，逐个查看「科研阶段 / 文献调研 / 实验条目 /
   代码管理 / 论文与成果 / 时间线」；中期阶段的门槛清单应出现 2 个红项（材料齐备、未完成实验说明）；
   打开孙浩的「固态电解质界面原位表征方法研究」，开题阶段门槛全绿，可直接点「提交评审」。
8. **身份切换复核**：用 `liuyang.phd@ai4ms.local` 提交报告、用 `chenjing.advisor@ai4ms.local`
   退回或验收、用 `wangfang.lab@ai4ms.local` 确认只看得到 `ANCESTRY` 级记录、用
   `gaopeng.member@ai4ms.local` 确认只剩 `WORKSPACE` 级报告、用 `hexue.guest@ai4ms.local`
   确认科研接口返回 403。

## 7. 重置与清空的边界

| 命令           | 行为                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| 默认执行       | 幂等补齐：已存在的账号、组织、项目、报告、阶段、审批按自然键跳过，不产生重复数据                               |
| `--reset`      | 删除夹具创建的 12 个账号、8 个科研项目、组织节点及其关联记录；**不触碰**你手建的 `2026-W38` 报告与既有科研项目 |
| `--wipe`       | 先打印该工作区科研数据清单（项目 / 报告 / 阶段 / 文献 / 实验 / 代码 / 成果 / 审批 / 组织）                     |
| `--wipe --yes` | 真正清空该工作区的科研数据，包含你手建的部分                                                                   |

- **审计只增不减**：`--reset` 与 `--wipe` 都不删除 `research_audit_events`，审计页会保留历史动作，
  这是 P0 的既有保证。
- **只追加证据的清理**：阶段流转、材料版本、评审修订、实验版本使用 `PROTECT` 外键且拒绝 ORM 删除，
  夹具用带项目范围的 SQL 删除这些证据行，`--verify` 与单元测试覆盖了这条路径。
- 软删除说明：Plane 的项目/页面等模型默认是软删除（只写 `deleted_at`）。夹具在重置时使用硬删除，
  否则项目标识符（identifier）会被残留行占用而无法重复建库。

## 8. 已知限制

- 统一初始密码与 `@ai4ms.local` 邮箱只适用于本地测试环境；生产必须通过 AI4MS OIDC 登录。
- 未配置 SMTP：报告与阶段通知只写站内通知（`Notification`），不会发邮件。
- 文献 DOI 使用明显虚构的 `10.9999/ai4ms.demo.*` 前缀与合成标题，避免被误引为真实文献。
- 工作区报告默认可见级别保持 `DIRECT_ADVISOR` 不变，夹具不修改平台策略；只有矩阵报告直接写库。
- 访客（Guest）在 ACL 层只受 `WORKSPACE` 级限制，但接口层会整体拒绝（403），界面上也不渲染科研导航。

## 9. 变更记录

| 版本                  | 日期       | 变更                                                                              |
| --------------------- | ---------- | --------------------------------------------------------------------------------- |
| 初始版本（2.3.0）     | 2026-09-16 | 新增 P0 + P1 科研测试夹具、`seed_research_demo` 命令与校验能力                    |
| 系统管理基线（2.4.0） | 2026-09-16 | 新增双工作区、管理员标签账号与「测试组」夹具，见 `seed_system_baseline`           |
| 组织树单链化（2.5.1） | 2026-09-16 | 演示组织树收敛为「学院→实验室→课题组→小组」各一个节点；`--reset` 一并清理退役节点 |
