# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Declarative research test fixture data (P0 + P1).

This module is pure data: no Django imports and no side effects. Every name is
deterministic so the seeder can upsert by natural key and ``--reset`` can find
exactly what it created.
"""

from dataclasses import dataclass, field

PASSWORD = "Research@12345"
EMAIL_DOMAIN = "ai4ms.local"
OIDC_PROVIDER = "ai4ms-oidc"

DEFAULT_WORKSPACE_SLUG = "fangyikai"
DEFAULT_OWNER_EMAIL = "fangyikaii@163.com"

WORKSPACE_ADMIN_ROLE = 20
WORKSPACE_MEMBER_ROLE = 15
WORKSPACE_GUEST_ROLE = 5

ROOT_KEY = "root"
OWNER_KEY = "fangyikai"

# The only organisation role that never grants management rights over the node
# and its subtree (see ``plane.research.utils.acl.MANAGING_ORG_ROLES``), which
# is why students are registered with it.
UNIT_MEMBER_ROLE = "REVIEWER"


def seeded_email(local):
    return f"{local}@{EMAIL_DOMAIN}"


def is_seeded_email(email):
    """True when the account belongs to this fixture (used by ``--reset``)."""
    return str(email or "").lower().endswith(f"@{EMAIL_DOMAIN}")


@dataclass(frozen=True)
class UnitSpec:
    key: str
    name: str
    unit_type: str
    parent: str


ORG_UNITS = (
    UnitSpec("institute", "材料科学与工程学院", "INSTITUTE", ROOT_KEY),
    UnitSpec("lab_energy", "能源材料实验室", "LAB", "institute"),
    UnitSpec("lab_smart", "智能材料实验室", "LAB", "institute"),
    UnitSpec("group_zhang", "张伟课题组", "GROUP", "lab_energy"),
    UnitSpec("group_li", "李明课题组", "GROUP", "lab_energy"),
    UnitSpec("group_wang", "王芳课题组", "GROUP", "lab_smart"),
    UnitSpec("group_calc", "AI4MS 计算材料课题组", "GROUP", "lab_smart"),
    UnitSpec("team_graphite", "石墨负极小组", "TEAM", "group_zhang"),
)


@dataclass(frozen=True)
class AccountSpec:
    key: str
    display_name: str
    first_name: str
    last_name: str
    email_local: str
    identity: str
    workspace_role: int = WORKSPACE_MEMBER_ROLE
    org_roles: tuple = ()
    employee_id: str = ""
    identity_status: str = ""
    sees: str = ""

    @property
    def email(self):
        return seeded_email(self.email_local)


# 12 mock identities. ``fangyikai`` (the workspace owner) is handled separately:
# the fixture only attaches research roles to the existing account and never
# changes its password.
ACCOUNTS = (
    AccountSpec(
        key="zhangwei",
        display_name="张伟",
        first_name="伟",
        last_name="张",
        email_local="zhangwei.pi",
        identity="课题组主 PI（张伟课题组）",
        org_roles=(("group_zhang", "PI", True),),
        employee_id="AI4MS-2026-0101",
        identity_status="ACTIVE",
        sees="本课题组全部报告/阶段/审批；被自动指派为课题组阶段评审人",
    ),
    AccountSpec(
        key="liming",
        display_name="李明",
        first_name="明",
        last_name="李",
        email_local="liming.pi",
        identity="课题组主 PI（李明课题组）",
        org_roles=(("group_li", "PI", True),),
        employee_id="AI4MS-2026-0102",
        identity_status="ACTIVE",
        sees="自己课题组的数据；看不到张伟课题组的 PRIVATE/导师级记录",
    ),
    AccountSpec(
        key="wangfang",
        display_name="王芳",
        first_name="芳",
        last_name="王",
        email_local="wangfang.lab",
        identity="实验室负责人（能源材料实验室）",
        org_roles=(("lab_energy", "OWNER", False), ("group_wang", "PI", True)),
        sees="实验室下所有课题组的 ANCESTRY 级记录（非管理员，用于验证上级节点主 PI）",
    ),
    AccountSpec(
        key="zhaoqiang",
        display_name="赵强",
        first_name="强",
        last_name="赵",
        email_local="zhaoqiang.admin",
        identity="学院组织管理员（UNIT_ADMIN）",
        org_roles=(("institute", "UNIT_ADMIN", False),),
        sees="组织架构管理入口 + 学院范围的 DIRECT_ADVISOR / UNIT 记录",
    ),
    AccountSpec(
        key="chenjing",
        display_name="陈静",
        first_name="静",
        last_name="陈",
        email_local="chenjing.advisor",
        identity="直接导师（ADVISOR，张伟课题组）",
        org_roles=(("group_zhang", "ADVISOR", False),),
        employee_id="AI4MS-2026-0201",
        identity_status="ACTIVE",
        sees="被绑定学生（刘洋 / 周敏 / 孙浩）的全部报告；阶段必评人",
    ),
    AccountSpec(
        key="zhengkai",
        display_name="郑凯",
        first_name="凯",
        last_name="郑",
        email_local="zhengkai.reviewer",
        identity="评审人 + 小组负责人（石墨负极小组）",
        org_roles=(("group_zhang", "REVIEWER", False), ("team_graphite", "OWNER", False)),
        sees="被指派的阶段评审；本小组记录",
    ),
    AccountSpec(
        key="liuyang",
        display_name="刘洋",
        first_name="洋",
        last_name="刘",
        email_local="liuyang.phd",
        identity="博士生（PHD，张伟课题组）",
        org_roles=(("group_zhang", UNIT_MEMBER_ROLE, False),),
        employee_id="AI4MS-2026-0301",
        identity_status="ACTIVE",
        sees="自己的项目全链路数据 + 6 篇不同可见范围的报告（ACL 矩阵所有者）",
    ),
    AccountSpec(
        key="zhoumin",
        display_name="周敏",
        first_name="敏",
        last_name="周",
        email_local="zhoumin.master",
        identity="硕士生（MASTER，张伟课题组）",
        org_roles=(("group_zhang", UNIT_MEMBER_ROLE, False),),
        sees="被显式授权的 CUSTOM 报告；同课题组 UNIT 级记录",
    ),
    AccountSpec(
        key="sunhao",
        display_name="孙浩",
        first_name="浩",
        last_name="孙",
        email_local="sunhao.postdoc",
        identity="博士后（POSTDOC，张伟课题组）",
        org_roles=(("group_zhang", UNIT_MEMBER_ROLE, False),),
        employee_id="AI4MS-2026-0302",
        identity_status="ACTIVE",
        sees="自己的项目：预开题已通过、开题门槛全绿可现场提交",
    ),
    AccountSpec(
        key="wuting",
        display_name="吴婷",
        first_name="婷",
        last_name="吴",
        email_local="wuting.project",
        identity="科研项目人员（AI4MS 计算材料课题组，直接导师=fangyikai）",
        org_roles=(("group_calc", UNIT_MEMBER_ROLE, False),),
        sees="自己的项目：预开题被退回（带退回原因），报告直接导师是 fangyikai",
    ),
    AccountSpec(
        key="gaopeng",
        display_name="高鹏",
        first_name="鹏",
        last_name="高",
        email_local="gaopeng.member",
        identity="无关工作区成员（未挂任何科研组织关系）",
        org_roles=(),
        sees="除 WORKSPACE 级外的科研记录一律不可见（ACL 反向用例）",
    ),
    AccountSpec(
        key="hexue",
        display_name="何雪",
        first_name="雪",
        last_name="何",
        email_local="hexue.guest",
        identity="访客（Guest 角色）",
        workspace_role=WORKSPACE_GUEST_ROLE,
        employee_id="AI4MS-2026-0901",
        identity_status="SUSPENDED",
        sees="科研模块对访客不开放（导航与接口都不渲染）",
    ),
)

ACCOUNT_BY_KEY = {account.key: account for account in ACCOUNTS}

# Roles attached to the pre-existing owner account (fangyikai).
OWNER_ORG_ROLES = (
    ("institute", "PI", False),
    ("group_calc", "PI", True),
)

MENTOR_BINDINGS = (
    ("liuyang", "chenjing", "group_zhang"),
    ("zhoumin", "chenjing", "group_zhang"),
    ("sunhao", "chenjing", "group_zhang"),
    ("wuting", OWNER_KEY, "group_calc"),
)


@dataclass(frozen=True)
class ProjectSpec:
    key: str
    owner: str
    name: str
    identifier: str
    org_unit: str
    research_type: str
    workflow_status: str = "ACTIVE"
    stage_status: dict = field(default_factory=dict)
    material_counts: dict = field(default_factory=dict)
    manual_reviewers: dict = field(default_factory=dict)


PROJECTS = (
    ProjectSpec(
        key="liuyang",
        owner="liuyang",
        name="石墨负极界面调控机理研究",
        identifier="GRAINTER",
        org_unit="group_zhang",
        research_type="PHD",
        stage_status={
            "PRE_OPENING": "PASSED",
            "OPENING": "PASSED",
            "MIDTERM": "IN_PROGRESS",
        },
        material_counts={"PRE_OPENING": 2, "OPENING": 10, "MIDTERM": 4},
        manual_reviewers={"PRE_OPENING": ("zhengkai",), "OPENING": (OWNER_KEY,)},
    ),
    ProjectSpec(
        key="sunhao",
        owner="sunhao",
        name="固态电解质界面原位表征方法研究",
        identifier="SSEINSITU",
        org_unit="group_zhang",
        research_type="POSTDOC",
        stage_status={"PRE_OPENING": "PASSED", "OPENING": "IN_PROGRESS"},
        material_counts={"PRE_OPENING": 2, "OPENING": 10},
        manual_reviewers={"PRE_OPENING": ("zhengkai",)},
    ),
    ProjectSpec(
        key="zhoumin",
        owner="zhoumin",
        name="高熵合金涂层耐蚀性优化",
        identifier="HEACOAT",
        org_unit="group_zhang",
        research_type="MASTER",
        stage_status={"PRE_OPENING": "IN_PROGRESS"},
        material_counts={"PRE_OPENING": 1},
    ),
    ProjectSpec(
        key="wuting",
        owner="wuting",
        name="计算材料数据库与特征工程",
        identifier="MATDB",
        org_unit="group_calc",
        research_type="RESEARCH_PROJECT",
        stage_status={"PRE_OPENING": "NEEDS_REVISION"},
        material_counts={"PRE_OPENING": 2},
    ),
    ProjectSpec(
        key="zhangwei",
        owner="zhangwei",
        name="锂电材料跨尺度计算平台",
        identifier="LICALC",
        org_unit="group_zhang",
        research_type="RESEARCH_PROJECT",
        stage_status={"PRE_OPENING": "SUBMITTED"},
        material_counts={"PRE_OPENING": 2},
        manual_reviewers={"PRE_OPENING": (OWNER_KEY, "zhaoqiang", "zhengkai")},
    ),
    ProjectSpec(
        key="liming",
        owner="liming",
        name="硅碳复合负极工程化",
        identifier="SICANODE",
        org_unit="group_li",
        research_type="RESEARCH_PROJECT",
    ),
    ProjectSpec(
        key="liming_archived",
        owner="liming",
        name="退役电池回收工艺预研",
        identifier="RECYCLE",
        org_unit="group_li",
        research_type="RESEARCH_PROJECT",
        workflow_status="ARCHIVED",
    ),
    ProjectSpec(
        key="wangfang",
        owner="wangfang",
        name="智能传感材料探索",
        identifier="SMARTMAT",
        org_unit="group_wang",
        research_type="RESEARCH_PROJECT",
    ),
)

PROJECT_BY_KEY = {project.key: project for project in PROJECTS}

STAGE_MATERIAL_TITLES = {
    "TOPIC_DESCRIPTION": "选题说明",
    "GAP_ANALYSIS": "研究空白分析",
    "RESEARCH_QUESTION": "研究问题",
    "LITERATURE_REVIEW": "文献综述",
    "HYPOTHESIS": "研究假设",
    "TECHNICAL_ROUTE": "技术路线",
    "EXPERIMENT_DESIGN": "实验设计",
    "DATA_AND_METRICS": "数据与指标",
    "TIME_PLAN": "时间计划",
    "RISK_AND_BACKUP": "风险与备选方案",
    "CODE_PLAN": "代码与数据计划",
    "EXPERIMENT_RECORD_PLAN": "实验记录计划",
    "GOAL_COMPLETION": "目标完成情况",
    "COMPLETED_EXPERIMENTS": "已完成实验",
    "FAILED_EXPERIMENTS": "失败实验与原因",
    "DATA_SUMMARY": "数据小结",
    "CODE_PROGRESS": "代码进展",
    "PAPER_PROGRESS": "论文进展",
    "RISK_ADJUSTMENT": "风险与调整",
    "FINAL_REPORT": "结题报告",
    "THESIS_OR_OUTPUT": "学位论文 / 成果",
    "FULL_RESEARCH_CHAIN": "完整研发链",
    "EXPERIMENT_SUMMARY": "实验总表",
    "CODE_AND_SNAPSHOT": "代码与快照",
    "DATA_AND_ATTACHMENT_LIST": "数据与附件清单",
    "ADVISOR_OPINION": "导师评审意见",
}

STAGE_RETURN_REASON = "选题边界过宽，预开题材料缺少可验证的研究空白论证；请补充纳入文献的 gap 说明后重新提交。"


@dataclass(frozen=True)
class WorkItemSpec:
    name: str
    state_group: str = "unstarted"
    priority: str = "medium"
    assignee: str = ""


WORK_ITEMS = {
    "liuyang": (
        WorkItemSpec("界面 SEI 膜表征实验排期", "started", "high", "liuyang"),
        WorkItemSpec("采购高纯石墨坩埚（批次 A）", "unstarted", "urgent", "liuyang"),
        WorkItemSpec("阶段性数据整理与图表产出", "started", "medium", "liuyang"),
        WorkItemSpec("投稿准备：界面工程方法论文", "backlog", "low", "liuyang"),
        WorkItemSpec("原位 XRD 设备机时申请", "completed", "medium", "liuyang"),
    ),
    "sunhao": (
        WorkItemSpec("原位表征工装设计与加工", "started", "high", "sunhao"),
        WorkItemSpec("固态电解质样品批次记录整理", "unstarted", "medium", "sunhao"),
        WorkItemSpec("实验室安全培训复训申请", "completed", "low", "sunhao"),
    ),
    "zhoumin": (
        WorkItemSpec("高熵合金涂层制备参数摸索", "started", "medium", "zhoumin"),
        WorkItemSpec("盐雾腐蚀测试送样", "unstarted", "medium", "zhoumin"),
    ),
    "wuting": (
        WorkItemSpec("材料数据库字段字典整理", "started", "high", "wuting"),
        WorkItemSpec("特征工程流水线重构", "unstarted", "medium", "wuting"),
        WorkItemSpec("采购手套箱耗材（已撤回）", "backlog", "low", "wuting"),
    ),
    "zhangwei": (
        WorkItemSpec("跨尺度模型算力申请（GPU 集群）", "started", "urgent", "zhangwei"),
        WorkItemSpec("课题组季度进展评审会准备", "unstarted", "medium", "zhangwei"),
        WorkItemSpec("采购电化学工作站配件", "unstarted", "high", "zhangwei"),
        WorkItemSpec("实验室安全培训计划变更", "unstarted", "medium", "zhangwei"),
    ),
    "liming": (
        WorkItemSpec("硅碳复合负极中试线对接", "started", "high", "liming"),
        WorkItemSpec("退役电池拆解合规评估", "backlog", "medium", "liming"),
    ),
    "wangfang": (WorkItemSpec("柔性传感材料样品库整理", "unstarted", "low", "wangfang"),),
}


@dataclass(frozen=True)
class LiteraturePlan:
    included: int = 0
    collected: int = 0
    screened: int = 0
    excluded: int = 0
    unannotated: int = 0
    unsourced: int = 0


LITERATURE_PLAN = {
    # 20 fully annotated, sourced entries keep the pre-opening gate green.
    "liuyang": LiteraturePlan(included=20, collected=1, excluded=1),
    "sunhao": LiteraturePlan(included=20, collected=1),
    # one included entry without summary / gap / source turns the gate red.
    "zhoumin": LiteraturePlan(included=1, collected=3, unannotated=1, unsourced=1),
    "wuting": LiteraturePlan(included=20, screened=2),
    "zhangwei": LiteraturePlan(included=20, collected=1),
    "liming": LiteraturePlan(collected=3, screened=1, excluded=1),
}

LITERATURE_TOPICS = (
    "锂离子电池石墨负极 SEI 膜形成机制研究进展",
    "硅碳复合负极的界面稳定性调控策略",
    "固态电解质与电极界面的原位表征方法",
    "高熵合金涂层的耐腐蚀机理与制备工艺",
    "跨尺度计算在锂电材料设计中的应用",
    "材料数据库与特征工程在研发中的实践",
    "低温工况下锂离子电池界面阻抗演化",
    "原位 XRD 在电极相变研究中的应用",
    "电解液添加剂对首圈库仑效率的影响",
    "机器学习势函数在界面模拟中的进展",
)


@dataclass(frozen=True)
class ExperimentSpec:
    title: str
    status: str
    status_note: str = ""
    objective: str = ""


EXPERIMENTS = {
    "liuyang": (
        ExperimentSpec(
            "石墨负极界面 SEI 膜初期成膜实验",
            "COMPLETED",
            objective="验证不同成膜电位对 SEI 均匀性的影响",
        ),
        ExperimentSpec("不同电解液添加剂对首圈库仑效率的影响", "COMPLETED"),
        ExperimentSpec("硅碳复合负极循环稳定性对照实验", "FAILED"),
        # running without a status note: the midterm gate surfaces a red item
        ExperimentSpec("原位 XRD 监测锂化过程", "RUNNING"),
        ExperimentSpec(
            "低温工况下界面阻抗测试",
            "PLANNED",
            status_note="等待低温箱排期，预计下个周期开始",
        ),
        ExperimentSpec("界面模型 DFT 计算校验", "COMPLETED"),
    ),
    "sunhao": (
        ExperimentSpec(
            "固态电解质界面原位表征试运行",
            "PLANNED",
            status_note="工装加工中，预计两周后开始取样",
        ),
    ),
    "zhoumin": (ExperimentSpec("高熵合金涂层盐雾腐蚀对照实验", "COMPLETED"),),
    "wuting": (
        ExperimentSpec("材料数据库特征工程回归验证", "COMPLETED"),
        ExperimentSpec("高维特征降维方案对比实验", "FAILED"),
    ),
    "zhangwei": (
        ExperimentSpec("跨尺度模型参数标定实验", "COMPLETED"),
        ExperimentSpec("多尺度耦合求解精度验证", "RUNNING", status_note="算力排队中，本周可完成"),
        ExperimentSpec("实验数据与模型预测对齐", "PLANNED", status_note="等待实验组数据交付"),
    ),
    "liming": (ExperimentSpec("硅碳复合负极中试涂布实验", "COMPLETED"),),
}

# index of the experiment that receives an approved amendment (P1-EXP-05)
AMENDED_EXPERIMENTS = {"liuyang": 0, "zhangwei": 0}
AMENDMENT_REASON = "补充循环数据统计口径并修正结论表述，原始锁定字段不涉及修改。"
AMENDMENT_APPROVAL_COMMENT = "变更范围仅限结论与指标，同意。"


@dataclass(frozen=True)
class CodeRepositorySpec:
    provider: str
    url: str
    slug: str
    status: str = "ACTIVE"
    default_branch: str = "main"
    sync_error: str = ""
    artifacts: tuple = ()


CODE_REPOSITORIES = {
    "liuyang": (
        CodeRepositorySpec(
            "GITHUB",
            "https://github.com/ai4ms-demo/graphite-anode-interface",
            "ai4ms-demo/graphite-anode-interface",
            artifacts=(
                ("BRANCH", "main", "主分支"),
                ("COMMIT", "a1b2c3d", "补充 SEI 成膜电位分析"),
                ("TAG", "v0.3.0", "预开题版本"),
                ("SNAPSHOT", "graphite-anode-interface-2026-08.zip", "预开题代码快照"),
            ),
        ),
        CodeRepositorySpec(
            "GITLAB",
            "https://gitlab.ai4ms.local/ai4ms-demo/sei-model",
            "ai4ms-demo/sei-model",
            status="SYNC_FAILED",
            sync_error="remote repository unreachable (timeout after 3s)",
            artifacts=(("BRANCH", "develop", "模型开发分支"),),
        ),
    ),
    "sunhao": (
        CodeRepositorySpec(
            "LOCAL_GIT",
            "https://git.ai4ms.local/ai4ms-demo/sse-in-situ",
            "ai4ms-demo/sse-in-situ",
            artifacts=(
                ("COMMIT", "b7e4f01", "原位表征数据处理脚本初始化"),
                ("SNAPSHOT", "sse-in-situ-2026-09.zip", "开题代码快照"),
            ),
        ),
    ),
    "zhangwei": (
        CodeRepositorySpec(
            "GITEA",
            "https://git.ai4ms.local/ai4ms-demo/multiscale-lib",
            "ai4ms-demo/multiscale-lib",
            artifacts=(("COMMIT", "c91d2aa", "跨尺度求解器接口整理"),),
        ),
    ),
    "liming": (
        CodeRepositorySpec(
            "GITHUB",
            "https://github.com/ai4ms-demo/sic-anode-pilot",
            "ai4ms-demo/sic-anode-pilot",
            artifacts=(("BRANCH", "main", "中试数据分析"),),
        ),
    ),
}


@dataclass(frozen=True)
class OutcomeSpec:
    output_type: str
    title: str
    venue: str = ""
    doi: str = ""
    status: str = "DRAFT"
    published_offset_days: int = 0


OUTCOMES = {
    "liuyang": (
        OutcomeSpec(
            "PAPER",
            "石墨负极 SEI 膜均匀性调控的界面工程方法",
            "Journal of Power Sources (demo)",
            "10.9999/ai4ms.demo.outcome.001",
            "PUBLISHED",
            45,
        ),
        OutcomeSpec(
            "PATENT",
            "一种石墨负极预锂化界面处理工艺",
            "国家知识产权局（demo）",
            "10.9999/ai4ms.demo.outcome.002",
            "SUBMITTED",
        ),
        OutcomeSpec(
            "DATASET",
            "石墨负极界面 SEI 表征数据集 v1",
            "AI4MS 数据门户（demo）",
            "10.9999/ai4ms.demo.outcome.003",
            "ACCEPTED",
            10,
        ),
    ),
    "sunhao": (
        OutcomeSpec(
            "PAPER",
            "固态电解质界面原位表征方法综述",
            "Materials Today (demo)",
            "10.9999/ai4ms.demo.outcome.004",
        ),
    ),
    "wuting": (
        OutcomeSpec(
            "SOFTWARE",
            "材料特征工程工具包（demo）",
            "AI4MS 开源仓库（demo）",
            "10.9999/ai4ms.demo.outcome.005",
            "SUBMITTED",
        ),
    ),
    "liming": (
        OutcomeSpec(
            "PAPER",
            "硅碳复合负极工程化路径研究",
            "Energy Storage Materials (demo)",
            "10.9999/ai4ms.demo.outcome.006",
            "SUBMITTED",
        ),
        OutcomeSpec(
            "AWARD",
            "省部级科技进步奖（demo 登记）",
            "省级评审（demo）",
            "10.9999/ai4ms.demo.outcome.007",
        ),
    ),
    "zhangwei": (
        OutcomeSpec(
            "PAPER",
            "锂电材料跨尺度计算平台架构与验证",
            "Computational Materials Science (demo)",
            "10.9999/ai4ms.demo.outcome.008",
        ),
    ),
}


@dataclass(frozen=True)
class WeeklyReportSpec:
    week_offset: int
    status: str
    visibility: str = "DIRECT_ADVISOR"
    attachment: str = ""


@dataclass(frozen=True)
class MonthlyReportSpec:
    month_offset: int
    status: str
    visibility: str = "DIRECT_ADVISOR"
    attachment: str = ""


REPORT_PLANS = {
    "liuyang": (
        WeeklyReportSpec(2, "ACCEPTED"),
        WeeklyReportSpec(1, "NEEDS_REVISION"),
        WeeklyReportSpec(0, "SUBMITTED", attachment="PDF"),
    ),
    "zhoumin": (
        WeeklyReportSpec(2, "ACCEPTED"),
        WeeklyReportSpec(1, "ACCEPTED"),
        WeeklyReportSpec(0, "SUBMITTED", attachment="PNG"),
    ),
    "sunhao": (
        WeeklyReportSpec(1, "ACCEPTED"),
        WeeklyReportSpec(0, "SUBMITTED", attachment="MD"),
    ),
    "wuting": (
        WeeklyReportSpec(1, "DRAFT", visibility="PRIVATE"),
        WeeklyReportSpec(0, "SUBMITTED"),
    ),
    "zhangwei": (
        WeeklyReportSpec(2, "ACCEPTED", visibility="WORKSPACE"),
        WeeklyReportSpec(0, "SUBMITTED", visibility="WORKSPACE"),
    ),
    # the current week is missing on purpose: the summary lists them as pending
    "liming": (
        WeeklyReportSpec(2, "ACCEPTED", visibility="WORKSPACE"),
        WeeklyReportSpec(1, "DRAFT", visibility="WORKSPACE"),
    ),
    "wangfang": (WeeklyReportSpec(0, "DRAFT", visibility="UNIT"),),
}

MONTHLY_REPORT_PLANS = {
    "liuyang": MonthlyReportSpec(0, "SUBMITTED"),
    "zhoumin": MonthlyReportSpec(0, "DRAFT"),
    "sunhao": MonthlyReportSpec(0, "ACCEPTED"),
    "zhangwei": MonthlyReportSpec(0, "ACCEPTED", visibility="WORKSPACE"),
    "liming": MonthlyReportSpec(0, "ACCEPTED", visibility="WORKSPACE"),
    "wangfang": MonthlyReportSpec(0, "DRAFT", visibility="UNIT"),
}

REPORT_RETURN_COMMENT = (
    "实验数据只给了结论没有给原始记录，下周请补上循环曲线与测试条件；另外下阶段计划要写成可验收的条目。"
)

REPORT_ACCEPT_COMMENT = "进展清晰、数据完整，同意验收。"


# ACL matrix: six reports owned by ``liuyang`` in ``group_zhang``, one per
# visibility level. The CUSTOM report grants a single user (``zhoumin``) so the
# six-by-six decision matrix stays exact - a unit wide grant would also expose
# it to the group advisor.
@dataclass(frozen=True)
class MatrixReportSpec:
    visibility: str
    week_offset: int
    status: str
    grantee: str = ""


MATRIX_REPORTS = (
    MatrixReportSpec("PRIVATE", 11, "DRAFT"),
    MatrixReportSpec("DIRECT_ADVISOR", 10, "SUBMITTED"),
    MatrixReportSpec("UNIT", 9, "ACCEPTED"),
    MatrixReportSpec("ANCESTRY", 8, "SUBMITTED"),
    MatrixReportSpec("WORKSPACE", 7, "ACCEPTED"),
    MatrixReportSpec("CUSTOM", 6, "DRAFT", grantee="zhoumin"),
)

MATRIX_OWNER_PROJECT = "liuyang"

ACL_MATRIX_SUBJECTS = (
    ("owner", "liuyang", "报告作者本人"),
    ("advisor", "chenjing", "直接导师（MentorBinding）"),
    ("unit_member", "zhoumin", "同课题组普通成员"),
    ("ancestor_pi", "wangfang", "上级节点主 PI（非管理员）"),
    ("admin", OWNER_KEY, "工作区管理员"),
    ("stranger", "gaopeng", "无关工作区成员"),
)

ACL_MATRIX_EXPECTED = {
    "PRIVATE": {
        "owner": True,
        "advisor": False,
        "unit_member": False,
        "ancestor_pi": False,
        "admin": True,
        "stranger": False,
    },
    "DIRECT_ADVISOR": {
        "owner": True,
        "advisor": True,
        "unit_member": False,
        "ancestor_pi": False,
        "admin": True,
        "stranger": False,
    },
    "UNIT": {
        "owner": True,
        "advisor": True,
        "unit_member": True,
        "ancestor_pi": False,
        "admin": True,
        "stranger": False,
    },
    "ANCESTRY": {
        "owner": True,
        "advisor": False,
        "unit_member": False,
        "ancestor_pi": True,
        "admin": True,
        "stranger": False,
    },
    "WORKSPACE": {
        "owner": True,
        "advisor": True,
        "unit_member": True,
        "ancestor_pi": True,
        "admin": True,
        "stranger": True,
    },
    "CUSTOM": {
        "owner": True,
        "advisor": False,
        "unit_member": True,
        "ancestor_pi": False,
        "admin": True,
        "stranger": False,
    },
}


@dataclass(frozen=True)
class FlowStepSpec:
    approver_mode: str = "ANY"
    approver_role: str = ""
    approver: str = ""


@dataclass(frozen=True)
class FlowSpec:
    key: str
    name: str
    approval_type: str
    org_unit: str
    steps: tuple = ()


APPROVAL_FLOWS = (
    FlowSpec(
        key="purchase",
        name="采购审批（课题组 → 学院）",
        approval_type="PURCHASE",
        org_unit="institute",
        steps=(
            FlowStepSpec(approver_mode="ANY", approver_role="PI"),
            FlowStepSpec(approver_mode="ANY", approver_role="UNIT_ADMIN"),
        ),
    ),
    FlowSpec(
        key="task",
        name="任务审批（课题组主 PI）",
        approval_type="TASK",
        org_unit="group_zhang",
        steps=(FlowStepSpec(approver_mode="ANY", approver="zhangwei"),),
    ),
    FlowSpec(
        key="countersign",
        name="行政会签（实验室级 PI 会签）",
        approval_type="CUSTOM",
        org_unit="lab_energy",
        steps=(FlowStepSpec(approver_mode="ALL", approver_role="PI"),),
    ),
)


@dataclass(frozen=True)
class ApprovalRequestSpec:
    key: str
    flow: str
    project: str
    requester: str
    issue_name: str
    org_unit: str
    status: str
    current_step_order: int = 1
    approvals: tuple = ()
    rejection: tuple = ()
    withdrawal: str = ""
    state_group: str = "started"
    priority: str = "medium"


APPROVAL_REQUESTS = (
    ApprovalRequestSpec(
        key="purchase_graphite",
        flow="purchase",
        project="liuyang",
        requester="liuyang",
        issue_name="采购高纯石墨坩埚（批次 A）",
        org_unit="institute",
        status="PENDING",
        state_group="unstarted",
        priority="urgent",
    ),
    ApprovalRequestSpec(
        key="purchase_workstation",
        flow="purchase",
        project="zhangwei",
        requester="zhangwei",
        issue_name="采购电化学工作站配件",
        org_unit="institute",
        status="PENDING",
        current_step_order=2,
        approvals=(("zhangwei", 1, "课题组层面确认需求合理，同意采购。"),),
        state_group="unstarted",
        priority="high",
    ),
    ApprovalRequestSpec(
        key="task_safety",
        flow="task",
        project="sunhao",
        requester="sunhao",
        issue_name="实验室安全培训复训申请",
        org_unit="group_zhang",
        status="APPROVED",
        approvals=(("zhangwei", 1, "同意，按学院要求完成复训。"),),
        state_group="completed",
    ),
    ApprovalRequestSpec(
        key="countersign_safety_plan",
        flow="countersign",
        project="zhangwei",
        requester="zhangwei",
        issue_name="实验室安全培训计划变更",
        org_unit="lab_energy",
        status="REJECTED",
        rejection=("liming", 1, "变更影响其他课题组既有排期，建议先在实验室例会上讨论。"),
        state_group="backlog",
    ),
    ApprovalRequestSpec(
        key="purchase_glovebox",
        flow="purchase",
        project="wuting",
        requester="wuting",
        issue_name="采购手套箱耗材（已撤回）",
        org_unit="institute",
        status="WITHDRAWN",
        withdrawal="wuting",
        state_group="backlog",
        priority="low",
    ),
)


@dataclass(frozen=True)
class TemplateSpec:
    name: str
    report_type: str
    scope: str = "REPORT"
    stage: str = ""
    material_type: str = ""
    is_default: bool = False
    variables: tuple = ()
    headings: tuple = ()


TEMPLATES = (
    TemplateSpec(
        name="周报模板（进展 / 问题 / 下周计划）",
        report_type="WEEKLY",
        is_default=True,
        headings=("本周进展", "遇到的问题", "下周计划", "需要支持"),
    ),
    TemplateSpec(
        name="月报模板（阶段成果与下阶段安排）",
        report_type="MONTHLY",
        is_default=True,
        headings=("本月成果", "数据与实验小结", "下阶段安排", "风险与依赖"),
    ),
    TemplateSpec(
        name="选题说明模板",
        report_type="WEEKLY",
        scope="STAGE_MATERIAL",
        stage="PRE_OPENING",
        material_type="TOPIC_DESCRIPTION",
        variables=("user", "project", "stage"),
        headings=("研究背景", "拟解决问题", "预期贡献"),
    ),
    TemplateSpec(
        name="技术路线模板",
        report_type="WEEKLY",
        scope="STAGE_MATERIAL",
        stage="OPENING",
        material_type="TECHNICAL_ROUTE",
        variables=("user", "project", "stage"),
        headings=("总体技术路线", "关键步骤", "里程碑"),
    ),
)


@dataclass(frozen=True)
class IdentityMappingSpec:
    account: str
    subject: str
    employee_id: str
    status: str = "ACTIVE"


IDENTITY_MAPPINGS = (
    IdentityMappingSpec("zhangwei", "ai4ms-sub-0101", "AI4MS-2026-0101"),
    IdentityMappingSpec("chenjing", "ai4ms-sub-0201", "AI4MS-2026-0201"),
    IdentityMappingSpec("liuyang", "ai4ms-sub-0301", "AI4MS-2026-0301"),
    IdentityMappingSpec("sunhao", "ai4ms-sub-0302", "AI4MS-2026-0302"),
    IdentityMappingSpec("hexue", "ai4ms-sub-0901", "AI4MS-2026-0901", status="SUSPENDED"),
)
