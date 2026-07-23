/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
/* oxlint-disable react/iframe-missing-sandbox -- Messenger is a trusted same-origin app and requires the user's authenticated API session. */

import { useCallback, useEffect, useRef } from "react";

const THEME_TOKEN_MAP = {
  "--bg-page": "--background-color-canvas",
  "--bg-shell": "--background-color-layer-2",
  "--bg-sidebar": "--background-color-layer-1",
  "--bg-panel": "--background-color-layer-2",
  "--bg-chat": "--background-color-canvas",
  "--bg-input": "--background-color-layer-1",
  "--bg-soft": "--background-color-layer-1",
  "--bg-hover": "--background-color-layer-1-hover",
  "--bg-active": "--background-color-accent-primary",
  "--text-main": "--text-color-primary",
  "--text-muted": "--text-color-secondary",
  "--text-soft": "--text-color-tertiary",
  "--border": "--border-color-subtle",
  "--border-strong": "--border-color-strong",
  "--accent": "--background-color-accent-primary",
  "--accent-2": "--text-color-accent-secondary",
  "--danger": "--text-color-danger-primary",
  "--warning": "--text-color-warning-primary",
  "--ok": "--text-color-success-primary",
  "--bubble-in": "--background-color-layer-2",
} as const;

const getGizmoThemePayload = () => {
  const root = document.documentElement;
  const styles = window.getComputedStyle(root);
  const tokens = Object.fromEntries(
    Object.entries(THEME_TOKEN_MAP).flatMap(([messengerToken, gizmoToken]) => {
      const value = styles.getPropertyValue(gizmoToken).trim();
      return value ? [[messengerToken, value]] : [];
    })
  );

  return {
    source: "gizmo-shell",
    type: "theme",
    theme: root.getAttribute("data-theme") || "light",
    tokens,
  };
};

export function MessengerFrame() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const syncTheme = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(getGizmoThemePayload(), window.location.origin);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", syncTheme);
    window.addEventListener("focus", syncTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", syncTheme);
      window.removeEventListener("focus", syncTheme);
    };
  }, [syncTheme]);

  return (
    <iframe
      ref={iframeRef}
      src="/messenger/"
      className="h-full w-full border-0 bg-canvas"
      title="Gizmo Messenger"
      onLoad={syncTheme}
      allow="clipboard-read; clipboard-write; microphone"
    />
  );
}
