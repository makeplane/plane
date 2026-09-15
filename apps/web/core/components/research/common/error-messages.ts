/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Maps backend `error_code` values to i18n keys. Unknown codes fall back to a
 * generic message so a new server side rule never renders an empty toast.
 */
const RESEARCH_ERROR_KEYS: Record<string, string> = {
  research_module_disabled: "research.errors.module_disabled",
  research_module_not_enabled: "research.errors.module_disabled",
  research_workspace_not_found: "research.errors.workspace_not_found",
  research_permission_denied: "research.errors.permission_denied",
  research_submodule_disabled: "research.errors.submodule_disabled",
  org_unit_not_found: "research.errors.org_unit_not_found",
  org_unit_cycle_detected: "research.errors.org_unit_cycle_detected",
  org_unit_duplicate_name: "research.errors.org_unit_duplicate_name",
  org_unit_root_exists: "research.errors.org_unit_root_exists",
  org_unit_root_undeletable: "research.errors.org_unit_root_undeletable",
  org_unit_parent_invalid: "research.errors.org_unit_parent_invalid",
  org_unit_type_invalid: "research.errors.org_unit_type_invalid",
  org_member_exists: "research.errors.org_member_exists",
  org_member_invalid: "research.errors.org_member_invalid",
  org_member_not_found: "research.errors.org_member_not_found",
  mentor_binding_exists: "research.errors.mentor_binding_exists",
  mentor_binding_invalid: "research.errors.mentor_binding_invalid",
  mentor_binding_not_found: "research.errors.mentor_binding_not_found",
  research_user_not_found: "research.errors.user_not_found",
  report_period_conflict: "research.errors.report_period_conflict",
  report_state_conflict: "research.errors.report_state_conflict",
  report_read_only: "research.errors.report_read_only",
  report_return_reason_required: "research.errors.report_return_reason_required",
  report_visibility_exceeds_default: "research.errors.report_visibility_exceeds_default",
  research_project_exists: "research.errors.research_project_exists",
  research_project_not_found: "research.errors.research_project_not_found",
  file_type_not_allowed: "research.errors.file_type_not_allowed",
  file_size_exceeded: "research.errors.file_size_exceeded",
  approval_flow_not_found: "research.errors.approval_flow_not_found",
  approval_request_not_found: "research.errors.approval_request_not_found",
  approval_state_conflict: "research.errors.approval_state_conflict",
  approval_action_not_allowed: "research.errors.approval_action_not_allowed",
  approval_comment_required: "research.errors.approval_comment_required",
  // ---- P1 stage workflow & materials ----
  stage_not_found: "research.errors.stage_not_found",
  stage_instances_exist: "research.errors.stage_instances_exist",
  stage_state_conflict: "research.errors.stage_state_conflict",
  stage_sequence_blocked: "research.errors.stage_sequence_blocked",
  stage_already_active: "research.errors.stage_already_active",
  stage_gate_blocked: "research.errors.stage_gate_blocked",
  stage_review_blocked: "research.errors.stage_review_blocked",
  stage_reason_required: "research.errors.stage_reason_required",
  stage_confirm_required: "research.errors.stage_confirm_required",
  stage_requirement_not_found: "research.errors.stage_requirement_not_found",
  stage_requirement_invalid: "research.errors.stage_requirement_invalid",
  stage_material_not_found: "research.errors.stage_material_not_found",
  stage_material_type_invalid: "research.errors.stage_material_type_invalid",
  stage_material_read_only: "research.errors.stage_material_read_only",
  stage_material_version_not_found: "research.errors.stage_material_version_not_found",
  template_variables_unresolved: "research.errors.template_variables_unresolved",
  // ---- P1 reviews ----
  stage_review_not_found: "research.errors.stage_review_not_found",
  stage_review_state_conflict: "research.errors.stage_review_state_conflict",
  stage_review_comment_required: "research.errors.stage_review_comment_required",
  stage_review_self_forbidden: "research.errors.stage_review_self_forbidden",
  stage_review_not_assigned: "research.errors.stage_review_not_assigned",
  stage_review_assignment_not_found: "research.errors.stage_review_assignment_not_found",
  stage_review_assignment_exists: "research.errors.stage_review_assignment_exists",
  stage_review_recommendation_invalid: "research.errors.stage_review_recommendation_invalid",
  stage_review_score_invalid: "research.errors.stage_review_score_invalid",
  stage_review_revision_reason_required: "research.errors.stage_review_revision_reason_required",
  // ---- P1 literature ----
  literature_not_found: "research.errors.literature_not_found",
  literature_duplicate_doi: "research.errors.literature_duplicate_doi",
  literature_limit_exceeded: "research.errors.literature_limit_exceeded",
  literature_not_annotated: "research.errors.literature_not_annotated",
  literature_status_invalid: "research.errors.literature_status_invalid",
  literature_import_empty: "research.errors.literature_import_empty",
  // ---- P1 experiments ----
  experiment_not_found: "research.errors.experiment_not_found",
  experiment_state_conflict: "research.errors.experiment_state_conflict",
  experiment_read_only: "research.errors.experiment_read_only",
  experiment_locked_field: "research.errors.experiment_locked_field",
  experiment_archived: "research.errors.experiment_archived",
  experiment_asset_not_found: "research.errors.experiment_asset_not_found",
  experiment_asset_exists: "research.errors.experiment_asset_exists",
  experiment_amendment_not_found: "research.errors.experiment_amendment_not_found",
  experiment_amendment_state_conflict: "research.errors.experiment_amendment_state_conflict",
  experiment_amendment_reason_required: "research.errors.experiment_amendment_reason_required",
  experiment_amendment_change_set_required: "research.errors.experiment_amendment_change_set_required",
  experiment_amendment_field_not_allowed: "research.errors.experiment_amendment_field_not_allowed",
  experiment_amendment_pending_exists: "research.errors.experiment_amendment_pending_exists",
  experiment_amendment_comment_required: "research.errors.experiment_amendment_comment_required",
  // ---- P1 code ----
  code_repository_not_found: "research.errors.code_repository_not_found",
  code_repository_exists: "research.errors.code_repository_exists",
  code_repository_invalid: "research.errors.code_repository_invalid",
  code_artifact_not_found: "research.errors.code_artifact_not_found",
  code_artifact_exists: "research.errors.code_artifact_exists",
  code_artifact_invalid: "research.errors.code_artifact_invalid",
  // ---- P1 outcomes ----
  research_outcome_not_found: "research.errors.research_outcome_not_found",
  research_outcome_invalid: "research.errors.research_outcome_invalid",
  research_outcome_target_not_found: "research.errors.research_outcome_target_not_found",
  research_chain_invalid: "research.errors.research_chain_invalid",
  // ---- P1 integrations ----
  integration_not_configured: "research.errors.integration_not_configured",
  integration_connection_not_found: "research.errors.integration_connection_not_found",
  integration_connection_exists: "research.errors.integration_connection_exists",
  integration_invalid: "research.errors.integration_invalid",
  external_reference_not_found: "research.errors.external_reference_not_found",
  external_reference_exists: "research.errors.external_reference_exists",
  external_reference_invalid: "research.errors.external_reference_invalid",
  external_reference_link_not_found: "research.errors.external_reference_link_not_found",
};

export const RESEARCH_GENERIC_ERROR_KEY = "research.errors.generic";

export const getResearchErrorKey = (error?: unknown): string => {
  const errorCode = (error as { error_code?: string } | null | undefined)?.error_code;
  if (!errorCode) return RESEARCH_GENERIC_ERROR_KEY;
  return RESEARCH_ERROR_KEYS[errorCode] ?? RESEARCH_GENERIC_ERROR_KEY;
};

export const getResearchErrorCode = (error?: unknown): string | null =>
  (error as { error_code?: string } | null | undefined)?.error_code ?? null;
