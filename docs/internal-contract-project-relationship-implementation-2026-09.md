# Contract-Project 多对多关系重构 — Phase A 实施记录

> **状态**: Phase A 已合并到 `AlexanderShang/plane:preview` (commit `260ccae81` + merge `c868d9cfb`)。
>
> 配套文档:
> - 设计文档: [docs/internal-contract-project-relationship.md](internal-contract-project-relationship.md) (Phase A 之前 commit `1c6350194` 的"待实施"版本,后被同步更新为已实施)
> - 进度文档: [docs/internal-project-custom-fields.md](internal-project-custom-fields.md)
>
> 这份文件是给"换 Agent 也能接着干"用的实施记录,记录**决策、真实数据发现、未决问题**。设计文档解释"为什么这么设计",这份文档解释"具体怎么做的、踩了什么坑"。

## 一句话回顾

Phase A 把项目自定义字段从 23 个 ProjectCustomField 拆成"17 ProjectCustomField + 5 Contract/ContractProject 原生列 + 1 整体删除",让合同 ↔ 项目 的真实多对多关系能在 DB 层表达,而不是靠拼字符串去绕。

## 实施清单(对应 commit `260ccae81`)

| 文件 | 改动类型 | 关键内容 |
|---|---|---|
| `apps/api/plane/db/models/contract.py` | 新建 | `Contract` (workspace 级主数据, UniqueConstraint(workspace, contract_no)) + `ContractProject` (Contract<->Project M:N 关联, UniqueConstraint(contract, project))。继承 `BaseModel` 而非 `WorkspaceBaseModel` 是有意的——Contract 不挂任何单个 Project。 |
| `apps/api/plane/db/models/__init__.py` | 注册 | `from .contract import Contract, ContractProject`。**这是上次修过的 sibling 坑**:定义了但没导出。已通过 AST 校验。 |
| `apps/api/plane/db/default_data/project_custom_fields.py` | 23 → 17 | 删 A 列("合同号&项目号" 整体删除,不是拆分)。删 F/G/H/I/J(搬去 Contract/ContractProject)。L 列("项目序号") `is_unique_key=True` 从 A 列挪过来。 |
| `apps/api/plane/utils/historical_project_import.py` | 解析层 | `parse_row` / `validate_headers` 加可选 `header_row` 参数:传它时按表头名查(让 DEFAULT_PROJECT_CUSTOM_FIELDS 不必镜像 xlsx 列号);不传时退化为"按列号位置" + stderr 一次性警告(老测试走这条路径)。 |
| `apps/api/plane/db/management/commands/import_historical_project_data.py` | 改造 | 不读 A 列(legacy composite 字段整体忽略);Contract / ContractProject 入库走 `get_or_create`(DB UniqueConstraint 兜底);`_coerce_contract_cell` 专门处理 Excel datetime/int 误解析(67% 数据命中)。 |
| `apps/api/plane/db/migrations/0126_internal_contract_project.py` | 新建 | Contract + ContractProject schema。两个。` + reverse-direction `project` index。 |
| `apps/api/plane/db/migrations/0127_internal_contract_project_is_unique_key_reset.py` | 新建 | RunPython 数据迁移:把已 seed 老 Project 的"合同号&项目号" `is_unique_key=True` 重置为 False(因为 `seed_default_custom_fields` 只 seed 不改旧字段,Phase A seed 后会有两个 `is_unique_key=True` 字段并存,违反不变量)。Reverse 是 noop——回滚会重新引入同样的不变量违反。 |
| `apps/api/plane/tests/unit/management/test_import_historical_project_data.py` | 测试 | `XLSX_HEADERS` 改为显式 23 列 A-W 布局(1 retired + 17 project + 5 contract);`_row()` 按 xlsx 列号填;税率/合同占比断言改查 Contract.tax_rate / ContractProject.allocation_ratio。 |
| `apps/api/plane/app/serializers/project_custom_field.py` | 注释更新 | Line 129 注释从 "合同号&项目号" 改成 "项目序号",反映 Phase A 的唯一键迁移。 |
| `docs/internal-contract-project-relationship.md` | 同步 | "业务规则固化"小节加入;23 → 17 字段归属表重写;两个"未决问题"小节删除(已解答);Phase A 实施清单更新。 |
| `docs/internal-project-custom-fields.md` | 同步 | 23 → 17 引用全部更新;Phase A 状态从"进行中"改"完成";Contract/ContractProject 数据模型小节加入;Phase A 兼容性警告加入。 |

## 决策记录(为什么这么改而不是那样改)

### 1. 合同号从字符串拼成 `{合同号}{项目号}` 不是 `{合同号}-{项目号}` 也不是 `{合同号}&{项目号}`

`{合同号}{项目号}` 无分隔符是**唯一合法格式**,由系统在运行时拼接 (`Contract.contract_no + Project.项目序号`)。这条业务规则固化在 `docs/internal-contract-project-relationship.md` 的"业务规则固化"小节,作为 Phase A 之后**所有** xlsx 导入模板、UI 展示、运维脚本的唯一合法形式。

为什么不让表格保留 A 列让用户维护?——70%/78% 一致率(不同 xlsx 版本),占位符"暂无/待签约"、datetime 误解析(`5763-5` → `datetime(5763, 5, 1)`)、反向拼接(`W19012&5762` vs `5762&W19012`)等多种脏数据形态都从 A 列进入系统。让 A 列只展示,不进数据模型——避免未来每个新的导入任务都要重复解决同一组解析问题。

### 2. F 列 datetime 反解析放在 `_coerce_contract_cell` 而不是通用 `coerce_text`

`coerce_text` 是公开 helper,改它会影响其他测试和调用者。把 datetime/int 特判收敛在 `_coerce_contract_cell` 里,只对合同号这**一列**生效,影响面最小化。

触发逻辑:
- `datetime` 且时分秒为 0 → `f"{year}-{month}"` (Excel 解析的"YYYY-M"格式)
- `datetime` 但带时分 → `str(datetime)` (真日期值,保持原 ISO)
- `int` → `str(int)` (Excel 把"5824-8" 解析成 int 5824,丢后缀;无法恢复,只能接受丢部分)

**没把 int 路径标 warning**——这是已知数据丢失,4/189 行命中,不值得给用户加噪声。

### 3. `parse_row` 双模式而不是"只支持 header_row 模式"

旧测试 `test_historical_project_import.py` 用 4 项 `FIELD_SPECS` 直接传 `parse_row`,不传 `header_row`。如果强制要求 `header_row`,要改一堆纯函数测试。给 `parse_row` 一个 "fallback to positional" 的可选行为 + stderr 一次性警告,既保留了向后兼容,也提醒调用方"你正在用 legacy 行为,Phase A 后不安全"。

### 5. seed_default_custom_fields **不删/改旧字段**

`seed_default_custom_fields` 只创建缺失字段(`existing_names` 比对),不删除已存在字段,不重置 `is_unique_key`。这意味着:
- 老 Project 上"合同号&项目号" `is_unique_key=True` 不会自动消失
- Phase A seed 新字段"项目序号" `is_unique_key=True` 后,老 Project 会**临时**有两个 `is_unique_key=True` 字段

修复通过 `0127_internal_contract_project_is_unique_key_reset.py` (RunPython 数据迁移) 完成:重置老 flag,防御性确保新 flag 设置。**`migrate db 0125` 后必须 `migrate db 0127`**,否则生产环境会出现两个 unique 字段并存的 bug。

### 4. _get_or_create_contract 不用 advisory lock

ProjectCustomFieldValue 的唯一性走 advisory lock,因为它存在"每个 Project 一行"的表里,DB 表达不出跨行约束。**Contract 是真正的全局表**,UniqueConstraint 在 DB 层就够了,advisory lock 没必要。注释里写清楚这个差异,免得未来有人 copy-paste 时漏掉。

## 真实数据发现(踩到的坑)

| 发现 | 数据证据 | Phase A 的处理 |
|---|---|---|
| F 列 124/189 行被 Excel 自动解析成 datetime | `datetime(5763, 5, 1)` 来自字符串"5763-5" | `_coerce_contract_cell` 特判重建为 "5763-5" |
| F 列 4/189 行被 Excel 解析成 int(丢后缀) | Row 37: F=int(5725), 真实合同号应是 "5725-22" | 接受丢后缀,转成 str(int),加日志记录 |
| A 列"合同号&项目号" 拼接格式混乱 | 30% 数据不是 `{G}{L}` 干净拼接,包括反向、`&` 分隔、占位符 | A 列整体忽略为数据;脏数据靠 F+L 走 Contract/Project 路径清洗 |
| 多对多关系真实存在 | 148 个唯一合同号中 22 个出现 ≥2 次 | Contract(workspace 主数据) + ContractProject(关联表) 是唯一正解 |
| 占位符"暂无" / "待签约" | 各 7 次 | Contract.contract_no 接受任意字符串,UI 层处理"未签约"状态(Phase B 范围) |
| B 列 B 是 int 而非 datetime | 5725 → "5725", 丢后缀 | 同 datetime 路径,转字符串接受 |

## 未决问题(留给未来 session)

按 think skill 的 Phase Independence 原则,Phase A 已经是**独立可合并**状态(系统能完整记录 Contract 和 Project 关系)。以下留给 Phase B/C/D:

| 编号 | 描述 | 何时处理 |
|---|---|---|
| PB-1 | "暂无" / "待签约" 占位 Contract 的 UI 区分 | Phase B(项目详情页"关联合同"区块) |
| PB-2 | Contract 列表页 + 创建/编辑 UI | Phase B |
| PC-1 | ContractProject 增删改独立管理页 | Phase C |
| PD-1 | 合同 × 项目矩阵视图 | Phase D(暂缓,等真实使用反馈) |
| PE-1 | 关系图 + 直接/间接关联区分 | Phase E(暂缓) |
| PP-1 | `seed_default_project_custom_fields` 何时在真实数据库跑(老项目补种) | 跟 owner 确认 |
| PP-2 | 员工邮件模板 `apps/api/templates/emails/project_data/custom_field_data.html` 还是占位符 | 后期 |

## 怎么测试

跟 [internal-project-custom-fields.md](internal-project-custom-fields.md#怎么测试) 同款流程:

```bash
docker compose -f docker-compose-local.yml up -d

# 单测(纯逻辑 + 数据库集成,39 个)
docker compose -f docker-compose-local.yml exec api pytest \
    plane/tests/unit/management/ \
    plane/tests/unit/utils/test_historical_project_import.py -v

# 历史数据导入,先 dry-run
docker compose -f docker-compose-local.yml exec api python manage.py import_historical_project_data \
    /code/<xlsx路径> --workspace <slug> --created-by <email> --dry-run
```

## 回滚

按 commit 顺序回滚即可:
```bash
git revert c868d9cfb   # merge commit
git revert 260ccae81   # 实施 commit
```

数据迁移 0127 reverse 是 noop,需要手动跑清理 SQL(把"项目序号" `is_unique_key=True` 重置为 False,把"合同号&项目号" `is_unique_key=True` 设回——前提是回滚后还想保持 Phase A 之前的不变量)。

更安全的回滚:**先回滚 0127 的 RunPython 副作用(手动 SQL),再 revert commit**。直接 revert 不会回滚已执行的迁移,只回滚代码。