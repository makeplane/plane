/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// Check for SW updates every 5 minutes so long-lived sessions
// (users navigating via React Router links) detect new deploys
// without waiting for the browser's default 24-hour check.
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000;

export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [controllerChanged, setControllerChanged] = useState(false);
  const isUpdateAvailable = waitingWorker !== null || controllerChanged;

  const pendingReloadRef = useRef(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installingWorker: ServiceWorker | undefined;
    let updateInterval: ReturnType<typeof setInterval> | undefined;
    let hasBeenControlled = !!navigator.serviceWorker.controller;

    const onControllerChange = () => {
      if (!hasBeenControlled) {
        hasBeenControlled = true;
        return;
      }
      if (pendingReloadRef.current) {
        window.location.reload();
      } else if (!cancelled) {
        setControllerChanged(true);
      }
    };

    const onStateChange = (event: Event) => {
      if (cancelled) return;
      const sw = event.target as ServiceWorker;
      if (sw.state === "installed" && navigator.serviceWorker.controller) {
        setWaitingWorker(sw);
      }
    };

    const trackInstalling = (reg: ServiceWorkerRegistration) => {
      const sw = reg.installing;
      if (!sw) return;
      installingWorker?.removeEventListener("statechange", onStateChange);
      installingWorker = sw;
      sw.addEventListener("statechange", onStateChange);
    };

    const onUpdateFound = () => {
      if (registration) trackInstalling(registration);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (cancelled) return;
        registration = reg;

        reg.addEventListener("updatefound", onUpdateFound);

        // Skip showing the banner for a waiting worker found on initial page load.
        // The stale-chunk recovery in entry.client.tsx will auto-reload the page
        // before the user can interact with the banner, causing a confusing flash.
        // The banner will appear when updatefound fires during an active session.

        if (reg.installing) {
          trackInstalling(reg);
        }

        // Poll for updates so long-lived SPA sessions detect new deploys.
        // Client-side navigation via React Router doesn't trigger the browser's
        // built-in SW update check, so without this users could stay on a stale
        // version indefinitely.
        updateInterval = setInterval(() => {
          // oxlint-disable-next-line eslint-plugin-promise(no-nesting) -- standalone fire-and-forget inside setInterval, not a nested chain
          reg.update().catch(() => {});
        }, UPDATE_CHECK_INTERVAL);

        return undefined;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (updateInterval) clearInterval(updateInterval);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      registration?.removeEventListener("updatefound", onUpdateFound);
      installingWorker?.removeEventListener("statechange", onStateChange);
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (controllerChanged) {
      window.location.reload();
      return;
    }
    if (!waitingWorker) return;
    pendingReloadRef.current = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker, controllerChanged]);

  return { isUpdateAvailable, updateServiceWorker };
}
