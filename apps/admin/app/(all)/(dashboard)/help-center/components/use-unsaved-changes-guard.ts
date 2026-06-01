/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { useBlocker } from "react-router";

// Guards against losing unsaved editor work. While `enabled`:
//   - blocks in-app route changes (browser Back / sidebar links) so the caller
//     can confirm before leaving — exposed via the returned Blocker;
//   - warns on full-page unloads (refresh / tab close / external nav) with the
//     browser's native confirm.
// When `enabled` flips to false (e.g. after a save) any pending block proceeds.
export function useUnsavedChangesGuard(enabled: boolean): ReturnType<typeof useBlocker> {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => enabled && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!enabled) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);

  // If the work becomes clean while a navigation is held, let it through.
  useEffect(() => {
    if (!enabled && blocker.state === "blocked") blocker.proceed();
  }, [enabled, blocker]);

  return blocker;
}
