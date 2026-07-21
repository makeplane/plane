/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// Live timer display — always shows seconds and rolls up to hours past 60 minutes (e.g. "1h 23m 45s").
export function formatElapsed(startedAt: string): string {
  const total = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

const pad = (n: number): string => String(n).padStart(2, "0");

// Convert an ISO/UTC datetime to the local "YYYY-MM-DDTHH:mm" string an <input type="datetime-local"> expects.
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Convert a local "YYYY-MM-DDTHH:mm" value (from a datetime-local input) back to an ISO string.
export function localInputToISO(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// A completed worklog stores started_at + duration; the end is derived.
export function computeEndISO(startedAt: string | null, durationSeconds: number | null): string | null {
  if (!startedAt || !durationSeconds) return null;
  return new Date(new Date(startedAt).getTime() + durationSeconds * 1000).toISOString();
}
