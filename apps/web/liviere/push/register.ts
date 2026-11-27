/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the push subscription of this browser. The service worker (public/liviere/push-sw.js)
// is registered with the scope /liviere/push/, so it controls no page.

export const PUSH_WORKER_URL = "/liviere/push-sw.js";
export const PUSH_WORKER_SCOPE = "/liviere/push/";

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  window.isSecureContext &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

const applicationServerKey = (publicKey: string) => {
  const padded = `${publicKey}${"=".repeat((4 - (publicKey.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

export const currentSubscription = async (): Promise<PushSubscription | null> => {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(PUSH_WORKER_SCOPE);
  return (await registration?.pushManager.getSubscription()) ?? null;
};

// navigator.serviceWorker.ready never resolves here (the worker controls no page): wait for this registration
const activeWorker = (registration: ServiceWorkerRegistration) =>
  new Promise<void>((resolve) => {
    const worker = registration.installing ?? registration.waiting;
    if (registration.active || !worker) return resolve();
    // "redundant": the installation failed; subscribe() then rejects and the caller shows an error
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated" || worker.state === "redundant") resolve();
    });
  });

/** Asks for the permission (call only from a click) and subscribes this browser. */
export const subscribeBrowser = async (publicKey: string): Promise<PushSubscription | null> => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  const registration = await navigator.serviceWorker.register(PUSH_WORKER_URL, { scope: PUSH_WORKER_SCOPE });
  await activeWorker(registration);
  const key = applicationServerKey(publicKey);
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    // A subscription made with another server key (the VAPID keys changed) cannot receive our pushes
    if (sameKey(existing.options.applicationServerKey, key)) return existing;
    await existing.unsubscribe();
  }
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
};

const sameKey = (current: ArrayBuffer | null, expected: Uint8Array) => {
  if (!current) return false;
  const bytes = new Uint8Array(current);
  return bytes.length === expected.length && bytes.every((byte, index) => byte === expected[index]);
};

// The account that turned push on in this browser. After signing out the server forgets the subscription;
// it is registered again only for the same account, never silently for somebody else signing in here.
const OWNER_KEY = "liviere.push.user";

export const rememberPushOwner = (userId: string | null) => {
  try {
    if (userId) window.localStorage.setItem(OWNER_KEY, userId);
    else window.localStorage.removeItem(OWNER_KEY);
  } catch {
    // Storage blocked: the person turns push on again in the profile
  }
};

export const pushOwner = () => {
  try {
    return window.localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
};

/** The existing subscription of this browser, if it belongs to `userId` and push is still allowed. */
export const ownSubscription = async (userId: string | undefined) => {
  if (!userId || !isPushSupported() || Notification.permission !== "granted" || pushOwner() !== userId) return null;
  return currentSubscription();
};
