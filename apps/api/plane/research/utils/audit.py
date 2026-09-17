# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Append-only research audit writer.

``record_audit_event`` is the single write path for the research audit trail.
It stores summaries only - never report bodies - so the write stays cheap and
inside the caller's transaction.
"""

from plane.db.models import ResearchAuditEvent


class ResearchAuditAction:
    ORG_UNIT_CREATE = "org.unit.create"
    ORG_UNIT_UPDATE = "org.unit.update"
    ORG_UNIT_MOVE = "org.unit.move"
    ORG_UNIT_DELETE = "org.unit.delete"
    ORG_MEMBER_ADD = "org.member.add"
    ORG_MEMBER_UPDATE = "org.member.update"
    ORG_MEMBER_REMOVE = "org.member.remove"
    ORG_PI_TRANSFER = "org.pi.transfer"
    MENTOR_BINDING_CREATE = "org.mentor.bind"
    MENTOR_BINDING_UPDATE = "org.mentor.update"
    MENTOR_BINDING_DELETE = "org.mentor.unbind"
    IDENTITY_LOGIN = "identity.login"
    IDENTITY_BIND = "identity.bind"
    IDENTITY_UNBIND = "identity.unbind"
    IDENTITY_PROVISION = "identity.provision"
    IDENTITY_CONFLICT = "identity.conflict"
    IDENTITY_SUSPENDED = "identity.suspended"
    CONFIG_UPDATE = "config.update"
    TEMPLATE_CREATE = "template.create"
    TEMPLATE_UPDATE = "template.update"
    TEMPLATE_DELETE = "template.delete"
    REPORT_VISIBILITY_UPDATE = "report.visibility.update"
    REPORT_SUBMIT = "report.submit"
    REPORT_RETURN = "report.return"
    REPORT_ACCEPT = "report.accept"
    REPORT_CREATE = "report.create"
    REPORT_ATTACHMENT_ADD = "report.attachment.add"
    REPORT_ATTACHMENT_DELETE = "report.attachment.delete"
    REPORT_ATTACHMENT_DENIED = "report.attachment.denied"
    REPORT_IMPORT_MARKDOWN = "report.import.markdown"
    PROJECT_CREATE = "project.create"
    PROJECT_ARCHIVE = "project.archive"
    PROJECT_RESTORE = "project.restore"
    PROJECT_OWNER_CHANGE = "project.owner.change"
    APPROVAL_FLOW_CREATE = "approval.flow.create"
    APPROVAL_FLOW_UPDATE = "approval.flow.update"
    APPROVAL_REQUEST_CREATE = "approval.request.create"
    APPROVAL_APPROVE = "approval.approve"
    APPROVAL_REJECT = "approval.reject"
    APPROVAL_WITHDRAW = "approval.withdraw"
    APPROVAL_CANCEL = "approval.cancel"
    STAGE_ENTER = "stage.enter"
    STAGE_SUBMIT = "stage.submit"
    STAGE_RETURN = "stage.return"
    STAGE_PASS = "stage.pass"
    STAGE_REOPEN = "stage.reopen"
    STAGE_MATERIAL_CREATE = "stage.material.create"
    STAGE_MATERIAL_UPDATE = "stage.material.update"
    STAGE_MATERIAL_SUBMIT = "stage.material.submit"
    STAGE_MATERIAL_OVERRIDE = "stage.material.override"
    STAGE_REQUIREMENT_UPDATE = "stage.requirement.update"
    REVIEW_ASSIGN = "stage.review.assign"
    REVIEW_UNASSIGN = "stage.review.unassign"
    REVIEW_SUBMIT = "stage.review.submit"
    REVIEW_REVISE = "stage.review.revise"
    REVIEW_REMIND = "stage.review.remind"
    LITERATURE_CREATE = "literature.create"
    LITERATURE_UPDATE = "literature.update"
    LITERATURE_DELETE = "literature.delete"
    LITERATURE_STATUS = "literature.status"
    LITERATURE_IMPORT = "literature.import"
    LITERATURE_PDF = "literature.pdf"
    EXPERIMENT_CREATE = "experiment.create"
    EXPERIMENT_UPDATE = "experiment.update"
    EXPERIMENT_SUBMIT = "experiment.submit"
    EXPERIMENT_ARCHIVE = "experiment.archive"
    EXPERIMENT_AMENDMENT_CREATE = "experiment.amendment.create"
    EXPERIMENT_AMENDMENT_APPROVE = "experiment.amendment.approve"
    EXPERIMENT_AMENDMENT_REJECT = "experiment.amendment.reject"
    EXPERIMENT_AMENDMENT_CANCEL = "experiment.amendment.cancel"
    EXPERIMENT_ASSET_LINK = "experiment.asset.link"
    EXPERIMENT_ASSET_UNLINK = "experiment.asset.unlink"
    EXPERIMENT_INGEST = "experiment.ingest"
    CODE_REPOSITORY_CREATE = "code.repository.create"
    CODE_REPOSITORY_UPDATE = "code.repository.update"
    CODE_REPOSITORY_ARCHIVE = "code.repository.archive"
    CODE_CREDENTIAL_UPDATE = "code.credential.update"
    CODE_SYNC = "code.sync"
    CODE_ARTIFACT_CREATE = "code.artifact.create"
    CODE_ARTIFACT_UPDATE = "code.artifact.update"
    CODE_SNAPSHOT_CREATE = "code.snapshot.create"
    OUTCOME_CREATE = "outcome.create"
    OUTCOME_UPDATE = "outcome.update"
    OUTCOME_DELETE = "outcome.delete"
    OUTCOME_LINK = "outcome.link"
    CHAIN_EXPORT = "chain.export"
    INTEGRATION_CONNECTION_UPDATE = "integration.connection.update"
    INTEGRATION_CALL = "integration.call"
    INTEGRATION_REFERENCE_CREATE = "integration.reference.create"
    INTEGRATION_REFERENCE_UPDATE = "integration.reference.update"
    INTEGRATION_REFERENCE_DELETE = "integration.reference.delete"
    INTEGRATION_REFERENCE_LINK = "integration.reference.link"
    INTEGRATION_REFERENCE_UNLINK = "integration.reference.unlink"
    INVITE_CODE_CREATE = "account.invite.create"
    INVITE_CODE_UPDATE = "account.invite.update"
    INVITE_CODE_DELETE = "account.invite.delete"
    INVITE_CODE_REDEEM = "account.invite.redeem"
    USER_IMPORT = "account.import.run"
    USER_PROFILE_UPDATE = "account.profile.update"
    CONTEXT_READ = "context.read"


class ResearchResourceType:
    ORG_UNIT = "org_unit"
    ORG_UNIT_MEMBER = "org_unit_member"
    MENTOR_BINDING = "mentor_binding"
    IDENTITY_MAPPING = "identity_mapping"
    USER = "user"
    WORKSPACE_SETTING = "workspace_setting"
    REPORT_TEMPLATE = "report_template"
    REPORT = "report"
    REPORT_ATTACHMENT = "report_attachment"
    PROJECT_PROFILE = "research_project"
    APPROVAL_FLOW = "approval_flow"
    APPROVAL_REQUEST = "approval_request"
    STAGE = "stage_instance"
    STAGE_MATERIAL = "stage_material"
    STAGE_REQUIREMENT = "stage_requirement"
    STAGE_REVIEW = "stage_review"
    STAGE_REVIEW_ASSIGNMENT = "stage_review_assignment"
    LITERATURE = "literature_entry"
    EXPERIMENT = "experiment_record"
    EXPERIMENT_AMENDMENT = "experiment_amendment"
    EXPERIMENT_ASSET = "experiment_asset_link"
    CODE_REPOSITORY = "code_repository"
    CODE_ARTIFACT = "code_artifact"
    OUTCOME = "research_outcome"
    INTEGRATION = "integration"
    EXTERNAL_REFERENCE = "external_reference"
    INVITE_CODE = "invite_code"
    IMPORT_BATCH = "user_import_batch"
    USER_PROFILE = "research_user_profile"
    CONTEXT = "research_context"


def _client_metadata(request):
    if request is None:
        return {"ip_address": None, "user_agent": None}
    ip_address = request.META.get("REMOTE_ADDR") or None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip() or ip_address
    user_agent = (request.META.get("HTTP_USER_AGENT") or "")[:255] or None
    return {"ip_address": ip_address, "user_agent": user_agent}


def record_audit_event(
    *,
    workspace,
    action,
    resource_type,
    resource_id=None,
    actor=None,
    org_unit=None,
    metadata=None,
    request=None,
):
    """Append a single audit event. Never raises on missing optional context."""
    client = _client_metadata(request)
    if actor is None and request is not None:
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            actor = user

    return ResearchAuditEvent.objects.create(
        workspace=workspace,
        actor=actor,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        org_unit=org_unit,
        metadata=metadata or {},
        ip_address=client["ip_address"],
        user_agent=client["user_agent"],
    )
