import html
import re
from uuid import UUID, uuid4

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
    LooperRoleRequestMessage,
)
from plane.integrations.looper.dispatch import append_dispatch_event, valid_termination_summary
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
                f"<br>• {html.escape(option['id'])}：{html.escape(option['label'])} —— {html.escape(option['impact'])}"
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
        "conversation_state": role_request.conversation_state,
        "questions": role_request.questions,
        "resolution": role_request.resolution,
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


def _message_payload(message):
    actor = message.actor_member
    return {
        "id": str(message.id),
        "client_message_id": str(message.client_message_id),
        "kind": message.kind,
        "body": message.body,
        "delivery_state": message.delivery_state,
        "evaluation": message.evaluation,
        "in_reply_to_message_id": str(message.in_reply_to_id) if message.in_reply_to_id else None,
        "comment_id": str(message.comment_id) if message.comment_id else None,
        "actor": (
            {
                "id": str(actor.id),
                "display_name": actor.display_name or actor.email,
                "avatar": actor.avatar_url,
            }
            if actor
            else None
        ),
        "created_at": message.created_at,
    }


def _validate_evaluation(role_request, value):
    if not isinstance(value, dict):
        raise ProtocolError("evaluation must be an object")
    entries = value.get("questions")
    if not isinstance(entries, list):
        raise ProtocolError("evaluation.questions must be a list")
    expected_ids = [str(question.get("id", "")) for question in role_request.questions]
    if not expected_ids:
        raise ProtocolError("role request has no structured questions")
    seen = set()
    clean_entries = []
    for item in entries:
        if not isinstance(item, dict):
            raise ProtocolError("evaluation question must be an object")
        question_id = str(item.get("id", "")).strip()
        question_status = str(item.get("status", "")).strip()
        answer = str(item.get("answer", "")).strip()
        reason = str(item.get("reason", "")).strip()
        if question_id not in expected_ids or question_id in seen:
            raise ProtocolError("evaluation contains an unknown or duplicate question id")
        if question_status not in {"decided", "delegated", "still_open"}:
            raise ProtocolError("evaluation question status is invalid")
        if question_status != "still_open" and not answer:
            raise ProtocolError("resolved evaluation questions require an answer")
        if len(answer) > 5000 or len(reason) > 2000:
            raise ProtocolError("evaluation question content is too long")
        if question_id == "PROD-000" and question_status != "still_open":
            raise ProtocolError("formal product spec cannot be resolved by conversation")
        seen.add(question_id)
        clean_entries.append({"id": question_id, "status": question_status, "answer": answer, "reason": reason})
    if seen != set(expected_ids):
        raise ProtocolError("evaluation must cover every question exactly once")
    resolved = value.get("resolved") is True
    has_open = any(item["status"] == "still_open" for item in clean_entries)
    if resolved == has_open:
        raise ProtocolError("evaluation.resolved does not match question statuses")
    return {"resolved": resolved, "questions": clean_entries}


def _create_human_message(*, role_request, actor, body, client_message_id, legacy_answer=False):
    comment = IssueComment.objects.create(
        workspace_id=role_request.workspace_id,
        project_id=role_request.project_id,
        issue=role_request.dispatch.issue,
        actor=actor,
        created_by=actor,
        updated_by=actor,
        comment_html=f"<p>{html.escape(body)}</p>",
        external_source="looper-role-conversation-human",
        external_id=f"role-message:{client_message_id}",
    )
    message = LooperRoleRequestMessage.objects.create(
        workspace_id=role_request.workspace_id,
        project_id=role_request.project_id,
        role_request=role_request,
        kind="human_reply",
        body=body,
        actor_member=actor,
        client_message_id=client_message_id,
        delivery_state="pending",
        comment=comment,
        created_by=actor,
        updated_by=actor,
    )
    LooperDispatch.objects.select_for_update().get(id=role_request.dispatch_id)
    role_request.conversation_state = "waiting_looper"
    role_request.save(update_fields=("conversation_state", "updated_at"))
    append_dispatch_event(
        role_request.dispatch,
        event_type="role_message_created",
        phase="role_decisions",
        actor=actor,
        payload={
            "message_id": str(message.id),
            "comment_id": str(comment.id),
            "legacy_answer": legacy_answer,
        },
        source_event_key=f"{role_request.source_event_key}:human:{client_message_id}",
    )
    return message


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
            if dispatch.state == "running" and not valid_termination_summary(body.get("termination_summary")):
                raise ProtocolError("termination_summary is required before waiting for a role decision")
            member = _eligible_member(dispatch, role)
            if member is None:
                raise ProtocolError("role has no eligible member in this dispatch revision")
            source_event_key = f"decision:{loop_id}:{role}:{decision_revision}"
            existing = LooperRoleRequest.objects.filter(dispatch=dispatch, source_event_key=source_event_key).first()
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
                questions=questions,
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


