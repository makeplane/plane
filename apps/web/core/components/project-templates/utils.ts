/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type {
  TProjectTemplateCycle,
  TProjectTemplateLabel,
  TProjectTemplateModule,
  TProjectTemplatePayload,
  TProjectTemplateStarterIssue,
  TProjectTemplateState,
} from "@plane/types";

/**
 * The single backend-versioned payload schema constant.
 * Required by `validate_project_template_payload`; omitting it returns 400.
 */
export const PROJECT_TEMPLATE_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Reference-key generation (D-12, RESEARCH Pitfall 2)
// ---------------------------------------------------------------------------

/**
 * Slugify a human name into a backend-safe reference key segment.
 *
 * The rule is loose on purpose: emit something deterministic and ASCII-safe so
 * backend `validate_*` references are stable across name edits. We never
 * recompute this at submit time — keys are generated ONCE at add-time and
 * preserved through renames so starter-issue references don't dangle
 * (RESEARCH Pitfall 2).
 */
export function slugifyKey(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "item"
  );
}

/**
 * Append a numeric suffix until the key is unique within the taken set. Used
 * at add-time; the result is the item's stable `_key` going forward.
 */
export function uniqueKey(base: string, taken: Set<string>): string {
  let candidate = base;
  let i = 2;
  while (taken.has(candidate)) {
    candidate = `${base}_${i++}`;
  }
  return candidate;
}

// ---------------------------------------------------------------------------
// Form shape (RHF + useFieldArray)
// ---------------------------------------------------------------------------

/**
 * RHF-friendly superset of `TProjectTemplatePayload` items.
 *
 * Each nested item carries a *pre-existing* stable key (`_key`) — generated
 * once at add-time via `slugifyKey` + `uniqueKey` — alongside the user-edited
 * fields. `assemblePayload` strips `_key` and emits backend-shaped rows.
 *
 * Plan 04 (Modules/Cycles/Starter issues) will extend the same shape with
 * additional per-section fields. The `name` field is intentionally the only
 * required input on every row to keep the editor's add/edit/remove rows simple.
 */
export type TProjectTemplateFormState = {
  state_key: string;
  name: string;
  color: string;
  group: TProjectTemplateState["group"];
  default?: boolean;
  description?: string;
};

export type TProjectTemplateFormLabel = {
  label_key: string;
  name: string;
  color: string;
};

export type TProjectTemplateFormPayload = {
  states: TProjectTemplateFormState[];
  labels: TProjectTemplateFormLabel[];
  modules: TProjectTemplateFormModule[];
  cycles: TProjectTemplateFormCycle[];
  starter_issues: TProjectTemplateFormStarterIssue[];
};

// Plan 04 / 05 will add concrete shapes for modules/cycles/starter-issues; the
// editor's defaults already include empty arrays for them so the form shape is
// stable across plans.
export type TProjectTemplateFormModule = {
  module_key: string;
  name: string;
  status: TProjectTemplateModule["status"];
};

export type TProjectTemplateFormCycle = {
  cycle_key: string;
  name: string;
  start_offset_days?: number | null;
  target_offset_days?: number | null;
  duration_days?: number | null;
};

export type TProjectTemplateFormStarterIssue = {
  name: string;
  /**
   * RHF field-array id of the referenced state row. The `state_key` is
   * resolved from the in-editor states array by id in `assemblePayload`
   * (D-13 / RESEARCH Pitfall 2) — never recomputed from a name.
   */
  state_ref_id?: string | null;
  /**
   * RHF field-array ids of the referenced label rows. `label_keys` is
   * resolved from the in-editor labels array by id in `assemblePayload`.
   */
  label_ref_ids?: string[];
  /**
   * RHF field-array id of the referenced module row. `module_key` is resolved
   * from the in-editor modules array by id in `assemblePayload`.
   */
  module_ref_id?: string | null;
  /**
   * RHF field-array id of the referenced cycle row. `cycle_key` is resolved
   * from the in-editor cycles array by id in `assemblePayload`.
   */
  cycle_ref_id?: string | null;
  priority?: TProjectTemplateStarterIssue["priority"];
};

export type TProjectTemplateForm = {
  name: string;
  description?: string | null;
  payload: TProjectTemplateFormPayload;
};

/**
 * Blank payload used by both the create editor's `defaultValues` and the
 * reset-state on the edit page when the user clears a row.
 *
 * NOTE: `modules` / `cycles` / `starter_issues` are intentionally empty
 * arrays here so Plan 04 / 05 wire only their UI — the type shape is fixed.
 */
export function emptyTemplatePayload(): TProjectTemplateFormPayload {
  return {
    states: [],
    labels: [],
    modules: [],
    cycles: [],
    starter_issues: [],
  };
}

// ---------------------------------------------------------------------------
// Payload assembly (RESEARCH Pitfall 6 — schema_version)
// ---------------------------------------------------------------------------

/**
 * Convert RHF form values into the backend's `TProjectTemplatePayload`.
 *
 * - Always sets `schema_version: PROJECT_TEMPLATE_SCHEMA_VERSION` (Pitfall 6).
 * - Reads `_key` off each form item and emits it as `state_key` / `label_key` /
 *   `module_key` / `cycle_key` — never recomputed from the current name
 *   (Pitfall 2 / D-12).
 * - Trims `name` to drop accidental whitespace; coerces null/undefined
 *   `description` to `null`.
 */
