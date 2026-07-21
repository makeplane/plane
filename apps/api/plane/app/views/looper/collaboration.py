import html
import re
from uuid import UUID

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ProjectEntityPermission, ROLE, allow_permission
from plane.db.models import (
    IssueComment,
    LooperCollaborationSnapshot,
    LooperDispatch,
    LooperRoleRequest,
)
from plane.integrations.looper.dispatch import append_dispatch_event
from plane.integrations.looper.protocol import ProtocolError
from plane.integrations.looper.replay import consume_request_nonce

from .. import BaseAPIView
from .dispatch import (
    _decode_instance_nonce,
    _json_body,
    _require_active_session,
    _verify_signed_node_request,
)


ROLE_VALUES = {"product", "design", "engineering", "qa"}
LOOP_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")


def _eligible_member(dispatch, role):
    return {
        "product": dispatch.product_member_snapshot,
        "design": dispatch.design_member_snapshot,
        "engineering": dispatch.owner_member,
        "qa": dispatch.qa_member_snapshot,
    }[role]


def _validate_questions(value, role):
    if not isinstance(value, list) or not value or len(value) > 20:
        raise ProtocolError("questions must contain 1-20 items")
    questions = []
    for item in value:
        if not isinstance(item, dict):
            raise ProtocolError("each question must be an object")
        question_id = str(item.get("id", "")).strip()
        question = str(item.get("question", "")).strip()
        context = str(item.get("context", "")).strip()
        if not question_id or len(question_id) > 64 or not question or len(question) > 500:
            raise ProtocolError("question id/text is invalid")
        if not context or len(context) > 4000:
            raise ProtocolError("question context is invalid")
        options = item.get("options", [])
        if not isinstance(options, list) or len(options) > 3:
            raise ProtocolError("question options are invalid")
        clean_options = []
        for option in options:
            if not isinstance(option, dict):
                raise ProtocolError("question option must be an object")
            option_id = str(option.get("id", "")).strip()
            label = str(option.get("label", "")).strip()
            impact = str(option.get("impact", "")).strip()
            if not option_id or not label or len(option_id) > 80 or len(label) > 500 or len(impact) > 1000:
                raise ProtocolError("question option is invalid")
            clean_options.append({"id": option_id, "label": label, "impact": impact})
        questions.append(
            {
                "id": question_id,
                "role": role,
                "question": question,
                "context": context,
                "options": clean_options,
                "recommended_option": str(item.get("recommended_option", "")).strip()[:80],
                "recommendation_reason": str(item.get("recommendation_reason", "")).strip()[:1000],
                "design_document_required": item.get("design_document_required") is True,
            }
        )
    return questions


def _request_comment_html(loop_id, role, revision, brief_summary, questions):
    marker = f"<!-- looper:decision-request v=1 loop={loop_id} role={role} revision={revision} -->"
    parts = [marker, f"<p><strong>需要{html.escape(role)}负责人拍板</strong></p>"]
    if brief_summary:
        parts.append(f"<p><strong>背景：</strong>{html.escape(brief_summary)}</p>")
    for question in questions:
        parts.append(
            f"<p><strong>{html.escape(question['id'])} · {html.escape(question['question'])}</strong>"
            f"<br>{html.escape(question['context'])}"
        )
        if question["design_document_required"]:
            parts.append("<br><strong>所需产物：</strong>请提供可访问的设计稿或设计文档 URL。")
        for option in question["options"]:
            parts.append(
                f"<br>• {html.escape(option['id'])}：{html.escape(option['label'])}"
                f" —— {html.escape(option['impact'])}"
            )
        if question["recommended_option"]:
            parts.append(
                f"<br>建议：<strong>{html.escape(question['recommended_option'])}</strong>"
                f" —— {html.escape(question['recommendation_reason'])}"
            )
        parts.append("</p>")
    if any(question["id"] == "PROD-000" for question in questions):
        parts.append(
            "<p>请创建或打开产品方案页，并在当前 work item 的 Links 中以 "
            "<strong>looper:product-spec</strong> 为标题关联；普通评论不会解除门禁。</p>"
        )
    else:
        parts.append("<p>请由上方指定负责人在 Looper 协作卡中回答；其他人的评论不会解除门禁。</p>")
    return "".join(parts)


def _role_request_payload(role_request, *, created):
    member = role_request.eligible_member
    return {
        "id": str(role_request.id),
        "role": role_request.role,
        "status": role_request.status,
        "comment_id": str(role_request.answer_comment_id or ""),
        "request_comment_id": str(
            role_request.events.filter(event_type="role_request_created")
            .values_list("payload__request_comment_id", flat=True)
            .first()
            or ""
        ),
        "eligible_member_id": str(role_request.eligible_member_id),
        "eligible_member_name": member.display_name or member.email,
        "created_at": role_request.created_at,
        "created": created,
    }