class LooperRoleRequestMessageEndpoint(BaseAPIView):
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
        if role_request.status != "open":
            return Response({"error": "role_request_not_open"}, status=status.HTTP_409_CONFLICT)
        body = str(request.data.get("message", "")).strip()
        try:
            client_message_id = UUID(str(request.data.get("client_message_id")))
        except (ValueError, TypeError, AttributeError):
            return Response({"error": "invalid_client_message_id"}, status=status.HTTP_400_BAD_REQUEST)
        if not body or len(body) > 5000:
            return Response({"error": "invalid_message"}, status=status.HTTP_400_BAD_REQUEST)
        existing = LooperRoleRequestMessage.objects.filter(
            role_request=role_request,
            client_message_id=client_message_id,
        ).first()
        if existing is not None:
            return Response({"message": _message_payload(existing), "created": False})
        message = _create_human_message(
            role_request=role_request,
            actor=request.user,
            body=body,
            client_message_id=client_message_id,
        )
        return Response(
            {"message": _message_payload(message), "created": True},
            status=status.HTTP_201_CREATED,
        )


def _authenticate_dispatch_message_request(request, project_id, dispatch):
    raw_body, body = _json_body(request)
    expected_state_version = int(body["expected_state_version"])
    execution_attempt_id = UUID(str(body["execution_attempt_id"]))
    fencing_token = int(body["fencing_token"])
    session_id = UUID(str(body["session_id"]))
    instance_nonce = _decode_instance_nonce(body["instance_nonce"])
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
    if dispatch.state_version != expected_state_version:
        raise ProtocolError("dispatch state version is stale")
    if dispatch.execution_attempt_id != execution_attempt_id or dispatch.fencing_token != fencing_token:
        raise ProtocolError("dispatch execution authority is stale")
    return body


