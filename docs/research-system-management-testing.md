# 系统管理改进测试手册（v2.4.0）

面向「我要怎么测试 2.4.0 的双工作区 / 管理员标签 / 邀请码 / 批量导入」。
三条路线按成本从低到高排列，任选一条即可；全绿标准见 §5。

## 1. 环境与账号

| 项目       | 值                                                              |
| ---------- | --------------------------------------------------------------- |
| 前端工作区 | <http://192.168.3.245:3000>（本地开发 <http://127.0.0.1:3000>） |
| 实例管理端 | <http://192.168.3.245:3001>（god-mode，仅实例管理员可进）       |
| 后端 API   | <http://127.0.0.1:8001/api/>                                    |
| 工作区     | `public`（公共工作区，全员）、`pi`（主PI工作区，主PI/管理员）   |
| 数据库     | 容器 `plane-plane-db-1`，库 `plane`，用户 `plane`               |

账号（开发环境统一初始密码）：

| 账号                                                                                                        | 密码             | 角色与用途                                    |
| ----------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------- |
| `admin@ai4ms.local`                                                                                         | `admin123456`    | 实例管理员（唯一可授予标签）+ 两工作区管理员  |
| `dev.admin@ai4ms.local`                                                                                     | `Research@12345` | `DEV_ADMIN` 标签：全域配置权                  |
| `ops.admin@ai4ms.local`                                                                                     | `Research@12345` | `OPS_ADMIN` 标签                              |
| `mainpi@ai4ms.local`                                                                                        | `Research@12345` | `MAIN_PI` 标签                                |
| `test.pi@ai4ms.local` / `test.advisor@ai4ms.local` / `test.owner@ai4ms.local` / `test.reviewer@ai4ms.local` | `Research@12345` | 测试组：主PI / 直接导师 / 科研责任人 / 评审人 |
| `gaopeng.member@ai4ms.local`、`hexue.guest@ai4ms.local`                                                     | `Research@12345` | 反向用例：无组织关系成员 / 访客               |

## 2. 路线 A：一键冒烟（约 5 秒，8 项检查）

```bash
cd /home/fangyikai/code/plane

# 幂等：重建/校正双工作区、管理员标签、组织根节点与测试组
docker compose -f docker-compose-local.yml exec api python manage.py seed_system_baseline

# 真实库 + 真实接口 + 真实角色账号跑一遍验收
docker compose -f docker-compose-local.yml exec api python manage.py accept_system_management; echo "EXIT=$?"
```

期望输出（节选，最后一行必须是 `EXIT=0`）：

```
[PASS] 双工作区与测试组基线 - 6 step(s) verified
[PASS] 管理员标签：授予、撤销与席位同步 - 7 step(s) verified
[PASS] 邀请码：签发、门禁与兑换 - 6 step(s) verified
[PASS] 二维表导入：建号、建组织、建导师关系 - 9 step(s) verified
[PASS] 科研提交审批流程（提交→退回→重提交→接受） - 7 step(s) verified
[PASS] 阶段流程（进入→闸门→提交→多人评审→通过） - 11 step(s) verified
[PASS] 管理员标签的配置权限矩阵 - 5 step(s) verified
[PASS] 主PI工作区聚合范围 - 5 step(s) verified
结论：8 / 8 项通过
```

参数：`--public-slug` / `--pi-slug` 指定工作区，`--json` 输出原始结果（便于接入流水线）。
命令会重置自己使用的周报周期（`2026-W20`）与预开题阶段，可反复执行。

## 3. 路线 B：自动化测试

```bash
cd /home/fangyikai/code/plane

# 后端全量（含 P0/P1 回归 + 本次新增用例）
docker compose -f docker-compose-test.yml run --rm api-tests pytest -q --create-db

# 只用本版新增/相关用例
docker compose -f docker-compose-test.yml run --rm api-tests pytest -q \
  plane/tests/unit/research \
  plane/tests/contract/app/test_research_admin_roles.py \
  plane/tests/contract/app/test_research_invite_codes.py \
  plane/tests/contract/app/test_research_user_import.py \
  plane/tests/contract/app/test_research_pi_workspace.py

# 前端
pnpm check:types
pnpm check:lint
pnpm --filter=web build && pnpm --filter=admin build
```

