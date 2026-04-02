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

export const useServiceWorker = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  // True when another tab triggered the update and the new SW is already active
  const [controllerChanged, setControllerChanged] = useState(false);
  const isUpdateAvailable = waitingWorker !== null || controllerChanged;

  // Set to true only in the tab that invoked updateServiceWorker()
  const pendingReloadRef = useRef(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installingWorker: ServiceWorker | undefined;
    // Track whether the page has ever been controlled by a service worker.
    // On first-ever visit this starts false and flips to true on the initial
    // controllerchange (without reloading). Subsequent controllerchange events
    // (i.e. SW updates) will then correctly trigger a reload.
    let hasBeenControlled = !!navigator.serviceWorker.controller;

    const onControllerChange = () => {
      if (!hasBeenControlled) {
        hasBeenControlled = true;
        return;
      }
      // Only auto-reload the tab that initiated the update.
      // Other tabs show the banner so the user can choose when to reload.
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

        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(reg.waiting);
        }

        if (reg.installing) {
          trackInstalling(reg);
        }

        return undefined;
      })
      .catch(() => {
        // Service worker registration failed — ignore silently
      });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      registration?.removeEventListener("updatefound", onUpdateFound);
      installingWorker?.removeEventListener("statechange", onStateChange);
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (controllerChanged) {
      // New SW already active (another tab triggered it), just reload
      window.location.reload();
      return;
    }
    if (!waitingWorker) return;
    pendingReloadRef.current = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker, controllerChanged]);

  return { isUpdateAvailable, updateServiceWorker };
};
