/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TPomodoroNotifyPhase = "focus" | "break";

export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission | "unsupported"> => {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
};

export const showBrowserPomodoroNotification = (title: string, body: string): void => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    // Keep a reference so lint does not treat this as a side-effect-only `new`.
    const notification = new Notification(title, { body, tag: "plane-pomodoro" });
    void notification;
  } catch {
    // ignore environments that disallow Notification constructors
  }
};
