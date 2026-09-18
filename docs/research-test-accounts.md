# PiLab 测试账号与身份速查（v2.5.1）

面向「我要用哪个账号登录，才能测到某个身份」。本文只回答账号与身份映射，数据清单与
业务链路验证步骤见 [`research-test-fixtures.md`](./research-test-fixtures.md)，
系统管理的操作路径见 [`research-system-management-testing.md`](./research-system-management-testing.md)。

文中的账号密码、工作区成员、组织角色、导师绑定、待评审/待审批数量均于 **2026-09-16** 在本机
开发栈上实测复核（复核方法与结果见 §7），与旧文档不一致处以本文为准。

## 1. 环境与登录入口

| 项目       | 值                                                                  |
| ---------- | ------------------------------------------------------------------- |
| 业务前端   | <http://127.0.0.1:3000>（局域网 <http://192.168.3.245:3000>）       |
| 实例管理端 | <http://127.0.0.1:3001>（god-mode，仅实例管理员可进）               |
| 后端 API   | <http://127.0.0.1:8001/api/>                                        |
| 工作区     | `public`（公共工作区，全员）、`pi`（主PI工作区，主PI与管理员）      |
| 科研模块   | `public` 工作区下 <http://127.0.0.1:3000/public/research/>          |
| 主PI看板   | `pi` 工作区下 <http://127.0.0.1:3000/pi/research/dashboard>         |
| 数据库     | 容器 `plane-plane-db-1`，库 `plane`，用户 `plane`                   |
| 密码口径   | 夹具账号统一 `Research@12345`；`admin@ai4ms.local` 为 `admin123456` |

登录即「账号 + 密码」，实例未配置 SMTP / OIDC，因此开发环境全部走本地密码登录。
并发测试多个身份时用浏览器隐私窗口，避免会话互相覆盖。

## 2. 账号速查表

### 2.1 实例级：系统管理员

| 身份                 | 账号                    | 密码             | 权限来源与范围                                                                  |
| -------------------- | ----------------------- | ---------------- | ------------------------------------------------------------------------------- |
| 系统管理员           | `admin@ai4ms.local`     | `admin123456`    | 实例管理员；`public` / `pi` 两个工作区管理员（role 20）；可进入 `:3001` 管理端  |
| 系统管理员（本人号） | `fangyikaii@163.com`    | 你原有密码       | 实例管理员；学院主 PI（`材料科学与工程学院` `PI`）+ `AI4MS 计算材料课题组` `PI` |
| 标签 · 开发管理员    | `dev.admin@ai4ms.local` | `Research@12345` | `DEV_ADMIN`：组织、模板、身份、平台、审计、账号全域配置权                       |
| 标签 · 运维管理员    | `ops.admin@ai4ms.local` | `Research@12345` | `OPS_ADMIN`：同上；业务数据仍按组织架构收敛                                     |
| 标签 · 主PI管理员    | `mainpi@ai4ms.local`    | `Research@12345` | `MAIN_PI`：同上，并进入 `pi` 工作区                                             |

> 管理员标签只扩大**配置权**，不扩大**数据可见范围**：标签持有者的报告、项目、阶段可见性
> 仍由组织架构 ACL 决定（见 §3）。标签的授予与撤销只有实例管理员可以做（`admin@ai4ms.local`
> 与 `fangyikaii@163.com` 都满足条件）。

### 2.2 组织级：Unit Admin / 主PI / 直接导师 / Reviewer / Research Owner