基准：后端全量 `1078 passed`，新增/相关子集 `199 passed`，前端三条命令全部成功。

## 4. 路线 C：界面手工走查（按顺序做一遍）

### 4.1 管理员标签（约 2 分钟）

1. 打开 <http://192.168.3.245:3001>，用 `admin@ai4ms.local / admin123456` 登录。
2. 左侧「用户与角色」→ 找到 `test.owner@ai4ms.local` → 点「运维管理员」按钮。
3. 回到工作区 <http://192.168.3.245:3000/public/research/settings/system>，用 `test.owner@ai4ms.local / Research@12345` 登录：
   - 能看到「系统管理」页（配置权已生效）；
   - 顶部「当前账号的管理员标签」显示“运维管理员”；
   - `pi` 工作区出现在工作区切换菜单里。
4. 撤销该标签：再用 `test.owner@ai4ms.local` 打开系统管理页 → 应变为 403/跳回首页，且 `pi` 席位消失。

反向用例：用 `gaopeng.member@ai4ms.local` 打开 `/public/research/settings/system`，应被挡回工作区首页（无配置权）。

### 4.2 邀请码注册（约 3 分钟）

1. 用 `dev.admin@ai4ms.local` 打开 `/public/research/settings/system`。
2. 「邀请码」区：组织角色选“直接导师”，可用次数 `1`，有效天数 `3` → 生成。
3. 无痕窗口打开 `http://192.168.3.245:3000/`：登录页右上角应常显「创建账号（仅限邀请）」，点击可进入 `/sign-up`（`ENABLE_SIGNUP=0` 时入口也必须保留）。
4. 点击邀请码复制注册链接，用浏览器无痕窗口打开 `http://192.168.3.245:3000/sign-up?invite_code=<码>`。
5. 先做反例：注册页首屏应提示「仅限邀请注册」，密码步骤的邀请码留空时「创建账号」不可提交（提示“请先填写邀请码”）；强行提交也应收到 `5057` 并停留在注册页的邀请码字段上。
6. 填一个新邮箱 + 强密码 + 邀请码 → 注册。期望：直接进入 `public` 工作区，无需邀请（自助建工作区入口已关闭）。
7. 校验：再用同一邀请码注册第二个邮箱 → 应提示“邀请码已用尽/不可用”（中英双语），且失败后仍停留在注册页、已填邀请码不丢失。
8. 校验组织绑定：管理员在 `/public/research/settings/org` 查看组织树，新账号已挂在根节点下并带“直接导师”角色。

### 4.3 二维表批量导入（约 5 分钟）

1. 准备一个 CSV（表头：`分组,姓名,学号,年级,学位,负责导师,邮件,电话`），例如：

   ```csv
   分组,姓名,学号,年级,学位,负责导师,邮件,电话
   器件,测试学生甲,20260000000011,25,MS,刘俊扬,manual.student1@stu.xmu.edu.cn,17000000011
   器件,测试学生乙,20260000000012,25,Ph.D,陈志昕,manual.student2@stu.xmu.edu.cn,17000000012
   ```

2. 另准备导师表：`姓名,邮箱` + `刘俊扬,manual.advisor@xmu.edu.cn`（只映射一个人，另一个故意留空）。
3. 打开 `/public/research/settings/system` → 「批量导入」上传两个文件 → 先点「预检」：
   - 预检结果列出逐行状态，**不写库**；
4. 再点「正式导入」→ 下载「导入报告」：
   - 甲：已导入（含一次性初始密码）；乙：待处理（缺少导师邮箱映射）；
   - 再次导入同一文件 → 不重复建号（幂等），一次性密码不再重发。
