# 系统管理改进验收记录（v2.4.0）

| 项目     | 内容                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------- |
| 验收对象 | 双工作区、管理员标签、邀请码注册、二维表批量导入、主PI聚合                                          |
| 对应版本 | `2.4.0`                                                                                             |
| 验收日期 | 2026-09-16                                                                                          |
| 环境     | 开发环境（`docker-compose-local.yml`，`public` / `pi` 两个工作区，OIDC 关闭、SMTP 关闭）            |
| 复现命令 | `python manage.py seed_system_baseline [--with-demo]` → `python manage.py accept_system_management` |
| 结论     | 自动化测试全绿 + 8/8 真实跑通检查通过                                                               |

## 1. 验收方法

三层验证，缺一不可：

| 层级       | 手段                                                                     | 覆盖                                             |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| 自动化测试 | `docker compose -f docker-compose-test.yml run --rm api-tests pytest`    | 角色标签、邀请码、导入、主PI聚合、工作区退役助手 |
| 真实跑通   | `manage.py accept_system_management`（真实库 + 真实接口 + 真实角色账号） | 测试组端到端流程与权限矩阵                       |
| 回归       | 既有 P0 / P1 测试集 + 前端 `check:types`                                 | 科研模块既有行为与前端类型安全                   |

## 2. 自动化测试结果

```
$ docker compose -f docker-compose-test.yml run --rm api-tests pytest -q --create-db
1078 passed, 99 warnings in 520.13s
```

新增用例：

| 文件                                                     | 覆盖内容                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `plane/tests/contract/app/test_research_admin_roles.py`  | 只有实例管理员能发标签、配置面放行、数据面不放行、席位同步   |
| `plane/tests/contract/app/test_research_invite_codes.py` | 签发/停用/删除、过期/用尽/无效、注册门禁、兑换入区与组织绑定 |
| `plane/tests/contract/app/test_research_user_import.py`  | 建号、建组织节点、导师绑定、待处理行、幂等、预检、报告下载   |
| `plane/tests/contract/app/test_research_pi_workspace.py` | 聚合范围（本节点+子树）、空范围、阶段阻塞统计、PI 主PI区席位 |
| `plane/tests/unit/research/test_user_import_parser.py`   | 表头别名、GB18030/UTF-8、XLSX、学位口径                      |
| `plane/tests/unit/research/test_workspace_retirement.py` | 工作区退役的 SQL 条件与“子表先删”顺序                        |

> 说明：`pytest.ini` 使用 `--reuse-db --nomigrations`，在容器复用场景下 smoke 用例会因历史库状态报错；
> 上表结果使用 `--create-db` 全新库，与 `main` 分支同一命令的对比结果是：改造前 1009 passed / 30 errors，
> 改造后 1078 passed / 0 failed / 0 errors。

前端检查（`pnpm check:types`、`pnpm check:lint`、`pnpm --filter=web build`、`pnpm --filter=admin build`）全部通过。

## 3. 真实测试组跑通结果

开发环境执行：

```bash
docker compose -f docker-compose-local.yml exec api python manage.py seed_system_baseline --with-demo
docker compose -f docker-compose-local.yml exec api python manage.py accept_system_management   # 退出码 0
```

命令输出（节选，完整输出见运行日志）：

```
[PASS] 双工作区与测试组基线 - 6 step(s) verified
    ok 公共工作区存在 | public
    ok 主PI工作区存在 | pi
    ok 组织节点「测试组」存在
    ok test.pi@ai4ms.local 是测试组 PI
    ok test.advisor@ai4ms.local 是测试组 ADVISOR
    ok test.owner@ai4ms.local 是测试组 REVIEWER
[PASS] 管理员标签：授予、撤销与席位同步 - 7 step(s) verified
    ok dev.admin@ai4ms.local 持有 DEV_ADMIN
    ok dev.admin@ai4ms.local 已加入两个工作区 | 2 seat(s)
    ok ops.admin@ai4ms.local 持有 OPS_ADMIN
    ok mainpi@ai4ms.local 持有 MAIN_PI
    ok 标签持有者是普通成员（不绕过组织数据边界）
[PASS] 邀请码：签发、门禁与兑换 - 6 step(s) verified
    ok 管理员可签发邀请码 | HTTP 201
    ok 普通成员无法签发邀请码 | HTTP 403
    ok 有效邀请码可通过注册门禁
    ok 无效邀请码被门禁拒绝
    ok 兑换后自动加入公共工作区
    ok 兑换后写入组织关系与科研档案
[PASS] 二维表导入：建号、建组织、建导师关系 - 9 step(s) verified
    ok 预检不写账号
    ok 正式导入成功 | ok=1 pending=1
    ok 缺少导师邮箱的行进入待处理 | pending=1
    ok 分组自动建成组织节点
    ok 导师关系已建立
    ok 科研档案写入学号与学位
    ok 一次性密码要求首登改密
[PASS] 科研提交审批流程（提交→退回→重提交→接受） - 7 step(s) verified
    ok 提交周报 | HTTP 200
    ok 主PI退回周报 | HTTP 200
    ok 重新提交 | HTTP 200
    ok 主PI接受周报 | HTTP 200
    ok 周报最终状态为已接受 | ACCEPTED
[PASS] 阶段流程（进入→闸门→提交→多人评审→通过） - 11 step(s) verified
    ok 闸门生效（不足条件时拒绝提交或直接通过） | HTTP 422 stage_gate_blocked
    ok 管理员调整闸门配置 | HTTP 200
    ok 阶段提交成功 | HTTP 200
    ok 主PI指派多名评审人 | 2/2 assigned
    ok test.reviewer@ai4ms.local 提交评审 | HTTP 201
    ok test.advisor@ai4ms.local 提交评审 | HTTP 201
    ok 主PI通过阶段 | HTTP 200
[PASS] 管理员标签的配置权限矩阵 - 5 step(s) verified
    ok dev.admin@ai4ms.local 可配置平台参数 | HTTP 200
    ok ops.admin@ai4ms.local 可配置平台参数 | HTTP 200
    ok mainpi@ai4ms.local 可配置平台参数 | HTTP 200
    ok 普通成员被拒绝 | HTTP 403
    ok 标签持有者不能自行授予标签 | HTTP 403
[PASS] 主PI工作区聚合范围 - 5 step(s) verified
    ok 聚合接口可访问 | HTTP 200
    ok 聚合来源是公共工作区
    ok 范围非空（测试组在范围内） | units=1
    ok 范围内包含「测试组」 | 测试组
    ok 无组织关系的账号看到空范围 | HTTP 404

结论：8 / 8 项通过
全部验收项通过。
```

