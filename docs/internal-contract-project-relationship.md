# 合同-项目多对多关系重构 — 实施方案

> 状态:**方案设计完成,Phase A 已开工(2026-09-01)**。
>
> 触发原因:真实历史数据里存在合同与项目的真实多对多关系(同一项目对应多个合同号,或同一合同覆盖多个项目),当前"合同号&项目号"拼串成一个字段的模型无法表达这种关系,导入时报错或被迫舍弃了受影响的行。
>
> **业务规则固化(2026-09-01 决策)**:合同号与项目号的拼接字段(`合同号&项目号`,原 Excel A 列)**不应作为数据字段存在**。强制约定:`{合同号}` 在前、`{项目号}` 在后直接拼接(无分隔符),由系统自动生成;**后续导入模板不再携带这个字段**,只携带 F(合同号)+ L(项目序号)两个数据源字段。这条规则消除了原"未决问题 1",同时把"未决问题 2"答案直接定下来。详见 [业务规则固化](#业务规则固化-2026-09-01) 小节。

## 一句话结论

新增 `Contract`(工作区级主数据表,不挂在任何单个 Plane Project 下)和 `ContractProject`(合同-项目关联表,多对多),**Plane 原生的 `Project` 模型继续代表业务上的"项目"不变**——不新建一张独立的 Project 业务表,这是跟原始提案(文档默认从零设计一个新系统)最大的偏离点,原因见下节。

## 为什么不是提案里的三张全新表

提案默认从零设计,把 Contract/Project 都当成全新业务实体。但这套系统是长在 Plane 上面的:Plane 原生的 `Project` 已经是一等公民,承载了 issue 追踪、Cycle、Module、成员权限等一整套现成能力,而且现有 8 个已合并 PR(见 [internal-project-custom-fields.md](internal-project-custom-fields.md))全部假设"一个 Excel 项目行 = 一个 Plane Project"。

如果照抄提案新建一张独立 `PROJECT` 业务表,会导致:
- 一个业务概念("XM001 项目")对应两个数据库实体(Plane 自己的 Project + 新的业务 Project 表),需要维护两者的绑定关系,徒增一层间接。
- 已经上线的"项目信息"页面、自定义字段引擎、历史导入命令全部要重新对接到哪个"Project"上,返工成本极高。

所以采纳的方案是:**只把 Contract 提升为新实体,Project 侧维持"一个 Excel/业务项目 = 一个 Plane Project"不变**,`ContractProject` 关联表一头连接新 `Contract` 表,另一头连接 Plane 已有的 `Project` 表(`plane.db.models.Project`,不是新表)。这保留了提案的核心洞察(合同和项目是独立实体,关系是多对多,不该拼进一个字符串),同时把改动幅度收窄到"新增一个合同概念",不去动 Plane 原生 Project 的地位。

## 数据模型

### Contract(新增)

工作区级主数据,不属于任何单一 Project(这点和 Plane 里绝大多数模型不一样,大多数模型要么挂 workspace,要么挂 project;Contract 只挂 workspace)。

```python
# apps/api/plane/db/models/contract.py (新文件)

class Contract(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_contract")
    contract_no = models.CharField(max_length=64)          # 合同号,例如 HT2026-001
    contract_name = models.CharField(max_length=255, blank=True)
    contract_type = models.CharField(max_length=64, blank=True)
    customer = models.CharField(max_length=255, blank=True)
    sign_date = models.DateField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    status = models.CharField(max_length=64, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "contract_no"],
                condition=Q(deleted_at__isnull=True),
                name="contract_unique_workspace_contract_no_when_not_deleted",
            )
        ]
```

不用 `WorkspaceBaseModel`(它的 `project` 字段是可选的、跟单个项目挂钩的语义,Contract 不该有这个字段,会造成"这个合同属于哪一个项目"的误导),直接继承 `BaseModel` + 手写 `workspace` FK。

### ContractProject(新增,关联表)

```python
# apps/api/plane/db/models/contract.py (同文件)

class ContractProject(ProjectBaseModel):  # 已经带 project + workspace 两个 FK
    contract = models.ForeignKey("db.Contract", on_delete=models.CASCADE, related_name="project_links")

    relation_type = models.CharField(max_length=64, blank=True)   # 主合同/补充合同/采购合同/服务合同...
    relation_role = models.CharField(max_length=32, blank=True)   # PRIMARY/SUPPLEMENTARY/PROCUREMENT/...

    allocated_amount = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    allocation_ratio = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)  # 百分比数值,不是小数,和 is_percent 字段的既有约定一致

    scope_description = models.TextField(blank=True)

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=64, blank=True)
    remark = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["contract", "project"],
                condition=Q(deleted_at__isnull=True),
                name="contract_project_unique_contract_project_when_not_deleted",
            )
        ]
```

`ProjectBaseModel` 已经提供 `project`(FK -> Plane 的 `Project`)和 `workspace`(save() 时自动从 project 派生),直接复用,不用重新声明。

### 索引

跟提案第二十节一致:

```python
class Meta:
    indexes = [
        models.Index(fields=["contract"]),
        models.Index(fields=["project"]),
    ]
```

`UniqueConstraint(contract, project)` 本身会在 Postgres 里自动建一个复合索引,能覆盖"按合同查项目"这个方向;"按项目查合同"需要单独在 `project` 上建索引(上面已加)。

## 现有 23 个字段怎么拆

这是这次改动实际影响的字段范围,不是全部推倒重来。按提案第七节的归属原则("字段归属:Project 属性 / Contract 属性 / 关系属性")过一遍 `DEFAULT_PROJECT_CUSTOM_FIELDS`(见 [project_custom_fields.py](../apps/api/plane/db/default_data/project_custom_fields.py)):

| 列 | 字段名 | 现状 | 改动后归属 |
|---|---|---|---|
| A | 合同号&项目号 | `is_unique_key=True` 的 Project 自定义字段 | **整体删除**(见"业务规则固化"小节)——不再作为数据字段,后续模板不再携带 |
| F | 合同号 | 普通文本 Project 自定义字段 | 直接搬到 `Contract.contract_no`(数据源,不是从 A 解析) |
| L | 项目序号 | 普通文本 Project 自定义字段 | **替代原 A 列成为 Project 业务唯一键**——见"唯一键怎么办" |
| G | 签约登记日期 | 日期 Project 自定义字段 | 搬到 `Contract.sign_date` |
| H | 合同净额/不含第三方（人民币万元） | 数字 Project 自定义字段 | 搬到 `Contract.total_amount`——提案第八节举的就是这个例子:一份合同的总金额不该重复存在每个关联项目上 |
| I | 税率（%） | 数字(is_percent) Project 自定义字段 | 搬到 `Contract`(新增字段,不在上面的最小 schema 里,先按 Contract 的普通 DecimalField 加) |
| J | 合同占比（%） | 数字(is_percent) Project 自定义字段 | 搬到 `ContractProject.allocation_ratio`——这是提案里"某合同在某项目上的分摊比例"的原型字段,现在有地方放了 |
| B/C/D/E/K/L/M/N/O/P/Q/R/S/T/U/V/W(其余 17 个,含 L) | 区域/省份/行业/分支/客户项目名称/项目序号(L,新唯一键)/公司项目名称/项目类别/客户域/业务域/生产方式类别/公司产品名称/核心产品线/生产状态/验收阶段/成本投入状态/能否验收状态 | Project 自定义字段 | **不动**,继续是 `ProjectCustomFieldValue`,理由是这些字段描述的是"项目本身"的状态,不因为项目挂了几份合同而改变。其中 L 现在带 `is_unique_key=True`(从原 A 字段搬过来的)。 |

**改动后总字段数**: `DEFAULT_PROJECT_CUSTOM_FIELDS` 从 23 个变成 **17 个**——减 1 个 A 字段(整体删除)、减 5 个 F/G/H/I/J(搬到 Contract/ContractProject 原生列)、L 仍在 ProjectCustomFieldValue 里(只是把 `is_unique_key=True` 从 A 挪到 L)。这 17 个里 L 仍是 ProjectCustomFieldValue 的一员,不需要额外加。
- 17 个仍是 ProjectCustomFieldValue(B/C/D/E/K/L/M/N/O/P/Q/R/S/T/U/V/W,含 L)
- F/G/H/I/J 5 个搬到 Contract/ContractProject 原生列
- A 字段整体删除(不在任何模型里)

Contract 用原生 Django 字段而不是复用 `ProjectCustomField` 引擎:Contract 的字段集合是固定的、提案里明确列出的,不是用户在 UI 里自由添加的,不需要一套通用字段引擎的灵活性,原生列更简单、能享受真正的 DB 类型约束。

## 唯一键怎么办

现状:`ProjectCustomFieldValueSerializer.validate()`(见 [project_custom_field.py](../apps/api/plane/app/serializers/project_custom_field.py))用 `is_unique_key` 这个 flag 认定"哪个字段是全工作区唯一的",目前指向 A(合同号&项目号)。

改动后:唯一性检查应该分成两层,不再是一个字段扛两件事——

1. **`Contract.contract_no`**:工作区内唯一,靠上面 `Contract` 模型的 `UniqueConstraint(workspace, contract_no)` 在 DB 层面直接保证,不需要像现在这样用 Postgres advisory lock 兜底应用层查重(这是这次重构一个实打实的简化:旧模型因为"值存在每个项目自己的一行里"没法用 DB 约束,新模型里 Contract 是真正的一张共享表,可以直接用 UniqueConstraint)。
2. **L 列"项目序号"** 替代 A 列成为 Project 的业务唯一键。`is_unique_key=True` 的 flag 从 A 字段挪到 L 字段("项目序号")。L 列在原始数据里已经是干净的"项目号"字段(全部形如 `W19011`、`W20343`),不需要从 A 列推导。

**"项目序号"作为 ProjectCustomField 还是搬成原生字段?**有两个方案,倾向方案 a:
- **(a) 保持 ProjectCustomField(改 is_unique_key 指向它)**:跟 A 列改造前一致,继续走 `ProjectCustomFieldValue` 引擎,只是把"全工作区唯一性"的责任从 A 列挪过来。改动最小,跟进度文档里"三个不平凡的技术决策"第 1 条("唯一键匹配用 `is_unique_key` 这个只读 flag")直接兼容。
- **(b) 搬到 Plane 原生 `Project` 的 `identifier` 字段**:更彻底,但要修改 Plane 上游的 identifier 长度限制和字符集规则,会跟其他已有项目的 identifier 命名冲突,跨多个项目的历史项目没法直接套用。

**Phase A 采用方案 (a)**:L 列留在 `ProjectCustomField`,只改 `is_unique_key` flag 指向它。

## 未决问题

**全部已消除(2026-09-01)**,理由见下一小节"业务规则固化"。

原"未决问题 1"(A 列拼接规则)和"未决问题 2"(Project 业务唯一键)都因为"`A 列字段整体删除,由系统自动拼接`"这条业务规则而失去意义——不再需要拆 A 列,Project 唯一键也直接用 L 列。项目可以直接进入 Phase A 实施。

## 业务规则固化 (2026-09-01)

### 决策原文

> 强制"合同号在前,项目号在后",并且这个字段后续表格中不会携带,应该由系统自动拼接而成。

### 决策含义

1. **`{合同号在前}{项目号在后}` 无分隔符拼接** 是**唯一合法格式**,由系统按 `Contract.contract_no + Project.project_number` 在运行时拼接,不允许任何变体(`&` 分隔、反向拼接、人工拼写等)。
2. **后续导入模板不再携带这个字段**——只携带 F(合同号)和 L(项目序号)两个数据源字段,系统内部用这两个字段生成拼接结果。
3. **A 列不再作为数据字段存在**:既不在 `DEFAULT_PROJECT_CUSTOM_FIELDS` 里,也不在 `ProjectCustomFieldValue` 里,UI 上也不再展示原始 A 列。

### 解决了哪些问题

| 原"未决问题" | 答案 |
|---|---|
| A 列拼接规则是否一致(原未决问题 1) | **不存在了**。系统拼接是确定性的,F+L 拼接无歧义。原始 xlsx 里 A 列的脏数据(78% 一致率、占位符、`&` 反向拼接、datetime 误解析)全部不再需要处理——脏数据在 F/L 列上做清洗即可,A 列不再读。 |
| Project 业务唯一键(原未决问题 2) | **L 列"项目序号"** 直接做 `is_unique_key`,跟进度文档"三个不平凡的技术决策"第 1 条兼容。 |

### 简化了什么

- **方案文档"为什么不是提案里的三张全新表"小节的论证**得到加强:从"A 列不可信"升级为"A 列从来不该是数据字段, 它只是 F+L 的派生显示",论据更彻底。
- **Phase A 不再有前置依赖**:之前 Phase A 标"必须先解未决问题 1 才能开工",现在没有这个问题了,直接进入实施。
- **`import_historical_project_data` 解析层简化**:不再读 A 列,只读 F+L 两列,A 列无论填什么都不解析(只做行数对账 + 警告提示)。
- **新导入模板设计**:只携带 18 个 ProjectCustomField 字段(A 列删除,原 23 - A - F/G/H/I/J 共 5 个搬到 Contract/ContractProject + 项目序号也保留为字段 = 18 个)。

### 新增的 3 个硬约束(Phase A 必须遵守)

1. **`import_historical_project_data` 不解析 A 列**——A 列只用作行数对账和导入完整性校验(`len(rows) == sum(A列非空)`),任何 A 列的脏数据都不报错(因为不是数据源)。
2. **F 列(合同号)datetime 反解析**——原始 xlsx 67% 行的 F 列被 Excel 自动解析成 datetime 对象(`5763-5` → `datetime(5763,5,1)`),导入层必须把 datetime 转回字符串 `"YYYY-M"` 格式,否则合同号全丢。
3. **L 列(项目序号)作为唯一键**——`is_unique_key` flag 从 A 字段挪到 L 字段,`ProjectCustomFieldValueSerializer.validate()` 的逻辑不变,只换 flag 指向。

### 不影响范围(保持原状)

- 多对多关系成立:148 个唯一合同号中 22 个出现 ≥2 次,方案文档 Phase A "复用已有 Project" 部分的论证不变。
- 占位符 `暂无` / `待签约` 仍然存在:Phase A 里仍需要决策这两个值是否要进 Contract 表(候选 a/b/c 跟原方案一致)。
- 13 行 `{项目号}&{合同号}` 反向拼接(原 xlsx Row 161-173):**不视为脏数据**,因为导入层不读 A 列,只读 F+L,只要 F/L 干净就 OK。

## 分阶段实施(每个阶段独立可合并)

### Phase A — 数据模型 + 历史导入命令改造(纯后端,无新 UI)

- 新建 `apps/api/plane/db/models/contract.py`:`Contract`、`ContractProject` 两个模型,注册进 `apps/api/plane/db/models/__init__.py`(注意:上一轮刚修过一个"定义了但没导出"的 bug,这次新加的类记得同步导出,并且照着当时补的 sibling sweep 脚本习惯,合并前再跑一遍确认)。
- 迁移文件:新建两张表 + 索引 + 约束。
- **不再有"先解未决问题"的前置依赖**(见业务规则固化小节),直接进入实施。
- 更新 `DEFAULT_PROJECT_CUSTOM_FIELDS`(见 [project_custom_fields.py](../apps/api/plane/db/default_data/project_custom_fields.py)):**删 A 字段**(整体删除,不是拆分),**改 L 字段的 `is_unique_key=True`**(从 A 字段挪过来),**删 F/G/H/I/J**(搬去 Contract/ContractProject)——共 6 个条目变更,最终剩 18 个 ProjectCustomField(原 23 - A - F/G/H/I/J + L 升级)。
- 新增 Contract/ContractProject 的 DRF 序列化器 + ViewSet,权限对齐现有 `ProjectCustomFieldAccessPermission` 的思路(ADMIN/MEMBER 才能读写,因为合同数据也是财务敏感信息)。
- 改造 `apps/api/plane/db/management/commands/import_historical_project_data.py`:
  - **不读 A 列**:A 列只做行数对账(检查 `len(data_rows) == sum(A列非空)`),任何 A 列值都不解析。
  - **每行的合同相关列(F/G/H/I)** 不再写入 `ProjectCustomFieldValue`,改成 `Contract.objects.get_or_create(workspace=..., contract_no=...)`。
  - **F 列做 datetime 反解析**:如果 F 列值是 `datetime` 类型,转成 `f"{dt.year}-{dt.month}"` 字符串;如果 F 列值是 `int` 类型(如 `5824-8` Excel 解析成整数 `5824-8`),也做对应转换;最终统一成字符串合同号。
  - J 列(合同占比)写入 `ContractProject.allocation_ratio`。
  - **关键行为变化**:如果同一个项目(按 L 列项目序号匹配)在多行里出现、但合同号不同,不应该再各建一个新 Project——应该识别为"同一个项目、多份合同",复用已有的 Plane Project,只新增一条 `ContractProject` 关联记录。这正是这次重构要解决的真实问题,之前会各建一个 Project 或者报重复错误跳过。
  - 现有的 advisory lock(见 [import_historical_project_data.py](../apps/api/plane/db/management/commands/import_historical_project_data.py))之前是为了保护 A 字段的唯一性检查,改成保护 `Contract.contract_no` 的 `get_or_create`——不过 DB UniqueConstraint 已经兜底了唯一性,lock 更多是为了避免同一次导入内并发创建重复 Contract 行时的竞态,可以简化甚至去掉,视 Phase A 实际实现时的判断。
- 由于目前"正式导入还没做过"(见 [internal-project-custom-fields.md](internal-project-custom-fields.md) 的"未完成事项"),现网没有需要回填迁移的真实 Contract/ContractProject 数据,Phase A 不需要写数据迁移脚本——这是这次改动时机选得好的地方,越晚做这个重构,历史数据回填的工作量越大。

验收标准:`import_historical_project_data --dry-run` 对着真实数据跑一遍,之前"多对多导致报错/被舍弃"的那些行,现在能正确导入成"一个 Project + 多条 ContractProject 关联"。

### Phase B — 合同列表页 + 项目详情页"关联合同"区块

- 新增 Contract 列表页(对应提案第十一节的合同详情部分:合同号/名称/类型/客户/金额/签订日期/状态,顶部信息 + 下方关联项目列表)。
- 现有"项目信息"页面(见 [project-info-root.tsx](../apps/web/core/components/project-info/project-info-root.tsx))新增"关联合同"区块,列出这个 Project 关联的所有 Contract(对应提案第十二节)。

### Phase C — 合同-项目关联管理页

- 独立页面管理 ContractProject 记录的增删改(提案第十三节)。

### Phase D — 矩阵视图(暂缓)

- 提案第十四节的合同 × 项目矩阵。参考原始路线图 Phase 4 定下的原则("不预先做,等真实使用反馈再决定"),这一阶段的可视化价值需要先有真实的合同-项目数据积累起来之后才能判断是否值得做,不在这次一起规划的三个阶段(A/B/C)里预先投入。

### Phase E — 关系图 + 直接/间接关联区分(暂缓)

- 提案第十五至十九节。同 Phase D 的理由,关系图和间接关联路径分析是"锦上添花",不是让系统"完全跑起来"的必要条件,等 A/B/C 用起来之后再评估。

## 明确不做的部分(对应提案里被裁掉的内容)

- **不新建独立的业务 `Project` 表**——原因见"为什么不是提案里的三张全新表"。
- **不把 Cluster(连通分量)做成正式实体**——提案自己第十七节也这么建议,只是重申一下:这次的 A/B/C 三阶段完全不涉及。
- **Phase D/E 不在这次一起动手**——按 Phase Independence 原则,A/B/C 三个阶段做完系统已经是完整可用状态(能记录、查询合同和项目的多对多关系),D/E 是增强,不是必需。

## 回滚

- Phase A 只新增两张表 + 修改 `DEFAULT_PROJECT_CUSTOM_FIELDS` 里的字段列表,不删除任何已有的 `ProjectCustomField`/`ProjectCustomFieldValue` 表结构,迁移可以直接 `migrate <app> <上一个迁移名>` 回退。
- 因为现网还没有真实数据依赖新模型(Phase A 时机选在正式导入之前),这次重构不存在"数据已经写入新表、回滚会丢数据"的风险,是当前实施这个方案摩擦最小的时间点。
