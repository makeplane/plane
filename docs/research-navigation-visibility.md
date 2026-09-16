# 科研目录分级可见（v2.5.0）

面向「科研目录为什么对不同的人显示不一样的菜单」这一问题的实现说明。规则只有一份，写在后端
`apps/api/plane/research/utils/capabilities.py`，前端与接口都读它。

## 1. 两条独立的判定轴

科研目录的每一项都由两个条件同时决定：

- **工作区子开关**：这个工作区有没有这个模块（`org` / `reports` / `approvals` / `stages` / `experiments` / `code` / `integrations`），由 `WorkspaceResearchSetting` 控制。
- **用户级别**：这个人在这个工作区能走到哪一档，由组织关系、导师绑定、评审指派和管理员身份推导。

两者取交集后得到的 key 列表由 `identity/me` 返回（`capabilities.nav`），侧栏、科研总览卡片和页面守卫都只按这份列表渲染。

## 2. 级别定义

从高到低判定，命中即停。所有组织关系都按 `effective_from` / `effective_to` 判定生效日期。

| 级别         | 判定依据                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `ADMIN`      | 实例管理员标签（`DEV_ADMIN` / `OPS_ADMIN` / `MAIN_PI`）或工作区管理员（role 20）                                   |
| `PRINCIPAL`  | 任一有效 `OrgUnitMember` 的组织角色为 `OWNER` / `PI` / `UNIT_ADMIN`                                                |
| `MENTOR`     | 组织角色为 `ADVISOR`，或以 `mentor` 身份存在有效 `MentorBinding`，或存在未撤销、未过期的 `StageReviewerAssignment` |
| `RESEARCHER` | 其它有效 `OrgUnitMember`（学生席位为 `REVIEWER`），或存在 `ResearchUserProfile`                                    |
| `NONE`       | 以上都不满足：账号还没有科研关系，科研目录整体不显示                                                               |

## 3. 可见菜单矩阵

| key            | 菜单     | ADMIN | PRINCIPAL | MENTOR | RESEARCHER |
| -------------- | -------- | ----- | --------- | ------ | ---------- |
| `overview`     | 科研总览 | ✅    | ✅        | ✅     | ✅         |
| `reports`      | 报告     | ✅    | ✅        | ✅     | ✅         |
| `projects`     | 科研项目 | ✅    | ✅        | ✅     | ✅         |
| `approvals`    | 办公审批 | ✅    | ✅        | ✅     | ✅         |
| `dashboard`    | 主PI看板 | ✅    | ✅        | ❌     | ❌         |
| `summary`      | 提交汇总 | ✅    | ✅        | ✅     | ❌         |
| `reviews`      | 待我评审 | ✅    | ✅        | ✅     | 按人       |
| `org`          | 组织架构 | ✅    | ✅        | ❌     | ❌         |
| `system`       | 系统管理 | ✅    | ❌        | ❌     | ❌         |
| `templates`    | 报告模板 | ✅    | ❌        | ❌     | ❌         |
| `identity`     | 身份映射 | ✅    | ❌        | ❌     | ❌         |
| `platform`     | 平台配置 | ✅    | ❌        | ❌     | ❌         |
| `audit`        | 审计记录 | ✅    | ❌        | ❌     | ❌         |
| `integrations` | 系统集成 | ✅    | ❌        | ❌     | ❌         |

两条补充规则：

- `reviews` 按人判定：被指派为阶段评审人（或本身是导师）时出现，因此学生被指派后也能看到待办。
- 项目内页（科研阶段 / 文献调研 / 实验条目 / 代码管理 / 论文与成果 / 时间线）不按级别收口，仍由项目 ACL 决定：学生打开自己的项目时可看到全部内页。

## 4. 强制点

- **菜单**：`ResearchSidebarItems` 按 `sections[key] && capabilities.nav.includes(key)` 渲染；级别为 `NONE` 时整个科研分组不渲染。
- **总览卡片**：`research/page.tsx` 用同一份 key 列表生成卡片，管理配置分组为空时不渲染。
- **页面守卫**：`ResearchPageShell` 的 `navKey` 与 `adminOnly` 分别对应级别与配置权，直连被收口的 URL 会跳回工作区首页。
- **接口**：`ResearchAPIView.nav_capability` 声明该视图属于哪个 key，`get_workspace()` 在成员校验之后、子开关校验之前判定，越权统一返回 403 `research_permission_denied`。
- **保留例外**：`GET /org-units/` 对所有成员开放（科研项目列表按节点筛选依赖它），组织树写路径才需要 `org`；身份接口 `identity/me` 与健康检查不做级别收口；模块关闭时仍可达的配置页（平台配置、审计）继续只按管理员身份判定。

## 5. 与既有模型的关系

- 管理员标签的语义不变：只影响配置权，不扩大业务数据可见范围（见 `research-system-management-prd.md` §4）。
- 级别只决定「能不能走到这个入口」，进入之后看得到哪些报告、项目、阶段仍由 `plane/research/utils/acl.py` 的对象 ACL 决定。
- 主PI工作区（`pi`）不持有自己的组织树，其级别按公共工作区（`public`）的组织关系解析，与 `sync_main_pi_workspace_seat` 和主PI看板取数口径一致。

## 6. 修改规则的位置

| 想改什么             | 改哪里                                                                           |
| -------------------- | -------------------------------------------------------------------------------- |
| 某一档能看哪些菜单   | `capabilities.LEVEL_NAV_KEYS`                                                    |
| 级别的判定条件       | `capabilities.research_signals()`                                                |
| key 属于哪个子开关   | `capabilities.NAV_SECTION_KEYS`                                                  |
| 某个接口属于哪个 key | 对应视图类的 `nav_capability`（或在 `get_workspace(..., nav=...)` 里逐方法覆盖） |

## 7. 验收

```bash
# 级别与矩阵单元测试
docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/unit/research/test_capabilities.py

# 菜单与接口一致性契约测试
docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/app/test_research_nav_capabilities.py
```

手工走查可用 `manage.py seed_research_demo` 生成的多身份账号（管理员 / 主PI / 导师 / 学生）：逐档登录后确认侧栏项与文档矩阵一致，并直连 `/research/settings/org`、`/research/reports/summary`、`/research/dashboard` 验证会被跳回工作区首页。

## 8. 变更记录

| 版本            | 日期       | 变更摘要                                                               |
| --------------- | ---------- | ---------------------------------------------------------------------- |
| v1.0（`2.5.0`） | 2026-09-16 | 建立科研目录分级可见：四档级别、菜单矩阵、前后端一致的强制点与验收方式 |