| 身份                     | 账号                            | 密码             | 组织位置与角色                                                                | 登录后先看什么                                                             |
| ------------------------ | ------------------------------- | ---------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Unit Admin               | `zhaoqiang.admin@ai4ms.local`   | `Research@12345` | `材料科学与工程学院` `UNIT_ADMIN`（学院节点）                                 | 组织架构管理入口；学院范围的 `UNIT` / `DIRECT_ADVISOR` 记录；待我评审 1 条 |
| 主PI                     | `zhangwei.pi@ai4ms.local`       | `Research@12345` | `张伟课题组` `PI`（primary）                                                  | 本课题组全部报告/阶段/审批；自己的预开题正在待评                           |
| 主PI（上级节点）         | `liming.pi@ai4ms.local`         | `Research@12345` | `李明课题组` `PI`（primary）                                                  | 实验室层 `ANCESTRY` 级记录，看不到兄弟课题组的 `PRIVATE`                   |
| 主PI（节点负责人）       | `wangfang.lab@ai4ms.local`      | `Research@12345` | `能源材料实验室` `OWNER`（primary）+ `王芳课题组` `PI`                        | 上级节点主 PI 视角：下级节点 `ANCESTRY` 级记录                             |
| 主PI（测试组）           | `test.pi@ai4ms.local`           | `Research@12345` | `测试组` `PI`（primary）；同时是 `test.owner` 的导师；`pi` 工作区成员         | 测试组报告与阶段；主PI工作区入口（测试组阶段已通过，无待评审）             |
| 直接导师                 | `chenjing.advisor@ai4ms.local`  | `Research@12345` | `张伟课题组` `ADVISOR`；绑定刘洋、孙浩、周敏（MentorBinding）                 | 三名被绑定学生的报告；阶段必评人（3 条指派已评完）                         |
| 直接导师（测试组）       | `test.advisor@ai4ms.local`      | `Research@12345` | `测试组` `ADVISOR`；绑定 `test.owner`                                         | 测试组学生报告与阶段                                                       |
| Reviewer                 | `zhengkai.reviewer@ai4ms.local` | `Research@12345` | `张伟课题组` `REVIEWER` + `石墨负极小组` `OWNER`                              | 被指派的阶段评审（待我评审 1 条）；本小组记录                              |
| Reviewer（测试组）       | `test.reviewer@ai4ms.local`     | `Research@12345` | `测试组` `REVIEWER`                                                           | 多人评审场景                                                               |
| Research Owner           | `liuyang.phd@ai4ms.local`       | `Research@12345` | 博士生，`张伟课题组` `REVIEWER`（学籍席位）；项目「石墨负极界面调控机理研究」 | 自己项目的全链路数据；6 种可见级别的报告（ACL 矩阵所有者）                 |
| Research Owner           | `sunhao.postdoc@ai4ms.local`    | `Research@12345` | 博士后，`张伟课题组` `REVIEWER`；项目「固态电解质界面原位表征方法研究」       | 开题阶段门槛全绿，可现场演示「提交评审」                                   |
| Research Owner           | `zhoumin.master@ai4ms.local`    | `Research@12345` | 硕士生，`张伟课题组` `REVIEWER`；项目「高熵合金涂层耐蚀性优化」               | 唯一持有 `CUSTOM` 报告授权的账号；材料不齐/文献不达标的红项                |
| Research Owner           | `wuting.project@ai4ms.local`    | `Research@12345` | 科研项目人员，`AI4MS 计算材料课题组` `REVIEWER`；导师为 `fangyikaii@163.com`  | 预开题被退回（带退回原因）；报告直接导师是 `fangyikaii@163.com`            |
| Research Owner（测试组） | `test.owner@ai4ms.local`        | `Research@12345` | 科研责任人，`测试组` `REVIEWER`；项目「验收科研项目」                         | 测试组主 PI 与导师都绑定在他身上，用于多人评审用例                         |

> 学生/博士后/科研项目人员在组织里的角色是 `REVIEWER`：这是唯一不授予节点管理权的角色，
> 因此学籍成员「看得到但不能管」。平台意义上的 **Research Owner** 指的是拥有个人科研项目的
> 那个人（项目 `owner`），不是组织角色名。

### 2.3 反向用例

| 身份                         | 账号                         | 密码             | 预期结果                                            |
| ---------------------------- | ---------------------------- | ---------------- | --------------------------------------------------- |
| 工作区成员（无科研组织关系） | `gaopeng.member@ai4ms.local` | `Research@12345` | 只能看到 `WORKSPACE` 级报告；科研菜单按 `NONE` 收敛 |
| 访客（Guest）                | `hexue.guest@ai4ms.local`    | `Research@12345` | 可登录，但科研接口 403、导航不渲染科研分组          |

## 3. 每个身份应该看到什么

### 3.1 六级可见范围 × 六类主体（`visibility_allows` 决策矩阵）

```text
                 PRIVATE  DIRECT_AD       UNIT   ANCESTRY  WORKSPACE     CUSTOM
owner                yes        yes        yes        yes        yes        yes
advisor               no        yes        yes         no        yes         no
unit_member           no         no        yes         no        yes        yes
ancestor_pi           no         no         no        yes        yes         no
admin                yes        yes        yes        yes        yes        yes
stranger              no         no         no         no        yes         no
```

- 用 `seed_research_demo --verify` 可重建该矩阵，结果必须逐格一致。
- 工作区报告默认可见级别是 `DIRECT_ADVISOR`（`workspace_research_settings.default_report_visibility`），
  夹具里的 `PRIVATE` / `WORKSPACE` / `ANCESTRY` / `CUSTOM` 报告是直接写库生成的。
- 当前库存 29 篇报告，可见级别分布：`DIRECT_ADVISOR` 15、`WORKSPACE` 7、`UNIT` 3、`PRIVATE` 2、
  `ANCESTRY` 1、`CUSTOM` 1。