命令是幂等的：重复执行会重置属于验收自身的周报与阶段实例（`2026-W20` 周期、`PRE_OPENING` 阶段），
不会影响其他数据。

### 3.1 界面核对清单

自动化与脚本验证的是接口行为；界面按下列清单人工核对（开发环境浏览器打开对应地址即可）：

| 页面                                | 核对点                                                           |
| ----------------------------------- | ---------------------------------------------------------------- |
| `/public/research/settings/system`  | 顶部显示当前账号的管理员标签（只读）；可生成/停用/删除邀请码     |
| 同上（批量导入区）                  | 上传学生表 + 导师表 → 预检 → 正式导入 → 报告下载、历史批次列表   |
| `/pi/research/dashboard`            | 主PI工作区看板显示测试组范围内的项目/报告/阶段/评审/审批数量     |
| `/pi` 与 `/public` 的工作区切换菜单 | 两个工作区都可见（标签账号），普通成员只看到 `public`            |
| 实例管理端 `:3001/users`            | 用户列表 + 三个标签按钮，点击即授予/撤销，`public`/`pi` 席位同步 |
| `/sign-up?invite_code=…`            | 注册页预填邀请码；邀请码缺失或失效时给出中英双语错误提示         |
| 导入账号首次登录                    | 出现「请设置你自己的密码」强制改密弹窗，改密后不再出现           |

## 4. 环境切换与数据处置记录

| 步骤               | 命令                                                                               | 结果                                                          |
| ------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 备份               | `pg_dump -U plane -d plane`                                                        | `/tmp/plane-runtime/plane-db-20260916-v240-preupgrade.sql.gz` |
| 迁移               | `python manage.py migrate`                                                         | `db.0140`、`license.0008` 应用成功                            |
| 建双工作区与测试组 | `python manage.py seed_system_baseline --with-demo`                                | `public` / `pi` 创建，演示夹具重建到 `public`                 |
| 退役旧工作区       | `python manage.py purge_workspaces --slugs fangyikai,testworkspace,testtest --yes` | 218 行科研数据清空，3 个旧工作区删除，账号保留                |
| 补充成员           | `python manage.py seed_system_baseline --backfill-members`                         | 已注册账号全部进入 `public`                                   |
| 复验               | `python manage.py accept_system_management`                                        | 8/8 通过，退出码 0                                            |

退役后工作区清单：

```
  slug  |    name
--------+-------------
 pi     | 主PI工作区
 public | 公共工作区
```

## 5. 已知限制与后续项

1. 邀请码的注册入口依赖注册页提交 `invite_code` 字段；OAuth / OIDC 首次登录暂不走邀请码（生产若统一走 OIDC，由身份映射与首次登录建号流程接管，见 P0 §账号与身份）。
2. 导入报告中的一次性初始密码以明文保存在批次行内，仅管理员接口可读；首次改密后标记清除，但历史行仍保留该字段，生产环境建议导入完成并分发凭证后清理批次。
3. 验收命令会重置自己创建的数据（固定周期 / 阶段），不应在生产环境对真实进行中的周报使用同名周期。
4. 管理员标签目前未写入审计表（标签是实例级对象，不属于任何工作区）；如需审计，可在 license 侧新增独立日志表。

## 6. 变更记录

| 版本            | 日期       | 变更摘要                                                              |
| --------------- | ---------- | --------------------------------------------------------------------- |
| v1.0（`2.4.0`） | 2026-09-16 | 建立系统管理改进验收方法与开发环境跑通记录（8/8 通过，1071 用例全绿） |