5. 校验：组织树出现「器件」节点并挂到根节点；学生账号首次登录时弹出「请设置你自己的密码」强制改密弹窗。

命令行同样可用（生产环境通道）：

```bash
docker compose -f docker-compose-local.yml exec api \
  python manage.py import_users_from_csv --students /tmp/roster.csv --advisors /tmp/advisors.csv --dry-run
docker compose -f docker-compose-local.yml exec api \
  python manage.py import_users_from_csv --students /tmp/roster.csv --advisors /tmp/advisors.csv --yes --strict
```

### 4.4 科研提交审批流程（约 5 分钟，测试组）

1. `test.owner@ai4ms.local` 登录 `public` → `/public/research/projects` 确认有「验收科研项目」。
2. `/public/research/reports` → 新建周报（可见范围选“仅直接导师”）→ 提交。
3. 换 `test.pi@ai4ms.local` → 同一周报 → 退回并填写原因。
4. 回到 `test.owner@ai4ms.local` → 修改后重新提交；再由 `test.pi@ai4ms.local` 接受。
5. 打开 `/public/research/projects/<项目>/stages`：
   - 预开题提交时若门槛不足会被拦（页面提示缺少的材料/文献）；
   - 管理员 `admin@ai4ms.local` 在 `/public/research/settings/org` 或接口调整门槛后提交成功；
   - `test.pi@ai4ms.local` 指派 `test.reviewer` 与 `test.advisor` 为评审人 → 两人各自提交评审 → 主PI 通过阶段。

### 4.5 主PI看板（约 1 分钟）

1. 用 `test.pi@ai4ms.local` 打开 <http://192.168.3.245:3000/pi/research/dashboard>。
2. 期望：统计范围显示“测试组”1 个节点；项目/报告/阶段/评审/审批数量与测试组内数据一致，卡片可跳回 `public` 对应页面。
3. 用 `gaopeng.member@ai4ms.local` 打开同一地址 → 提示该账号未挂组织关系（空范围）。

## 5. 判定标准

| 路线 | 通过标准                                                                    |
| ---- | --------------------------------------------------------------------------- |
| A    | `结论：8 / 8 项通过` 且退出码 `0`                                           |
| B    | 后端 `0 failed / 0 error`；`check:types`、`check:lint`、两个 build 全部成功 |
| C    | 4.1–4.5 全部符合期望，反向用例（普通成员/访客）被正确拒绝                   |

## 6. 数据重置与回滚

```bash
# 重新对齐基线（幂等，不删业务数据）
docker compose -f docker-compose-local.yml exec api python manage.py seed_system_baseline --backfill-members

# 演示夹具重建（P0/P1 数据）
docker compose -f docker-compose-local.yml exec api python manage.py seed_research_demo --workspace public --reset

# 退役某个工作区（先备份数据库！）
docker compose -f docker-compose-local.yml exec plane-db pg_dump -U plane -d plane | gzip > /tmp/plane-$(date +%s).sql.gz
docker compose -f docker-compose-local.yml exec api python manage.py purge_workspaces --slugs <slug> --yes
```

## 7. 常见问题

| 现象                                       | 处理                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 登录报 `CSRF Verification Failed`          | 把访问地址补进 `apps/api/.env` 的 `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS`，重启 api |
| 注册页提示“邀请码必填/不可用”（5057/5058） | 找管理员在系统管理页重新生成邀请码；注意有效期与次数                                        |
| 导入行显示“待处理：缺少导师邮箱映射”       | 补一份「导师姓名→邮箱」表再次导入（幂等，只补关系不重复建号）                               |
| 首次登录弹窗要求改密                       | 这是导入账号的强制改密（一次性初始密码在导入报告里）；改完即消失                            |
| 看不到「系统管理」菜单                     | 该账号既不是工作区管理员也没有管理员标签；让 `admin@ai4ms.local` 在 `:3001/users` 授予      |