### 3.2 科研菜单的可见矩阵（`ADMIN` / `PRINCIPAL` / `MENTOR` / `RESEARCHER`）

| 菜单     | 路径                 | ADMIN | PRINCIPAL | MENTOR | RESEARCHER |
| -------- | -------------------- | ----- | --------- | ------ | ---------- |
| 科研总览 | `/{slug}/research/`  | ✅    | ✅        | ✅     | ✅         |
| 报告     | `reports`            | ✅    | ✅        | ✅     | ✅         |
| 科研项目 | `projects`           | ✅    | ✅        | ✅     | ✅         |
| 办公审批 | `approvals`          | ✅    | ✅        | ✅     | ✅         |
| 主PI看板 | `dashboard`          | ✅    | ✅        | ❌     | ❌         |
| 提交汇总 | `reports/summary`    | ✅    | ✅        | ✅     | ❌         |
| 待我评审 | `reviews`            | ✅    | ✅        | ✅     | 按人       |
| 组织架构 | `settings/org`       | ✅    | ✅        | ❌     | ❌         |
| 系统管理 | `settings/system`    | ✅    | ❌        | ❌     | ❌         |
| 报告模板 | `settings/templates` | ✅    | ❌        | ❌     | ❌         |
| 身份映射 | `settings/identity`  | ✅    | ❌        | ❌     | ❌         |
| 平台配置 | `settings/platform`  | ✅    | ❌        | ❌     | ❌         |
| 审计记录 | `audit`              | ✅    | ❌        | ❌     | ❌         |
| 系统集成 | `integrations`       | ✅    | ❌        | ❌     | ❌         |

详细的四档级别判定与开关联动见 [`research-navigation-visibility.md`](./research-navigation-visibility.md)。

### 3.3 当前待办队列（2026-09-16 实测）

| 队列         | 数量与归属                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 待我评审     | 1 条：张伟的预开题（`SUBMITTED`），必评人为 `fangyikaii@163.com`（PI）、`zhaoqiang.admin@ai4ms.local`（UNIT_ADMIN）、`zhengkai.reviewer@ai4ms.local`（REVIEWER）；用这三个账号都能看到这条队列任务 |
| 办公审批     | 5 个实例：待第 1 级 1 个、待第 2 级 1 个、已通过 1 个、已驳回 1 个、已撤回 1 个                                                                                                                    |
| 阶段实例状态 | 刘洋 = 预开题/开题已通过 + 中期进行中；孙浩 = 预开题已通过 + 开题进行中；周敏 = 预开题进行中；吴婷 = 预开题退回修改；张伟 = 预开题待评审；测试组 = 预开题已通过                                    |

> 「待我评审」队列只收 `stage_instance.status = SUBMITTED` 的指派。库内还存在 2 条不会出现在队列里的
> 指派：吴婷的预开题停在 `NEEDS_REVISION`（退回态，尚未重新提交）、测试组的预开题已 `PASSED`
> 但指派未回收，二者都不会渲染成待办。

## 4. 与旧文档的差异（当前库实况）

1. **工作区已切换**：旧的 `fangyikai` 工作区已退役（`purge_workspaces`），现在只有 `public` 与 `pi`。
   [`research-test-fixtures.md`](./research-test-fixtures.md) 里 `/fangyikai/research/` 形式的链接
   需要改成 `/public/research/`；夹具数据全部落在 `public`（9 个科研项目、29 篇报告、36 个阶段实例）。
2. **组织树尚未收敛**：当前 `public` 工作区是**旧夹具树**，与代码里现行的单链不一致。
   实况：`材料科学与工程学院`(ROOT) → `材料科学与工程学院`(INSTITUTE) → `能源材料实验室` / `智能材料实验室`
   → `张伟课题组` / `李明课题组` / `王芳课题组` / `AI4MS 计算材料课题组`，其中 `张伟课题组` 下再挂
   `石墨负极小组`；`测试组` 与 `器件` 直接挂在 ROOT 下。代码里现行夹具的链是
   `材料科学与工程学院` → `能源材料实验室` → `材料课题组` → `石墨负极小组`。
   跑 `seed_research_demo --reset` 会删掉 `张伟课题组` / `李明课题组` / `王芳课题组` / `智能材料实验室` /
   `AI4MS 计算材料课题组` 这 5 个退役节点并重建为单链；`器件` 由验收夹具（`accept_system_management`）
   创建，不在清理名单里。
