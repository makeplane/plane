# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Uniform error envelope for the research namespace.

Every research response that fails a rule check carries ``error_code`` and
``message`` so the frontend can map failures to localised copy.
"""

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response


class ResearchAPIException(APIException):
    """Raised before DRF finalises the response (e.g. inside ``initial()``).

    Views returned from ``dispatch`` are not finalised by DRF, so early exits
    must go through the exception path; ``ResearchAPIView.handle_exception``
    turns this back into the standard envelope.
    """

    def __init__(self, error_code, message, http_status=status.HTTP_400_BAD_REQUEST):
        self.error_code = error_code
        self.message_text = message
        self.status_code = http_status
        super().__init__(detail=message)


class ResearchErrorCode:
    MODULE_DISABLED = "research_module_disabled"
    MODULE_NOT_ENABLED = "research_module_not_enabled"
    SUBMODULE_DISABLED = "research_submodule_disabled"
    WORKSPACE_NOT_FOUND = "research_workspace_not_found"
    PERMISSION_DENIED = "research_permission_denied"

    ORG_UNIT_NOT_FOUND = "org_unit_not_found"
    ORG_UNIT_CYCLE_DETECTED = "org_unit_cycle_detected"
    ORG_UNIT_DUPLICATE_NAME = "org_unit_duplicate_name"
    ORG_UNIT_ROOT_EXISTS = "org_unit_root_exists"
    ORG_UNIT_ROOT_REQUIRED = "org_unit_root_required"
    ORG_UNIT_PARENT_INVALID = "org_unit_parent_invalid"
    ORG_UNIT_ROOT_UNDELETABLE = "org_unit_root_undeletable"
    ORG_UNIT_HAS_CHILDREN = "org_unit_has_children"
    ORG_UNIT_TYPE_INVALID = "org_unit_type_invalid"

    ORG_MEMBER_NOT_FOUND = "org_member_not_found"
    ORG_MEMBER_EXISTS = "org_member_exists"
    ORG_MEMBER_INVALID = "org_member_invalid"
    ORG_MEMBER_PRIMARY_CONFLICT = "org_member_primary_conflict"

    MENTOR_BINDING_NOT_FOUND = "mentor_binding_not_found"
    MENTOR_BINDING_EXISTS = "mentor_binding_exists"
    MENTOR_BINDING_INVALID = "mentor_binding_invalid"

    USER_NOT_FOUND = "research_user_not_found"
    IDENTITY_SUBJECT_REQUIRED = "identity_subject_required"
    IDENTITY_MAPPING_EXISTS = "identity_mapping_exists"
    IDENTITY_MAPPING_NOT_FOUND = "identity_mapping_not_found"
    IDENTITY_CONFLICT = "identity_conflict"
    PROJECT_NOT_FOUND = "research_project_not_found"
    PROJECT_ALREADY_EXISTS = "research_project_exists"
    REPORT_NOT_FOUND = "report_not_found"
    REPORT_PERIOD_CONFLICT = "report_period_conflict"
    REPORT_STATE_CONFLICT = "report_state_conflict"
    REPORT_READ_ONLY = "report_read_only"
    REPORT_RETURN_REASON_REQUIRED = "report_return_reason_required"
    REPORT_VISIBILITY_EXCEEDS_DEFAULT = "report_visibility_exceeds_default"
    TEMPLATE_NOT_FOUND = "report_template_not_found"
    TEMPLATE_VARIABLES_UNRESOLVED = "template_variables_unresolved"
    FILE_TYPE_NOT_ALLOWED = "file_type_not_allowed"
    FILE_SIZE_EXCEEDED = "file_size_exceeded"
    ATTACHMENT_NOT_FOUND = "report_attachment_not_found"
    APPROVAL_FLOW_NOT_FOUND = "approval_flow_not_found"
    APPROVAL_REQUEST_NOT_FOUND = "approval_request_not_found"
    APPROVAL_STATE_CONFLICT = "approval_state_conflict"
    APPROVAL_ACTION_NOT_ALLOWED = "approval_action_not_allowed"
    APPROVAL_COMMENT_REQUIRED = "approval_comment_required"

    STAGE_NOT_FOUND = "stage_not_found"
    STAGE_INSTANCES_EXIST = "stage_instances_exist"
    STAGE_STATE_CONFLICT = "stage_state_conflict"
    STAGE_SEQUENCE_BLOCKED = "stage_sequence_blocked"
    STAGE_ALREADY_ACTIVE = "stage_already_active"
    STAGE_GATE_BLOCKED = "stage_gate_blocked"
    STAGE_REVIEW_BLOCKED = "stage_review_blocked"
    STAGE_REASON_REQUIRED = "stage_reason_required"
    STAGE_CONFIRM_REQUIRED = "stage_confirm_required"
    STAGE_REQUIREMENT_NOT_FOUND = "stage_requirement_not_found"
    STAGE_REQUIREMENT_INVALID = "stage_requirement_invalid"
    MATERIAL_NOT_FOUND = "stage_material_not_found"
    MATERIAL_TYPE_INVALID = "stage_material_type_invalid"
    MATERIAL_READ_ONLY = "stage_material_read_only"
    MATERIAL_VERSION_NOT_FOUND = "stage_material_version_not_found"

    REVIEW_NOT_FOUND = "stage_review_not_found"
    REVIEW_STATE_CONFLICT = "stage_review_state_conflict"
    REVIEW_COMMENT_REQUIRED = "stage_review_comment_required"
    REVIEW_SELF_FORBIDDEN = "stage_review_self_forbidden"
    REVIEW_NOT_ASSIGNED = "stage_review_not_assigned"
    REVIEW_ASSIGNMENT_NOT_FOUND = "stage_review_assignment_not_found"
    REVIEW_ASSIGNMENT_EXISTS = "stage_review_assignment_exists"
    REVIEW_RECOMMENDATION_INVALID = "stage_review_recommendation_invalid"
    REVIEW_SCORE_INVALID = "stage_review_score_invalid"
    REVIEW_REVISION_REASON_REQUIRED = "stage_review_revision_reason_required"

    LITERATURE_NOT_FOUND = "literature_not_found"
    LITERATURE_DUPLICATE_DOI = "literature_duplicate_doi"
    LITERATURE_LIMIT_EXCEEDED = "literature_limit_exceeded"
    LITERATURE_NOT_ANNOTATED = "literature_not_annotated"
    LITERATURE_STATUS_INVALID = "literature_status_invalid"
    LITERATURE_IMPORT_EMPTY = "literature_import_empty"

    EXPERIMENT_NOT_FOUND = "experiment_not_found"
    EXPERIMENT_STATE_CONFLICT = "experiment_state_conflict"
    EXPERIMENT_READ_ONLY = "experiment_read_only"
    EXPERIMENT_LOCKED_FIELD = "experiment_locked_field"
    EXPERIMENT_ARCHIVED = "experiment_archived"
    EXPERIMENT_ASSET_NOT_FOUND = "experiment_asset_not_found"
    EXPERIMENT_ASSET_EXISTS = "experiment_asset_exists"
    AMENDMENT_NOT_FOUND = "experiment_amendment_not_found"
    AMENDMENT_STATE_CONFLICT = "experiment_amendment_state_conflict"
    AMENDMENT_REASON_REQUIRED = "experiment_amendment_reason_required"
    AMENDMENT_CHANGE_SET_REQUIRED = "experiment_amendment_change_set_required"
    AMENDMENT_FIELD_NOT_ALLOWED = "experiment_amendment_field_not_allowed"
    AMENDMENT_PENDING_EXISTS = "experiment_amendment_pending_exists"
    AMENDMENT_COMMENT_REQUIRED = "experiment_amendment_comment_required"

    CODE_REPOSITORY_NOT_FOUND = "code_repository_not_found"
    CODE_REPOSITORY_EXISTS = "code_repository_exists"
    CODE_REPOSITORY_INVALID = "code_repository_invalid"
    CODE_ARTIFACT_NOT_FOUND = "code_artifact_not_found"
    CODE_ARTIFACT_EXISTS = "code_artifact_exists"
    CODE_ARTIFACT_INVALID = "code_artifact_invalid"


def research_error(error_code, message, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error_code": error_code, "message": message}, status=http_status)


def research_permission_denied(message="You don't have the required permissions."):
    return research_error(
        ResearchErrorCode.PERMISSION_DENIED,
        message,
        status.HTTP_403_FORBIDDEN,
    )


def research_not_found(error_code, message):
    return research_error(error_code, message, status.HTTP_404_NOT_FOUND)


def research_conflict(error_code, message):
    return research_error(error_code, message, status.HTTP_409_CONFLICT)
