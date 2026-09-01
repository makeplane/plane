# 项目自定义字段(Internal) — 进度与路线图

> 内部功能,不属于 upstream makeplane/plane。目标:用 Plane CE 自建的项目级自定义字段,替代一份手工维护的合同/交付跟踪 Excel 表(`project_summary.xlsx`,469 列 × 206 行,A-W 是核心的 23 列)。
>
> 这份文档是给"换 Agent 也能接着干"用的进度快照,不是设计文档。设计决策的完整推理过程在各 PR 的 commit message 里,这里只记结论 + 指向哪个文件。
>
> **重大架构变更进行中**:真实历史数据暴露出合同与项目其实是多对多关系,不是当前"合同号&项目号"拼成一个字段能表达的。已经写好完整实施方案,见 [internal-contract-project-relationship.md](internal-contract-project-relationship.md)——方案已设计完成、**尚未开始实施**,会影响下面列出的 23 个字段里的 6 个(A/F/G/H/I/J)。开始实施前先读那份文档,不要直接按下面这份文档里的字段清单继续加工。

## 现状(2026-09-01)

全部已合并到 `AlexanderShang/plane:preview`,功能分支 `claude/repo-code-summary-22f444` 保留未删,可以继续在上面开发。

| PR | 内容 | 状态 |
|---|---|---|
| #1 | Phase 1:项目级数字自定义字段(MVP) | 已合并 |
| #2 | Phase 2:扩展文本/日期/下拉/人员选择器类型 | 已合并 |
| #3 | 按固定模板 + 员工邮箱发送项目自定义字段数据 | 已合并 |
| #4 | 23 个标准字段自动铺种 + "合同号&项目号"设为工作区级唯一键 + 新增"项目信息"页面 | 已合并 |
| #5 | Phase 3:历史数据批量导入命令(`import_historical_project_data`) | 已合并 |
| #6 | 根据真实数据 dry-run 结果,扩充"公司产品名称"/"验收阶段"下拉选项 | 已合并 |
| #7 | 根据真实数据 dry-run 结果,新增"云网域"选项;下拉匹配改成大小写不敏感 | 已合并 |

## 数据模型

- `apps/api/plane/db/models/project_custom_field.py` — `ProjectCustomField`(字段定义,`field_type` ∈ number/text/date/dropdown/member,`group_name` 用于"项目信息"页分组,`is_unique_key` 标记全工作区唯一的那一个字段)、`ProjectCustomFieldOption`(下拉选项)、`ProjectCustomFieldValue`(值,`value_decimal`/`value_text`/`value_date`/`value_option`/`value_member` 五选一,有 CheckConstraint 保证互斥)。
- `apps/api/plane/db/default_data/project_custom_fields.py` — **唯一数据源**,`DEFAULT_PROJECT_CUSTOM_FIELDS`(23 个字段定义,对应 Excel A-W 列)+ `seed_default_custom_fields()`(给一个 Project 铺种这 23 个字段,按名字去重,可重复调用)。三处调用方:
  1. `apps/api/plane/app/views/project/base.py` 的 `ProjectViewSet.create()` — 新建项目时自动铺种
  2. `apps/api/plane/db/management/commands/seed_default_project_custom_fields.py` — 给已存在的老项目补种(**还没在任何真实数据库上跑过**,见下面"未完成事项")
  3. `apps/api/plane/db/management/commands/import_historical_project_data.py` — 历史数据导入时,新建的每个 Project 也走同一个铺种函数

### 字段规格里两个容易忽略的 key

- `source_header`:字段的显示名(给 Plane UI 看)有时跟 Excel 原始表头文字不一样(比如"税率（%）"的显示名带单位提示,但 Excel 表头就是"税率"两个字,没有后缀)。历史导入命令校验表头时用 `source_header`(没有就退回 `name`),不能直接拿 `name` 去比对表头,否则会报"表头不匹配"。
- `is_percent`:只有真正的百分比字段(税率、合同占比)标了这个,历史导入解析数字时才会把 Excel 的百分比格式(0.13 → 13)自动换算过来;没标这个的数字字段,就算单元格意外被设成百分比格式,也不会被自动乘 100(会留原值 + 报警告,不猜)。

## 三个不平凡的技术决策(后续维护者容易踩的坑)

