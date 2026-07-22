from datetime import timedelta
from uuid import uuid4

from django.utils import timezone

from plane.db.models import (
    Issue,
    LooperArtifact,
    LooperCollaborationEvent,
    LooperCollaborationSnapshot,
    LooperDispatch,
    LooperRoleRequest,
    LooperRoleRequestMessage,
    Profile,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)


PASSWORD = "LooperDemo-2026!"


def user(email, display_name):
    member, _ = User.objects.get_or_create(email=email, defaults={"username": email, "display_name": display_name})
    member.username = email
    member.display_name = display_name
    member.is_active = True
    member.is_email_verified = True
    member.is_password_autoset = False
    member.set_password(PASSWORD)
    member.save()
    Profile.objects.update_or_create(
        user=member,
        defaults={"is_onboarded": True, "is_tour_completed": True, "language": "zh-CN"},
    )
    return member


owner = user("owner@looper-demo.local", "杨瑾龙")
product = user("product@looper-demo.local", "孙庆雨")
designer = user("design@looper-demo.local", "范桢")
qa = user("qa@looper-demo.local", "尚欣雨")

workspace, _ = Workspace.objects.update_or_create(
    slug="looper-demo",
    defaults={"name": "Looper 协作演示", "owner": owner, "timezone": "Asia/Shanghai"},
)
for member in (owner, product, designer, qa):
    WorkspaceMember.objects.update_or_create(
        workspace=workspace,
        member=member,
        defaults={"role": 20 if member == owner else 15, "is_active": True},
    )

project, _ = Project.objects.update_or_create(
    workspace=workspace,
    identifier="LOOP",
    defaults={"name": "Looper Collaboration", "created_by": owner, "updated_by": owner},
)
for member in (owner, product, designer, qa):
    ProjectMember.objects.update_or_create(
        project=project,
        member=member,
        defaults={"role": 20 if member == owner else 15, "is_active": True},
    )

state, _ = State.objects.update_or_create(
    project=project,
    name="Todo",
    defaults={"group": "backlog", "default": True, "color": "#6B7280"},
)


def issue(name):
    return Issue.objects.create(
        name=name,
        workspace=workspace,
        project=project,
        state=state,
        created_by=owner,
        updated_by=owner,
    )


def dispatch(issue, node_name, state="awaiting_human", wait_kind="role_decision"):
    return LooperDispatch.objects.create(
        project=project,
        issue=issue,
        requested_mode="auto",
        active_role="planner",
        owner_member=owner,
        dispatched_by_member=owner,
        node_id=f"demo-{uuid4()}",
        node_name_snapshot=node_name,
        role_policy_revision=1,
        product_member_snapshot=product,
        design_member_snapshot=designer,
        qa_member_snapshot=qa,
        state=state,
        wait_kind=wait_kind,
        last_node_ack_at=timezone.now(),
        idempotency_key=uuid4(),
    )


idle_issue = issue("无待决策问题：角色保持紧凑")
dispatch(idle_issue, "elian-demo-macbook", state="running", wait_kind=None)

