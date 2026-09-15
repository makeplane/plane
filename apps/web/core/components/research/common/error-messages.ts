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
};

export const RESEARCH_GENERIC_ERROR_KEY = "research.errors.generic";

export const getResearchErrorKey = (error?: unknown): string => {
  const errorCode = (error as { error_code?: string } | null | undefined)?.error_code;
  if (!errorCode) return RESEARCH_GENERIC_ERROR_KEY;
  return RESEARCH_ERROR_KEYS[errorCode] ?? RESEARCH_GENERIC_ERROR_KEY;
};

export const getResearchErrorCode = (error?: unknown): string | null =>
  (error as { error_code?: string } | null | undefined)?.error_code ?? null;
