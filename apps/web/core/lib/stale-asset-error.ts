/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Error signatures produced when a deploy removes hashed assets that an open tab
// still references (stale-tab version skew).
const STALE_ASSET_ERROR_SIGNATURES = [
  "Failed to fetch dynamically imported module", // Chromium
  "error loading dynamically imported module", // Firefox
  "Importing a module script failed", // Safari
  "Unable to preload CSS", // Vite preload helper
  // React Router's own wrapper when a route module's lazy import fails during
  // navigation — the original browser error above never reaches here as a
  // window event, only this synthesized message.
  "No result returned from dataStrategy for route",
];

export const isStaleAssetErrorMessage = (message: string): boolean =>
  STALE_ASSET_ERROR_SIGNATURES.some((signature) => message.includes(signature));

export const isStaleAssetError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return isStaleAssetErrorMessage(message);
};

// Reload-once-then-fall-through-to-boundary guard, shared by the window-level
// listeners (entry.client.tsx) and the route ErrorBoundary (root.tsx) so both
// paths to the same failure share one reload attempt instead of racing.
const STALE_ASSET_RELOAD_KEY = "__plane_chunk_reload";
const STALE_ASSET_RELOAD_WINDOW_MS = 30_000;

const hasRecentStaleAssetReload = (): boolean => {
  try {
    const lastReloadAt = Number(sessionStorage.getItem(STALE_ASSET_RELOAD_KEY));
    return Number.isFinite(lastReloadAt) && Date.now() - lastReloadAt < STALE_ASSET_RELOAD_WINDOW_MS;
  } catch {
    // No storage means no loop guard — never auto-reload in that case.
    return true;
  }
};

let isRecoveringFromStaleAsset = false;

export const recoverFromStaleAsset = () => {
  if (isRecoveringFromStaleAsset) return;
  isRecoveringFromStaleAsset = true;

  if (hasRecentStaleAssetReload()) {
    // Second failure in a row — surface to the route error boundary instead of looping.
    isRecoveringFromStaleAsset = false;
    return;
  }
  try {
    sessionStorage.setItem(STALE_ASSET_RELOAD_KEY, String(Date.now()));
  } catch {
    isRecoveringFromStaleAsset = false;
    return;
  }
  window.location.reload();
};