quick_issue = issue("多角色决策示例：导出入口与重试策略")
quick_dispatch = dispatch(quick_issue, "elian-demo-macbook")
quick_questions = (
    (
        "product",
        {
            "id": "PROD-101",
            "question": "导出功能首版应优先支持哪些格式？",
            "context": "目前一次覆盖所有格式会显著拉长交付时间，需要先明确首版范围，避免研发按错误边界实现。",
            "options": [
                {"id": "PROD-101-A", "label": "HTML + CSS", "impact": "最快交付，但 React 用户仍需手工改造"},
                {"id": "PROD-101-B", "label": "HTML + CSS + React", "impact": "覆盖主要研发场景，工期适中"},
                {"id": "PROD-101-C", "label": "同时支持全部格式", "impact": "体验完整，但首版风险和工期最高"},
            ],
            "recommended_option": "PROD-101-B",
            "recommendation_reason": "覆盖主要用户，同时把首版范围控制在可验证的边界内。",
        },
        product,
    ),
    (
        "design",
        {
            "id": "DESIGN-201",
            "question": "导出入口放在哪里？",
            "context": "导出是高频操作，但顶部主操作区空间有限；需要在可发现性和界面密度之间取舍。",
            "options": [
                {"id": "DESIGN-201-A", "label": "顶部主操作区", "impact": "最容易发现，但会挤压现有操作"},
                {"id": "DESIGN-201-B", "label": "更多菜单", "impact": "界面更克制，但入口更深"},
                {"id": "DESIGN-201-C", "label": "导出完成页", "impact": "上下文明确，但首次导出路径不直观"},
            ],
            "recommended_option": "DESIGN-201-A",
            "recommendation_reason": "导出属于核心动作，首版应优先保证可发现性。",
        },
        designer,
    ),
    (
        "engineering",
        {
            "id": "ENG-301",
            "question": "大文件导出失败后的重试策略采用哪种？",
            "context": "固定重试容易在服务拥堵时放大压力；仅手动重试则会把恢复成本转嫁给用户。",
            "options": [
                {"id": "ENG-301-A", "label": "固定重试 3 次", "impact": "实现简单，但拥堵时可能连续失败"},
                {"id": "ENG-301-B", "label": "带抖动的指数退避", "impact": "更稳健，需要明确最大等待时间"},
                {"id": "ENG-301-C", "label": "仅允许用户手动重试", "impact": "服务压力最低，但用户体验最差"},
            ],
            "recommended_option": "ENG-301-B",
            "recommendation_reason": "能降低瞬时故障和拥堵造成的连续失败。",
        },
        owner,
    ),
)
quick_requests = {}
for index, (role, question, eligible_member) in enumerate(quick_questions, start=1):
    quick_requests[role] = LooperRoleRequest.objects.create(
        project=project,
        dispatch=quick_dispatch,
        source_event_key=f"demo-quick-{index}",
        role=role,
        question_summary=f"{question['id']} · {question['question']}",
        questions=[{**question, "role": role, "design_document_required": False}],
        eligible_member=eligible_member,
        policy_revision=1,
    )
engineering_request = quick_requests["engineering"]
human_message = LooperRoleRequestMessage.objects.create(
    project=project,
    role_request=engineering_request,
    kind="human_reply",
    body="指数退避具体会让用户等多久？如果很久，体验也不好。",
    actor_member=owner,
    client_message_id=uuid4(),
    delivery_state="processed",
)
LooperRoleRequestMessage.objects.create(
    project=project,
    role_request=engineering_request,
    kind="looper_reply",
    body="建议最多自动尝试 3 次，约在 1 秒、2 秒、4 秒后重试，总等待不超过 7 秒。你确认采用这个上限吗？",
    client_message_id=uuid4(),
    in_reply_to=human_message,
    delivery_state="delivered",
    evaluation={
        "resolved": False,
        "questions": [{"id": "ENG-301", "status": "still_open", "answer": "", "reason": "等待负责人确认最大等待时间"}],
    },
)
engineering_request.resolution = {
    "resolved": False,
    "questions": [{"id": "ENG-301", "status": "still_open", "answer": "", "reason": "等待负责人确认最大等待时间"}],
}
engineering_request.save(update_fields=["resolution", "updated_at"])
LooperCollaborationSnapshot.objects.create(
    project=project,
    dispatch=quick_dispatch,
    phase="role_decisions",
    phase_started_at=timezone.now(),
    waiting_role="product",
    waiting_member=product,
    role_counts={"product": {"open": 1}, "design": {"open": 1}, "engineering": {"open": 1}},
    snapshot_version=1,
)

delivery_issue = issue("交付概览示例：决策已齐备并进入实现")
delivery_dispatch = dispatch(delivery_issue, "杨瑾龙的 MacBook Pro", state="running", wait_kind=None)
delivery_dispatch.active_role = "worker"
delivery_dispatch.state_version = 7
delivery_dispatch.revision = 3
delivery_dispatch.save(update_fields=["active_role", "state_version", "revision", "updated_at"])
delivery_started_at = timezone.now() - timedelta(minutes=41)
LooperDispatch.objects.filter(id=delivery_dispatch.id).update(created_at=delivery_started_at)

resolved_questions = (
    ("product", "PROD-401", "首版导出范围", "HTML、CSS 与 React", product),
    ("design", "DESIGN-402", "导出入口位置", "放在顶部主操作区", designer),
    ("engineering", "ENG-403", "失败重试策略", "最多 3 次指数退避", owner),
)
for index, (role, question_id, question, answer, eligible_member) in enumerate(resolved_questions, start=1):
    role_request = LooperRoleRequest.objects.create(
        project=project,
        dispatch=delivery_dispatch,
        source_event_key=f"demo-delivery-role-{index}",
        role=role,
        question_summary=f"{question_id} · {question}",
        questions=[
            {
                "id": question_id,
                "role": role,
                "question": question,
                "context": "实现前需要明确这一项决策。",
                "options": [],
                "recommended_option": "",
                "recommendation_reason": "",
                "design_document_required": False,
            }
        ],
        eligible_member=eligible_member,
        policy_revision=1,
        status="answered",
        conversation_state="resolved",
        resolution={
            "resolved": True,
            "questions": [{"id": question_id, "status": "decided", "answer": answer, "reason": "已由决策人确认"}],
        },
        answered_at=delivery_started_at + timedelta(minutes=10 + index),
    )
    LooperRoleRequestMessage.objects.create(
        project=project,
        role_request=role_request,
        kind="human_reply",
        body=answer,
        actor_member=eligible_member,
        client_message_id=uuid4(),
        delivery_state="processed",
    )