class LooperRoleRequestPendingMessagesEndpoint(BaseAPIView):
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
            _authenticate_dispatch_message_request(request, project_id, dispatch)
            if dispatch.state != "awaiting_human" or dispatch.wait_kind != "role_decision":
                raise ProtocolError("dispatch is not waiting for role decisions")
        except (KeyError, ValueError, TypeError, ProtocolError) as exc:
            return Response({"error": "invalid_node_request", "detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        pending = list(
            LooperRoleRequestMessage.objects.filter(
                role_request__dispatch=dispatch,
                role_request__status="open",
                kind="human_reply",
                delivery_state="pending",
            )
            .select_related("role_request", "actor_member", "comment")
            .order_by("created_at", "id")
        )
        role_request_ids = {message.role_request_id for message in pending}
        histories = {
            role_request_id: [
                _message_payload(message)
                for message in LooperRoleRequestMessage.objects.filter(role_request_id=role_request_id)
                .select_related("actor_member", "comment")
                .order_by("created_at", "id")
            ]
            for role_request_id in role_request_ids
        }
        return Response(
            {
                "pending": [
                    {
                        "role_request": _role_request_payload(message.role_request, created=False),
                        "message": _message_payload(message),
                        "history": histories[message.role_request_id],
                    }
                    for message in pending
                ]
            }
        )


class LooperRoleRequestLooperReplyEndpoint(BaseAPIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    @transaction.atomic
    def post(self, request, slug, project_id, dispatch_id, role_request_id):
        dispatch = get_object_or_404(
            LooperDispatch.objects.select_for_update(),
            id=dispatch_id,
            project_id=project_id,
            workspace__slug=slug,
        )
        role_request = get_object_or_404(
            LooperRoleRequest.objects.select_for_update(),
            id=role_request_id,
            dispatch=dispatch,
        )
        try:
            body = _authenticate_dispatch_message_request(request, project_id, dispatch)
            client_message_id = UUID(str(body["client_message_id"]))
            in_reply_to_id = UUID(str(body["in_reply_to_message_id"]))
            processed_message_ids = {UUID(str(value)) for value in body.get("processed_message_ids", [in_reply_to_id])}
            if (
                not processed_message_ids
                or len(processed_message_ids) > 50
                or in_reply_to_id not in processed_message_ids
            ):
                raise ProtocolError("processed_message_ids is invalid")
            reply = str(body.get("reply", "")).strip()
            if not reply or len(reply) > 5000:
                raise ProtocolError("reply is invalid")
            evaluation = _validate_evaluation(role_request, body.get("evaluation"))
            in_reply_to = LooperRoleRequestMessage.objects.select_for_update().get(
                id=in_reply_to_id,
                role_request=role_request,
                kind="human_reply",
            )
            processed_messages = list(
                LooperRoleRequestMessage.objects.select_for_update().filter(
                    id__in=processed_message_ids,
                    role_request=role_request,
                    kind="human_reply",
                )
            )
            if len(processed_messages) != len(processed_message_ids):
                raise ProtocolError("processed_message_ids contains an invalid message")
            existing = LooperRoleRequestMessage.objects.filter(
                role_request=role_request,
                client_message_id=client_message_id,
            ).first()
            if existing is not None:
                return Response({"message": _message_payload(existing), "created": False})
            if role_request.status != "open":
                raise ProtocolError("role request is not open")
            comment = IssueComment.objects.create(
                workspace_id=role_request.workspace_id,
                project_id=role_request.project_id,
                issue=dispatch.issue,
                actor=None,
                comment_html=f"<p>{html.escape(reply)}</p>",
                external_source="looper-role-conversation-agent",
                external_id=f"role-message:{client_message_id}",
            )
            message = LooperRoleRequestMessage.objects.create(
                workspace_id=role_request.workspace_id,
                project_id=role_request.project_id,
                role_request=role_request,
                kind="looper_reply",
                body=reply,
                client_message_id=client_message_id,
                in_reply_to=in_reply_to,
                delivery_state="delivered",
                evaluation=evaluation,
                comment=comment,
            )
            LooperRoleRequestMessage.objects.filter(id__in=processed_message_ids).update(
                delivery_state="processed",
                updated_at=timezone.now(),
            )
            role_request.resolution = evaluation
            if evaluation["resolved"]:
                role_request.status = "answered"
                role_request.conversation_state = "resolved"
                role_request.answer_comment = comment
                role_request.answered_at = timezone.now()
                update_fields = (
                    "status",
                    "conversation_state",
                    "resolution",
                    "answer_comment",
                    "answered_at",
                    "updated_at",
                )
                event_type = "role_request_answered"
            else:
                role_request.conversation_state = "waiting_human"
                update_fields = ("conversation_state", "resolution", "updated_at")
                event_type = "role_message_follow_up"
            role_request.save(update_fields=update_fields)
            append_dispatch_event(
                dispatch,
                event_type=event_type,
                phase="role_decisions",
                payload={"message_id": str(message.id), "comment_id": str(comment.id), "evaluation": evaluation},
                source_event_key=f"{role_request.source_event_key}:looper:{client_message_id}",
            )
            if evaluation["resolved"]:
                open_request = (
                    LooperRoleRequest.objects.filter(dispatch=dispatch, status="open")
                    .select_related("eligible_member")
                    .first()
                )
                LooperCollaborationSnapshot.objects.filter(dispatch=dispatch).update(
                    waiting_role=open_request.role if open_request else "",
                    waiting_member=open_request.eligible_member if open_request else None,
                )
        except LooperRoleRequestMessage.DoesNotExist:
            return Response({"error": "reply_target_not_found"}, status=status.HTTP_409_CONFLICT)
        except (KeyError, ValueError, TypeError, ProtocolError) as exc:
            return Response({"error": "invalid_node_request", "detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response({"message": _message_payload(message), "created": True}, status=status.HTTP_201_CREATED)


class LooperRoleRequestAnswerEndpoint(BaseAPIView):
    """Compatibility shim: legacy answers now enter the same Looper-judged conversation."""

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
        answer = str(request.data.get("answer", "")).strip()
        if not answer or len(answer) > 5000:
            return Response({"error": "invalid_answer"}, status=status.HTTP_400_BAD_REQUEST)
        client_message_id = uuid4()
        message = _create_human_message(
            role_request=role_request,
            actor=request.user,
            body=answer,
            client_message_id=client_message_id,
            legacy_answer=True,
        )
        return Response(
            {
                "role_request": _role_request_payload(role_request, created=False),
                "message": _message_payload(message),
            }
        )