class LooperRoleRequestCreateEndpoint(BaseAPIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    @transaction.atomic
    def post(self, request, slug, project_id, dispatch_id):
        dispatch = get_object_or_404(
            LooperDispatch.objects.select_for_update(),
            id=dispatch_id,
            project_id=project_id,
            workspace__slug=slug,
        )
        try:
            raw_body, body = _json_body(request)
            expected_state_version = int(body["expected_state_version"])
            execution_attempt_id = UUID(str(body["execution_attempt_id"]))
            fencing_token = int(body["fencing_token"])
            session_id = UUID(str(body["session_id"]))
            instance_nonce = _decode_instance_nonce(body["instance_nonce"])
            role = str(body.get("role", "")).strip()
            loop_id = str(body.get("loop_id", "")).strip()
            decision_revision = int(body["decision_revision"])
            if role not in ROLE_VALUES or not LOOP_ID_PATTERN.fullmatch(loop_id) or decision_revision <= 0:
                raise ProtocolError("role request identity is invalid")
            questions = _validate_questions(body.get("questions"), role)
            binding, verified = _verify_signed_node_request(
                request,
                project_id=project_id,
                raw_body=raw_body,
                dispatch=dispatch,
                expected_state_version=expected_state_version,
                expected_attempt_id=execution_attempt_id,
                expected_fencing_token=fencing_token,
            )
            if dispatch.node_binding_id != binding.id:
                raise ProtocolError("dispatch belongs to another Node binding")
            _require_active_session(binding, session_id, instance_nonce)
            consume_request_nonce(
                binding_id=verified.binding_id,
                key_revision=verified.key_revision,
                nonce=verified.nonce,
            )
            if dispatch.state not in {"running", "awaiting_human"}:
                raise ProtocolError("dispatch is not accepting role requests")
            if dispatch.state_version != expected_state_version:
                raise ProtocolError("dispatch state version is stale")
            member = _eligible_member(dispatch, role)
            if member is None:
                raise ProtocolError("role has no eligible member in this dispatch revision")
            source_event_key = f"decision:{loop_id}:{role}:{decision_revision}"
            existing = LooperRoleRequest.objects.filter(
                dispatch=dispatch, source_event_key=source_event_key
            ).first()
            if existing is not None:
                return Response({"role_request": _role_request_payload(existing, created=False)})

            request_comment = IssueComment.objects.create(
                workspace_id=dispatch.workspace_id,
                project_id=dispatch.project_id,
                issue=dispatch.issue,
                actor=None,
                comment_html=_request_comment_html(
                    loop_id,
                    role,
                    decision_revision,
                    str(body.get("brief_summary", "")).strip()[:2000],
                    questions,
                ),
                external_source="looper-strict-role-request",
                external_id=source_event_key,
            )
            role_request = LooperRoleRequest.objects.create(
                workspace_id=dispatch.workspace_id,
                project_id=dispatch.project_id,
                dispatch=dispatch,
                source_event_key=source_event_key,
                role=role,
                question_summary=f"{questions[0]['id']} · {questions[0]['question']}",
                eligible_member=member,
                policy_revision=dispatch.role_policy_revision,
            )
            if dispatch.state == "running":
                dispatch.state = "awaiting_human"
                dispatch.wait_kind = "role_decision"
                dispatch.state_version += 1
                dispatch.save(update_fields=("state", "wait_kind", "state_version", "updated_at"))
            event = append_dispatch_event(
                dispatch,
                event_type="role_request_created",
                phase="role_decisions",
                payload={
                    "request_comment_id": str(request_comment.id),
                    "questions": questions,
                },
                source_event_key=source_event_key,
            )
            event.role = role
            event.role_request = role_request
            event.save(update_fields=("role", "role_request", "updated_at"))
            LooperCollaborationSnapshot.objects.filter(dispatch=dispatch).update(
                waiting_role=role,
                waiting_member=member,
            )
        except (KeyError, ValueError, TypeError, ProtocolError) as exc:
            return Response(
                {"error": "invalid_role_request", "detail": str(exc)},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            {"role_request": _role_request_payload(role_request, created=True)},
            status=status.HTTP_201_CREATED,
        )


class LooperRoleRequestAnswerEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @transaction.atomic
    def post(self, request, slug, project_id, role_request_id):
        role_request = get_object_or_404(
            LooperRoleRequest.objects.select_for_update(),
            id=role_request_id,
            project_id=project_id,
            workspace__slug=slug,
        )
        if role_request.eligible_member_id != request.user.id:
            return Response({"error": "not_role_decision_owner"}, status=status.HTTP_403_FORBIDDEN)
        if role_request.status == "answered":
            return Response({"role_request": _role_request_payload(role_request, created=False)})
        if role_request.status != "open":
            return Response({"error": "role_request_not_open"}, status=status.HTTP_409_CONFLICT)
        if role_request.question_summary.startswith("PROD-000 ·"):
            return Response(
                {"error": "formal_product_spec_required"},
                status=status.HTTP_409_CONFLICT,
            )
        answer = str(request.data.get("answer", "")).strip()
        if not answer or len(answer) > 5000:
            return Response({"error": "invalid_answer"}, status=status.HTTP_400_BAD_REQUEST)
        comment = IssueComment.objects.create(
            workspace_id=role_request.workspace_id,
            project_id=role_request.project_id,
            issue=role_request.dispatch.issue,
            actor=request.user,
            created_by=request.user,
            updated_by=request.user,
            comment_html=f"<p>{html.escape(answer)}</p>",
            external_source="looper-strict-role-answer",
            external_id=f"role-answer:{role_request.id}",
        )
        role_request.status = "answered"
        role_request.answer_comment = comment
        role_request.answered_at = timezone.now()
        role_request.save(update_fields=("status", "answer_comment", "answered_at", "updated_at"))
        append_dispatch_event(
            role_request.dispatch,
            event_type="role_request_answered",
            phase="role_decisions",
            actor=request.user,
            payload={"answer_comment_id": str(comment.id)},
            source_event_key=f"{role_request.source_event_key}:answered",
        )
        open_request = (
            LooperRoleRequest.objects.filter(dispatch=role_request.dispatch, status="open")
            .select_related("eligible_member")
            .first()
        )
        LooperCollaborationSnapshot.objects.filter(dispatch=role_request.dispatch).update(
            waiting_role=open_request.role if open_request else "",
            waiting_member=open_request.eligible_member if open_request else None,
        )
        return Response({"role_request": _role_request_payload(role_request, created=False)})