technical_spec = LooperArtifact.objects.create(
    project=project,
    dispatch=delivery_dispatch,
    source_event_key="demo-delivery-technical-spec",
    type="technical_spec",
    title="技术 Spec",
    url="https://plane.powerformer.net/open-design/pages/looper-demo-spec",
    source_revision_id="spec-revision-3",
    source_kind="plane_page",
    source_object_id="looper-demo-spec",
)
LooperArtifact.objects.create(
    project=project,
    dispatch=delivery_dispatch,
    source_event_key="demo-delivery-product-decisions",
    type="product_decision",
    title="产品决策",
    url="https://plane.powerformer.net/open-design/pages/looper-demo-product",
    source_revision_id="product-revision-2",
    source_kind="plane_page",
    source_object_id="looper-demo-product",
)
LooperArtifact.objects.create(
    project=project,
    dispatch=delivery_dispatch,
    source_event_key="demo-delivery-design-plan",
    type="design_plan",
    title="设计方案",
    url="https://plane.powerformer.net/open-design/pages/looper-demo-design",
    source_revision_id="design-revision-1",
    source_kind="plane_page",
    source_object_id="looper-demo-design",
)

delivery_events = (
    (1, "role_request_answered", "role_decisions", "product", product, None, 13),
    (2, "technical_spec_approved", "technical_spec", "", owner, technical_spec, 25),
    (3, "dispatch_running", "implementation", "", None, None, 27),
)
for version, event_type, phase, role, actor, artifact, minutes in delivery_events:
    LooperCollaborationEvent.objects.create(
        project=project,
        dispatch=delivery_dispatch,
        event_version=version,
        source_event_key=f"demo-delivery-event-{version}",
        event_type=event_type,
        phase=phase,
        role=role,
        actor_member=actor,
        role_policy_revision=1,
        artifact=artifact,
        occurred_at=delivery_started_at + timedelta(minutes=minutes),
    )
LooperCollaborationSnapshot.objects.create(
    project=project,
    dispatch=delivery_dispatch,
    phase="implementation",
    phase_started_at=delivery_started_at + timedelta(minutes=27),
    role_counts={
        "product": {"answered": 1},
        "design": {"answered": 1},
        "engineering": {"answered": 1},
    },
    snapshot_version=3,
)

formal_issue = issue("正式产品 spec 示例：多格式导出升级")
formal_dispatch = dispatch(formal_issue, "elian-demo-macbook")
LooperRoleRequest.objects.create(
    project=project,
    dispatch=formal_dispatch,
    source_event_key="demo-formal-product-spec",
    role="product",
    question_summary=(
        "PROD-000 · 该需求同时涉及导出格式范围、历史记录和大文件稳定性，"
        "目标用户、首版范围与验收标准尚不明确。请先在 Plane 发布正式产品 spec 后再继续。"
    ),
    questions=[
        {
            "id": "PROD-000",
            "role": "product",
            "question": "请先提供正式产品 Spec",
            "context": "该需求同时涉及导出格式范围、历史记录和大文件稳定性，目标用户、首版范围与验收标准尚不明确。",
            "options": [],
            "recommended_option": "",
            "recommendation_reason": "",
            "design_document_required": False,
        }
    ],
    eligible_member=product,
    policy_revision=1,
)
LooperCollaborationSnapshot.objects.create(
    project=project,
    dispatch=formal_dispatch,
    phase="role_decisions",
    phase_started_at=timezone.now(),
    waiting_role="product",
    waiting_member=product,
    role_counts={"product": {"open": 1}},
    snapshot_version=1,
)

owner.profile.last_workspace_id = workspace.id
owner.profile.save(update_fields=["last_workspace_id"])

for demo_issue in (idle_issue, quick_issue, formal_issue, delivery_issue):
    print(f"{demo_issue.sequence_id}: http://localhost:3000/looper-demo/browse/LOOP-{demo_issue.sequence_id}")
print(f"login: {owner.email} / {PASSWORD}")
