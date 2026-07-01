/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TProjectTemplateType = "built_in" | "custom";

export type TProjectTemplateStateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled" | "triage";

export type TProjectTemplateModuleStatus = "backlog" | "planned" | "in-progress" | "paused" | "completed" | "cancelled";

export type TProjectTemplateIssuePriority = "urgent" | "high" | "medium" | "low" | "none";

export type TProjectTemplateState = {
  state_key: string;
  name: string;
  color: string;
  group: TProjectTemplateStateGroup;
  sequence?: number;
  default?: boolean;
};

export type TProjectTemplateLabel = {
  label_key: string;
  name: string;
  color: string;
  order?: number;
};

export type TProjectTemplateModule = {
  module_key: string;
  name: string;
  status: TProjectTemplateModuleStatus;
};

export type TProjectTemplateCycle = {
  cycle_key: string;
  name: string;
  start_offset_days?: number | null;
  target_offset_days?: number | null;
  duration_days?: number | null;
};

export type TProjectTemplateStarterIssue = {
  name: string;
  description_html?: string | null;
  description_json?: Record<string, unknown> | null;
  state_key?: string | null;
  label_keys?: string[];
  module_key?: string | null;
  cycle_key?: string | null;
  priority?: TProjectTemplateIssuePriority | null;
  start_offset_days?: number | null;
  target_offset_days?: number | null;
  duration_days?: number | null;
};

export type TProjectTemplateIntake = {
  intake_key: string;
  name: string;
  description?: string;
  is_default?: boolean;
  view_props?: Record<string, unknown>;
  logo_props?: Record<string, unknown>;
};

export type TProjectTemplateView = {
  view_key: string;
  name: string;
  description?: string;
  filters?: {
    label_keys?: string[];
    state_keys?: string[];
    state_group?: string[];
    priority?: string[];
    [key: string]: unknown;
  };
  display_filters?: Record<string, unknown>;
  display_properties?: Record<string, unknown>;
  access?: 0 | 1;
  logo_props?: Record<string, unknown>;
};

export type TProjectTemplatePage = {
  page_key: string;
  name: string;
  description_html?: string | null;
  description_json?: Record<string, unknown> | null;
  color?: string;
  label_keys?: string[];
  access?: 0 | 1;
  view_props?: Record<string, unknown>;
  logo_props?: Record<string, unknown>;
};

export type TProjectTemplatePayload = {
  schema_version: number;
  states: TProjectTemplateState[];
  labels: TProjectTemplateLabel[];
  modules: TProjectTemplateModule[];
  cycles: TProjectTemplateCycle[];
  starter_issues: TProjectTemplateStarterIssue[];
  intakes?: TProjectTemplateIntake[];
  views?: TProjectTemplateView[];
  pages?: TProjectTemplatePage[];
};

/**
 * Minimal write subset accepted by `ProjectTemplateWriteSerializer`.
 *
 * Backend writable fields (verified at `apps/api/plane/app/serializers/project_template.py:613-634`):
 * `name, description, template_type, system_key, is_active, payload, *_offset_days, duration_days`.
 * `id`, `is_system`, `created_at`, `updated_at`, `workspace` are read-only.
 *
 * `template_type` is locked to `"custom"` in the editor — system templates are seeded by the
 * backend and cannot be created through this payload.
 */
export type TProjectTemplateWritePayload = {
  name: string;
  description?: string | null;
  template_type: "custom";
  payload: TProjectTemplatePayload;
  start_offset_days?: number | null;
  target_offset_days?: number | null;
  duration_days?: number | null;
  is_active?: boolean;
};

export type TProjectTemplate = {
  id: string;
  name: string;
  description: string;
  template_type: TProjectTemplateType;
  system_key: string | null;
  is_system: boolean;
  is_active: boolean;
  payload: TProjectTemplatePayload;
  workspace: string | null;
  start_offset_days: number | null;
  target_offset_days: number | null;
  duration_days: number | null;
  created_at: string;
  updated_at: string;
};
