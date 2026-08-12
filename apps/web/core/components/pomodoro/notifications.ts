/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TPomodoroNotifyPhase = "focus" | "break";

const POMODORO_SW_URL = "/pomodoro-sw.js";
const POMODORO_NOTIFICATION_ICON = "/icons/icon-192x192.png";

let pomodoroSwRegistration: ServiceWorkerRegistration | null = null;
let pomodoroSwRegisterPromise: Promise<ServiceWorkerRegistration | null> | null = null;

const getNotificationIconUrl = (): string => {
  if (typeof window === "undefined") return POMODORO_NOTIFICATION_ICON;
  try {
    return new URL(POMODORO_NOTIFICATION_ICON, window.location.origin).href;
  } catch {
    return POMODORO_NOTIFICATION_ICON;
  }
};

export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission | "unsupported"> => {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (!window.isSecureContext) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
};

const waitForServiceWorkerActive = async (
  registration: ServiceWorkerRegistration
): Promise<ServiceWorkerRegistration> => {
  if (registration.active) return registration;

  const worker = registration.installing ?? registration.waiting;
  if (!worker) {
    await navigator.serviceWorker.ready;
    return registration;
  }

  await new Promise<void>((resolve) => {
    if (worker.state === "activated") {
      resolve();
      return;
    }
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") resolve();
    });
  });

  return registration;
};

const ensurePomodoroServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (!window.isSecureContext) return null;

  if (pomodoroSwRegistration?.active) return pomodoroSwRegistration;
  if (pomodoroSwRegisterPromise) return pomodoroSwRegisterPromise;

  pomodoroSwRegisterPromise = (async () => {
    try {
      const registration = await navigator.serviceWorker.register(POMODORO_SW_URL, { scope: "/" });
      await waitForServiceWorkerActive(registration);
      pomodoroSwRegistration = registration;
      return registration;
    } catch {
      pomodoroSwRegistration = null;
      return null;
    } finally {
      pomodoroSwRegisterPromise = null;
    }
  })();

  return pomodoroSwRegisterPromise;
};

const showViaServiceWorker = async (title: string, body: string): Promise<boolean> => {
  const registration = await ensurePomodoroServiceWorker();
  if (!registration?.showNotification) return false;

  try {
    await registration.showNotification(title, {
      body,
      tag: "plane-pomodoro",
      icon: getNotificationIconUrl(),
    });
    return true;
  } catch {
    return false;
  }
};

const showViaLegacyConstructor = (title: string, body: string): boolean => {
  try {
    // Keep a reference so lint does not treat this as a side-effect-only `new`.
    const notification = new Notification(title, {
      body,
      tag: "plane-pomodoro",
      icon: getNotificationIconUrl(),
    });
    void notification;
    return true;
  } catch {
    return false;
  }
};

/**
 * Shows a native browser notification. Prefers ServiceWorkerRegistration.showNotification
 * (required by modern Chrome). Returns true only if a native notification was created.
 */
export const showBrowserPomodoroNotification = async (title: string, body: string): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (!window.isSecureContext) return false;

  let permission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return false;
    }
  }
  if (permission !== "granted") return false;

  if (await showViaServiceWorker(title, body)) return true;
  return showViaLegacyConstructor(title, body);
};
