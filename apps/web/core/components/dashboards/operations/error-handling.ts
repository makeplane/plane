/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Error mapping for the Team Operations Dashboard endpoints.
 *
 * The shell's catch handlers must NEVER silently convert a real
 * failure (network, 500, auth) into a typed "unavailable / metric
 * pending" placeholder. ``unavailable`` is reserved for the
 * backend's own `status: "unavailable"` section return (a
 * server-side gate, e.g. ``no_update`` coverage audit). Real
 * failures must surface with a retry CTA so QA can see what broke
 * instead of a generic "feature pending" placeholder.
 */

import type { TSectionStatus } from "@plane/types";

export type TDashboardTabError =
  | { kind: "forbidden"; message: string }
  | { kind: "unauthorized"; message: string }
  | { kind: "not_found"; message: string }
  | { kind: "server_error"; status: number; message: string }
  | { kind: "network_error"; message: string }
  | { kind: "aborted"; message: string }
  | { kind: "malformed"; message: string };

/**
 * Inspect an axios / fetch failure and classify it.
 *
 * The shape comes from the API service layer (axios-style):
 *   { response?: { status, data }, code?, message? }
 */
export function classifyDashboardError(err: unknown): TDashboardTabError {
  if (!err) {
    return { kind: "malformed", message: "Unknown error" };
  }
  if (typeof err === "string") {
    return { kind: "malformed", message: err };
  }
  // axios-style error
  if (typeof err === "object") {
    const e = err as {
      name?: string;
      code?: string;
      message?: string;
      response?: { status?: number; data?: unknown };
    };
    if (e.name === "AbortError" || e.code === "ERR_CANCELED" || e.code === "ABORTED") {
      return { kind: "aborted", message: "Request aborted" };
    }
    if (e.code === "ERR_NETWORK" || e.message?.toLowerCase().includes("network")) {
      return { kind: "network_error", message: e.message ?? "Network failure" };
    }
    const status = e.response?.status;
    if (status === 401) {
      return { kind: "unauthorized", message: "Session expired" };
    }
    if (status === 403) {
      return { kind: "forbidden", message: "You don't have access to this view" };
    }
    if (status === 404) {
      return { kind: "not_found", message: "Resource not found" };
    }
    if (status !== undefined && status >= 500) {
      return {
        kind: "server_error",
        status,
        message: typeof e.response?.data === "string" ? e.response.data : `Server error (${status})`,
      };
    }
    // DRF error envelope: { error, code }
    if (e.response?.data && typeof e.response.data === "object") {
      const data = e.response.data as { error?: string; code?: string };
      if (data.error) {
        return { kind: "malformed", message: data.error };
      }
    }
    return { kind: "malformed", message: e.message ?? "Request failed" };
  }
  return { kind: "malformed", message: "Request failed" };
}

/**
 * Inspect a section status from the envelope and surface a
 * typed state for the renderer.
 *
 * - `status: "ok"` → render the data.
 * - `status: "unavailable"` → server explicitly gated the
 *   metric / feature. Render the typed unavailable state with the
 *   server-supplied reason (not "feature pending").
 * - `status: "error"` → server caught an exception building the
 *   section. Render an error state with retry, never a placeholder.
 * - missing section → render an error state, never a placeholder.
 */
export function classifySection<TData>(
  section: { section_id: string; status: TSectionStatus; data?: TData; reason?: string } | undefined
):
  | { kind: "ok"; data: TData }
  | { kind: "unavailable"; reason: string | undefined }
  | { kind: "section_error"; reason: string | undefined } {
  if (!section) {
    return { kind: "section_error", reason: "section_missing" };
  }
  if (section.status === "ok" && section.data !== undefined) {
    return { kind: "ok", data: section.data };
  }
  if (section.status === "unavailable") {
    return { kind: "unavailable", reason: section.reason };
  }
  return { kind: "section_error", reason: section.reason ?? "section_error" };
}