/**
 * Source-row field-array metadata. RHF field-array `id` is the stable
 * reference token (not the name) — renames preserve it, so cross-section
 * references never dangle (D-13 / RESEARCH Pitfall 2).
 *
 * For each section we keep a parallel `id -> key` map so `assemblePayload`
 * can resolve a starter-issue's ref id to the current stable key.
 */
export type TAssemblePayloadContext = {
  stateKeyById?: Record<string, string>;
  labelKeyById?: Record<string, string>;
  moduleKeyById?: Record<string, string>;
  cycleKeyById?: Record<string, string>;
};

export function assemblePayload(
  form: TProjectTemplateForm,
  context: TAssemblePayloadContext = {}
): TProjectTemplatePayload {
  const states: TProjectTemplateState[] = form.payload.states.map((s) => ({
    state_key: s.state_key,
    name: (s.name ?? "").trim(),
    color: s.color,
    group: s.group,
    default: s.default === true,
  }));

  const labels: TProjectTemplateLabel[] = form.payload.labels.map((l) => ({
    label_key: l.label_key,
    name: (l.name ?? "").trim(),
    color: l.color,
  }));

  const modules: TProjectTemplateModule[] = form.payload.modules.map((m) => ({
    module_key: m.module_key,
    name: (m.name ?? "").trim(),
    status: m.status,
  }));

  const cycles: TProjectTemplateCycle[] = form.payload.cycles.map((c) => ({
    cycle_key: c.cycle_key,
    name: (c.name ?? "").trim(),
    start_offset_days: c.start_offset_days ?? null,
    target_offset_days: c.target_offset_days ?? null,
    duration_days: c.duration_days ?? null,
  }));

  // Resolve each starter-issue ref id to its current stable key. If the
  // source row was removed (id no longer in the lookup) the reference is
  // dropped here so the payload never emits a dangling *_key (Pitfall 2 /
  // T-04-12). If the context map for a section is missing, all references
  // for that section are dropped (defensive — caller should always pass).
  const stateKeyById = context.stateKeyById ?? {};
  const labelKeyById = context.labelKeyById ?? {};
  const moduleKeyById = context.moduleKeyById ?? {};
  const cycleKeyById = context.cycleKeyById ?? {};

  const starter_issues = form.payload.starter_issues.map((i) => {
    const state_key = i.state_ref_id ? (stateKeyById[i.state_ref_id] ?? null) : null;
    const label_keys = (i.label_ref_ids ?? []).map((id) => labelKeyById[id]).filter((k): k is string => Boolean(k));
    const module_key = i.module_ref_id ? (moduleKeyById[i.module_ref_id] ?? null) : null;
    const cycle_key = i.cycle_ref_id ? (cycleKeyById[i.cycle_ref_id] ?? null) : null;
    return {
      name: (i.name ?? "").trim(),
      state_key,
      label_keys,
      module_key,
      cycle_key,
      priority: i.priority ?? null,
    };
  });

  return {
    schema_version: PROJECT_TEMPLATE_SCHEMA_VERSION,
    states,
    labels,
    modules,
    cycles,
    starter_issues,
  };
}

// ---------------------------------------------------------------------------
// Error mapping (RESEARCH Pitfall 7 — backend raises list-of-dicts ValidationError)
// ---------------------------------------------------------------------------

/**
 * Section-keyed subset of the backend error array we surface inline.
 *
 * `general` is a fallback bucket for top-level errors and any non-section
 * message — `editor/root.tsx` renders it as the generic fallback toast.
 *
 * Note: keys here are static because the backend's `validate_project_template_payload`
 * uses the same section names that appear in the payload shape
 * (`states` / `labels` / `modules` / `cycles` / `starter_issues`).
 */
export type TProjectTemplateFormErrors = {
  general?: string;
  states?: string;
  labels?: string;
  modules?: string;
  cycles?: string;
  starter_issues?: string;
  name?: string;
};

/**
 * Backend `validate_project_template_payload` raises
 * `ValidationError([{section: "..."}])` — a list of single-key dicts
 * (RESEARCH Pitfall 7 / `serializers/project_template.py:574-576`).
 *
 * `projectService.*` rethrows `error?.response?.data` (see
 * `project.service.ts:36-42`), so the frontend receives that array directly.
 *
 * We iterate the array, route single-key-dict entries into a section-keyed map
 * (`{states, labels, ...}`), and return `{perSection, generalFallback}` so the
 * editor can render inline messages per section AND show a generic toast for
 * anything unrecognized.
 */
export function mapProjectTemplateErrors(error: unknown): {
  perSection: TProjectTemplateFormErrors;
  generalFallback: string | null;
} {
  const perSection: TProjectTemplateFormErrors = {};
  let generalFallback: string | null = null;
  if (!Array.isArray(error)) {
    return {
      perSection,
      generalFallback: typeof error === "string" ? error : "Couldn't save the template. Please try again.",
    };
  }

  for (const entry of error) {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const dictEntries = Object.entries(entry as Record<string, unknown>);
      if (dictEntries.length === 1) {
        const [key, value] = dictEntries[0];
        const message = typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : String(value);
        if (key === "name") {
          perSection.name = message;
        } else if (key in perSection && key !== "general") {
          // section key
          (perSection as Record<string, string>)[key] = message;
        } else {
          generalFallback = generalFallback ?? message;
        }
        continue;
      }
    }
    // non-dict entry — surface as fallback
    if (typeof entry === "string") {
      generalFallback = generalFallback ?? entry;
    }
  }

  if (!generalFallback && Object.keys(perSection).length === 0) {
    generalFallback = "Couldn't save the template. Please try again.";
  }
  return { perSection, generalFallback };
}
