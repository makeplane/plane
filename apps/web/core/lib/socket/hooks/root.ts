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

import { useEffect, useLayoutEffect, useRef, useContext } from "react";
// local imports
import { SocketContext } from "@/lib/socket/provider/root";
import type { TSocketContext, TEntityEvent } from "@/lib/socket/types/root";

// Internal hook to access socket context
function useSocketInternal(): TSocketContext {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
}

/**
 * Subscribe to events for a specific entity with automatic room management.
 * Joins the server-side room on mount so only events for this entity are delivered.
 *
 * @example
 * useEntityEvent("workitem", workItemId, (data) => {
 *   console.log(data.event_type);
 *   mutate(`/api/issues/${data.entity_id}`);
 * });
 */
export function useEntityEvent(
  entityType: string,
  entityId: string | undefined,
  handler: (data: TEntityEvent) => void,
  options: { enabled?: boolean } = {}
): void {
  const { enabled = true } = options;
  const { subscribeEntity, status } = useSocketInternal();

  const handlerRef = useRef(handler);

  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled || !entityId || status !== "connected") return;

    const unsubscribe = subscribeEntity(entityType, entityId, (data) => {
      handlerRef.current(data);
    });

    return unsubscribe;
  }, [entityType, entityId, enabled, status, subscribeEntity]);
}
