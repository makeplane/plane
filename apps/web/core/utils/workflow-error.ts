/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { IWorkflowErrorPayload, IWorkflowValidationIssue } from "@plane/types";

/**
 * §23.5 — extract a message a user can act on from whatever the API threw.
 *
 * The workflow admin surface returns the §17.3 envelope
 * (`{ code, detail, ... }`) on the transition paths, but the rest of the
 * fork's API is inconsistent:
 *
 * - `WorkflowError.to_payload()` on `POST /transitions/` → flat `{ code, detail }`.
 * - `IssueUpdateSerializer` wraps the same payload in a DRF
 *   `ValidationError`, so a PATCH that is rejected by the workflow arrives
 *   as `{ non_field_errors: [{ code, detail, ... }] }`.
 * - Plain `{"error": "..."}` for 404s and 400s from non-workflow views.
 * - DRF field errors as `{ "field": ["message"] }`.
 * - A bare 500 with a non-JSON body when a view raises `WorkflowError`
 *   un-translated.
 *
 * The first entry the backend provides wins, and it is returned verbatim —
 * §23.5 requires the backend's blocker string be shown, not paraphrased.
 */
export const getWorkflowErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string") return isDisplayable(error) ? error : fallback;
  if (!error || typeof error !== "object") return fallback;

  const payload = error as Record<string, unknown>;

  // §17.3 flat envelope, e.g. from `POST /transitions/`.
  const directDetail = asString(payload.detail);
  if (directDetail) return directDetail;

  // DRF `ValidationError` wrapping: `{"non_field_errors": [ {code, detail} ]}`.
  const wrapped = firstDetailIn(payload.non_field_errors);
  if (wrapped) return wrapped;

  // `{"error": "..."}` and `{"detail": "..."}` shapes.
  const directError = asString(payload.error);
  if (directError) return directError;

  // DRF field errors: `{"field": ["message"]}` — take the first message.
  for (const [key, value] of Object.entries(payload)) {
    if (key === "request" || key === "config" || key === "response") continue;
    const fieldMessage = firstDetailIn(value);
    if (fieldMessage) return fieldMessage;
  }

  return fallback;
};

/** True when the thrown value carries a §17.3 `WORKFLOW_*` code. */
export const isWorkflowErrorPayload = (error: unknown): error is IWorkflowErrorPayload => {
  if (!error || typeof error !== "object") return false;
  const code = (error as Record<string, unknown>).code;
  return typeof code === "string" && code.startsWith("WORKFLOW_");
};

/** The §17.3 code, following the DRF `non_field_errors` wrapper if present. */
export const getWorkflowErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const payload = error as Record<string, unknown>;

  const direct = payload.code;
  if (typeof direct === "string") return direct;

  const wrapped = Array.isArray(payload.non_field_errors) ? (payload.non_field_errors[0] as any) : undefined;
  const wrappedCode = wrapped?.code;
  return typeof wrappedCode === "string" ? wrappedCode : undefined;
};

/**
 * The `issues[]` list from a §24 publish failure, when the server managed to
 * deliver it. It currently does not — the publish view raises
 * `WorkflowRevisionPublishInvalid` un-translated, so the failure arrives as a
 * 500 — hence the defensive `Array.isArray`.
 */
export const getWorkflowValidationIssues = (error: unknown): IWorkflowValidationIssue[] => {
  if (!error || typeof error !== "object") return [];
  const payload = error as Record<string, unknown>;
  const direct = payload.issues;
  if (Array.isArray(direct)) return direct as IWorkflowValidationIssue[];

  const wrapped = Array.isArray(payload.non_field_errors) ? (payload.non_field_errors[0] as any) : undefined;
  return Array.isArray(wrapped?.issues) ? (wrapped.issues as IWorkflowValidationIssue[]) : [];
};

// ---------------------------------------------------------------------------

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && isDisplayable(value) ? value : undefined;

/**
 * A view can only show a real message. A non-JSON 5xx body — which is what a
 * view raising an un-translated `WorkflowError` produces — arrives as Django's
 * HTML error page, and rendering that in a toast is worse than the fallback.
 */
const isDisplayable = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return !trimmed.startsWith("<");
};

const firstDetailIn = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstDetailIn(entry);
      if (found) return found;
    }
    return undefined;
  }
  if (value && typeof value === "object") {
    return asString((value as Record<string, unknown>).detail) ?? asString((value as Record<string, unknown>).error);
  }
  return asString(value);
};
