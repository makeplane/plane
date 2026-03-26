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

import { useEffect, useRef } from "react";
import { ACTIVITY_HIGHLIGHT_TIMEOUT } from "@plane/constants";
import { useWorkspaceNotifications } from "@/hooks/store/notifications/use-workspace-notifications";

/**
 * Hook that manages activity highlight state: scroll-into-view on notification,
 * highlight border animation, and auto-clear after timeout.
 */
export function useActivityHighlight(id: string) {
  const { higlightedActivityIds, setHighlightedActivityIds } = useWorkspaceNotifications();
  const highlightRef = useRef<HTMLDivElement>(null);
  const isHighlighted = higlightedActivityIds.includes(id);

  useEffect(() => {
    if (higlightedActivityIds.length > 0 && higlightedActivityIds[0] === id) {
      highlightRef.current?.scrollIntoView({ behavior: "smooth" });
      const timer = setTimeout(() => {
        setHighlightedActivityIds([]);
      }, ACTIVITY_HIGHLIGHT_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [higlightedActivityIds, id, setHighlightedActivityIds]);

  return { highlightRef, isHighlighted };
}
