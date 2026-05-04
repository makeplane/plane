/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Plane
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TTimelinePropagationErrorCode } from "@plane/types";

/**
 * Shared title for every protocol error and the unexpected fallback (D-04 / D-04c).
 * Single severity, single title, message-only differentiation.
 */
const TITLE_KEY = "timeline.propagation.error.title";

/**
 * Closed-set wire-code -> i18n message-key map (D-04 / D-06).
 * Adding a server-side error code requires updating this map AND
 * packages/types/src/issues/timeline-propagation.ts AND en/ja translations.
 */
export const MESSAGE_KEY_BY_CODE: Record<TTimelinePropagationErrorCode, string> = {
  DEPENDENCY_CYCLE: "timeline.propagation.error.dependency_cycle",
  PROJECT_BOUNDARY_EXCEEDED: "timeline.propagation.error.project_boundary_exceeded",
  INCOMPLETE_SCHEDULE: "timeline.propagation.error.incomplete_schedule",
  PROPAGATION_LIMIT_EXCEEDED: "timeline.propagation.error.propagation_limit_exceeded",
  SCHEDULE_CHANGED: "timeline.propagation.error.schedule_changed",
  PERMISSION_DENIED: "timeline.propagation.error.permission_denied",
  INVALID_DATE_RANGE: "timeline.propagation.error.invalid_date_range",
};

const UNEXPECTED_MESSAGE_KEY = "timeline.propagation.error.unexpected";
const HIDDEN_UPDATE_TITLE_KEY = "timeline.propagation.hidden_update_notification_title";
const HIDDEN_UPDATE_MESSAGE_KEY = "timeline.propagation.hidden_update_notification";

type Translator = (key: string, params?: Record<string, unknown>) => string;

/**
 * Render the propagation error toast (D-04). One ERROR severity for all 7 codes;
 * pass "UNEXPECTED" to render the network/non-protocol fallback (D-04c).
 */
export function showPropagationErrorToast(code: TTimelinePropagationErrorCode | "UNEXPECTED", t: Translator): void {
  const messageKey = code === "UNEXPECTED" ? UNEXPECTED_MESSAGE_KEY : MESSAGE_KEY_BY_CODE[code];
  setToast({
    type: TOAST_TYPE.ERROR,
    title: t(TITLE_KEY),
    message: t(messageKey),
  });
}

/**
 * Render the hidden-update INFO toast (D-05). Fired only when
 * timelinePropagationStore.hiddenUpdateCount > 0 after a successful commit (D-05b).
 * IntlMessageFormat plural template handles the count interpolation (D-05).
 */
export function showHiddenUpdateToast(count: number, t: Translator): void {
  if (count <= 0) return; // defense-in-depth — caller already gates on > 0
  setToast({
    type: TOAST_TYPE.INFO,
    title: t(HIDDEN_UPDATE_TITLE_KEY),
    message: t(HIDDEN_UPDATE_MESSAGE_KEY, { count }),
  });
}