3. **主PI工作区成员**：`pi` 目前只有 `admin@ai4ms.local`（工作区管理员）、`dev.admin@ai4ms.local`、
   `ops.admin@ai4ms.local`、`mainpi@ai4ms.local`、`test.pi@ai4ms.local`。`zhangwei.pi@ai4ms.local`
   不在其中，测主PI聚合看板请用 `mainpi@ai4ms.local` 或 `test.pi@ai4ms.local`。
4. **`fangyikaii@163.com` 的工作区席位**：在 `public` 里是普通成员（role 15），不是工作区管理员；
   它作为实例管理员仍可进入 `:3001` 管理端，并按学院主 PI 的身份参与组织 ACL。

## 5. 登录行为与排错

登录接口 `POST /auth/sign-in/` 是**表单 POST**（`application/x-www-form-urlencoded`），
不是 JSON；同时需要 CSRF 令牌与已登记的来源（`CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS`）。

| 现象                                                       | 含义                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| `302` → `http://<web>/`（无 `error_code`）                 | 登录成功，随后前端跳转工作区                                 |
| `302` → `?error_code=5065&AUTHENTICATION_FAILED_SIGN_IN`   | 密码错误                                                     |
| `302` → `?error_code=5070&REQUIRED_EMAIL_PASSWORD_SIGN_IN` | 请求体没带上 `email` / `password`（常见于用 JSON 调接口）    |
| `302` → `?error_code=5900&RATE_LIMIT_EXCEEDED`             | 触发登录限流                                                 |
| 页面显示 CSRF Verification Failed                          | 来源未登记，或登录后复用了旧 CSRF 令牌（登录成功会轮换令牌） |

登录限流默认 `AUTHENTICATION_RATE_LIMIT="10/minute"`，按客户端 IP 计数。手工切换身份时若同 IP
连续登录超过 10 次/分钟会看到 `5900`，等一分钟或放慢节奏即可；开发环境可用
`docker exec plane-plane-redis-1 redis-cli --scan --pattern '*throttle_auth*'` 查看并清理计数键。

## 6. 重建与校验

```bash
# 幂等重建双工作区、管理员标签、组织根节点与测试组（可加 --with-demo 同时重建演示夹具）
docker compose -f docker-compose-local.yml exec api python manage.py seed_system_baseline --with-demo

# 重建 P0/P1 演示夹具并立即校验（打印 ACL 6x6 矩阵、待办队列与门槛结果）
docker compose -f docker-compose-local.yml exec api python manage.py seed_research_demo --verify

# 用真实库、真实接口、真实角色账号跑一遍系统管理验收
docker compose -f docker-compose-local.yml exec api python manage.py accept_system_management
```

## 7. 校验记录（2026-09-16）

复核方式：先在 API 容器内用 `User.check_password` 校验密码哈希，再对每个账号走一次真实
`POST /auth/sign-in/`（表单编码 + CSRF + `Origin: http://localhost:3000`），以「302 且无
`error_code`」判定登录成功。

| 复核项       | 结果                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| 密码哈希校验 | 20 / 20 通过（`Research@12345`；`admin@ai4ms.local` 为 `admin123456`）       |
| 真实登录     | 20 / 20 通过（302 且无 `error_code`，跳转 `http://192.168.3.245:3000`）      |
| 密码错误对照 | 错误密码登录 `test.pi@ai4ms.local` 返回 `5065 AUTHENTICATION_FAILED_SIGN_IN` |
| 未复核       | `fangyikaii@163.com`（本人账号，不在夹具密码口径内）                         |

已逐个验证的账号：`admin@ai4ms.local`、`dev.admin@ai4ms.local`、`ops.admin@ai4ms.local`、
`mainpi@ai4ms.local`、`zhaoqiang.admin@ai4ms.local`、`zhangwei.pi@ai4ms.local`、`liming.pi@ai4ms.local`、
`wangfang.lab@ai4ms.local`、`chenjing.advisor@ai4ms.local`、`zhengkai.reviewer@ai4ms.local`、
`liuyang.phd@ai4ms.local`、`sunhao.postdoc@ai4ms.local`、`zhoumin.master@ai4ms.local`、
`wuting.project@ai4ms.local`、`test.pi@ai4ms.local`、`test.advisor@ai4ms.local`、`test.owner@ai4ms.local`、
`test.reviewer@ai4ms.local`、`gaopeng.member@ai4ms.local`、`hexue.guest@ai4ms.local`。

工作区成员、组织角色、导师绑定、项目负责人、评审指派与待办数量均以 `plane-plane-db-1` 直查为准。

## 8. 变更记录

| 版本              | 日期       | 变更                                               |
| ----------------- | ---------- | -------------------------------------------------- |
| 初始版本（2.5.1） | 2026-09-16 | 新增测试账号与身份速查、登录行为排错与实况差异说明 |