1. **唯一键匹配用 `is_unique_key` 这个只读 flag,不用字段名字。** 每个项目自己有一份"合同号&项目号"字段(23 个字段本来就是按项目各自铺种的),按名字匹配唯一性检查只会拿项目跟自己比。按 flag 匹配是因为全工作区最多只有一个字段能标 `is_unique_key=True`(只读,只有种子数据能设),这个 flag 本身就唯一确定了"是哪个字段",且不会因为有人把字段改名而失效(名字字段是可编辑的)。见 `apps/api/plane/app/serializers/project_custom_field.py` 的 `ProjectCustomFieldValueSerializer.validate()`。
2. **唯一性用 Postgres advisory lock 兜底,不是 DB UniqueConstraint。** 因为这个值存在"每个项目一行"的表结构里,不是一张全局共享表,DB 层面表达不出"跨项目行唯一"这个约束。应用层先查后写有 TOCTOU 窗口,两处都用 `pg_advisory_xact_lock(hashtext("workspace_id:value"))` 序列化:实时 API 见 `apps/api/plane/app/views/project_custom_field.py` 的 `partial_update()`;批量导入见 `import_historical_project_data.py`,且导入命令特意把每一行拆成独立事务(不是整个 run 一个大事务),因为 advisory lock 要到事务真正 commit 才释放,一个大事务会把锁攥一整个导入过程,可能卡住同时在用网页编辑同一个值的人。
3. **导入脚本对"脏数据"的原则是不猜、留空 + 报警告,不是尽量让警告数字变小。** 多个真实业务值挤在一个单选下拉格子里(比如"初验终验"这种多阶段合写)时,没有写"取第一个/取最后一个"这类启发式规则去自动分类——`验收阶段`是有先后顺序的字段,猜错方向(比如取"第一个提到的阶段")反而会往库里写入一个大概率错误的具体值,比留空更糟。这个原则在会话里被至少一个"本地模型"的建议挑战过,最终维持原判,见 PR #7 的 commit message。

## 已验证但还没跑过的东西(未完成事项)

- **`seed_default_project_custom_fields` 从没在真实数据库上执行过。** 新建的项目会自动带 23 个字段,但功能上线之前就存在的老项目还没补种。什么时候跑、跑给哪个 workspace,还没问过 owner。
- **`import_historical_project_data` 还没对着"完整的真实历史数据"跑过正式导入(非 dry-run)。** 目前只在 owner 自己的 WSL2 + Docker Desktop 环境里做过多轮 `--dry-run` 迭代(警告数 113 → 59 → 6),最后 6 条警告是故意留着的多值合写脏数据,owner 确认"可以先不用管"。真正的历史数据合并/正式导入还没做。
- **员工邮件模板还是占位符。** `apps/api/templates/emails/project_data/custom_field_data.html` 是 PR #3 里的 placeholder,owner 自己说了"这个后期再导入模板",目前没有真实的 HTML 设计。

## 路线图(原始 4 阶段规划)

来自最初 `/think` 批准的方案,每个阶段独立可合并、可用:

- **Phase 1 — 项目级数字字段(MVP)** ✅ 已完成(PR #1)
- **Phase 2 — 补齐文本/日期/下拉/人员选择器类型** ✅ 已完成(PR #2)
- **Phase 3 — 历史数据导入** ✅ 代码已完成、已合并(PR #5-7),**正式导入本身还没做**(见上面"未完成事项")
- **Phase 4 — 按阶段(P0-P18)拆分数字追踪 + 汇总报表** ⏳ 未开始,原方案里明确说"不预先做,等真实使用反馈再决定要不要做这层颗粒度"。这一阶段还包括"本月应回款总额"这类汇总报表,原方案标注为"工作量最大、最贴近 Excel 核心价值的一块,值得单独立项"。

以及两个 Phase 3 完成后才发现、原方案没提前料到的真实数据问题,处理方式已经在上面"三个不平凡的技术决策"第 3 条说清楚,不用重新决策:

- 469 列里 A-W 之外的列(按月拆分的计划/实际财务矩阵等)完全没有对应字段结构,原方案里"不做",没变。
- 部分字段(如"公司产品名称""验收阶段""客户域")的种子选项是从 Excel 示例行照抄的,不是穷举列表,真实数据一 dry-run 就会暴露缺口。这不是一次性问题——如果以后又拿到新一批历史数据,大概率还会撞见新的缺口值,处理方式仍然是:高频真实值(两位数以上出现次数)直接扩进 `DEFAULT_PROJECT_CUSTOM_FIELDS` 的 `options`,个位数的脏数据/多值合写留空不猜。

## 怎么测试

`apps/api` 需要 Postgres(用了 `django.contrib.postgres.fields.ArrayField`,SQLite 建不出完整 schema)。本地/WSL2 用仓库自带的 `docker-compose-local.yml` + `setup.sh` 起服务,细节见 PR #5 review 阶段跟 owner 的对话(WSL2 + Docker Desktop 那次)。

关键命令:

```bash
# 起后端服务(Postgres/Redis/RabbitMQ/api/worker)
docker compose -f docker-compose-local.yml up -d

# 单测(纯逻辑 + 数据库集成,共 39 个)
docker compose -f docker-compose-local.yml exec api pytest \
  plane/tests/unit/management/ plane/tests/unit/utils/test_historical_project_import.py -v

# 历史数据导入,先 dry-run
docker compose -f docker-compose-local.yml exec api python manage.py import_historical_project_data \
  /code/<xlsx路径> --workspace <slug> --created-by <email> --dry-run
```

测试文件:`apps/api/plane/tests/unit/management/test_import_historical_project_data.py`(数据库集成,含每一个 review 发现的 bug 的专门回归测试)、`apps/api/plane/tests/unit/utils/test_historical_project_import.py`(纯解析逻辑,不需要数据库)。
