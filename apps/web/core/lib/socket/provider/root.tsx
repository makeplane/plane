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

import { createContext, useEffect, useState, useCallback, useMemo, useSyncExternalStore } from "react";
// local imports
import { SocketClient } from "../socket-client";
import type { TSocketContext, TSocketOptions, TEntityEvent } from "../types/root";

// =============================================================================
// Context
// =============================================================================

const SocketContext = createContext<TSocketContext | null>(null);

// Export context for use in hooks.ts
export { SocketContext };

// =============================================================================
// Provider Props
// =============================================================================

type TSocketProviderProps = {
  children: React.ReactNode;
  options: TSocketOptions;
  /**
   * When workspaceSlug changes, the socket will automatically
   * disconnect from the old workspace and connect to the new one.
   */
  workspaceSlug: string;
  /**
   * Whether the socket connection is enabled.
   * If false, no connection will be established.
   * @default true
   */
  enabled?: boolean;
};

// =============================================================================
// Provider Component
// =============================================================================

export function SocketProvider(props: TSocketProviderProps) {
  const { children, options, workspaceSlug, enabled = true } = props;

  // Initialize client once using lazy state initialization
  const [client] = useState(() => new SocketClient(options));

  // Subscribe to status via useSyncExternalStore
  const status = useSyncExternalStore(client.onStatusChange, client.getStatus);

  // Handle workspace changes and cleanup
  useEffect(() => {
    if (enabled) {
      client.connect(workspaceSlug);
    }

    return () => {
      client.disconnect();
    };
  }, [client, workspaceSlug, enabled]);

  const subscribeEntity = useCallback(
    (entityType: string, entityId: string, handler: (data: TEntityEvent) => void) =>
      client.subscribeEntity(entityType, entityId, handler),
    [client]
  );

  // Memoized context value
  const contextValue = useMemo<TSocketContext>(
    () => ({
      status,
      subscribeEntity,
    }),
    [status, subscribeEntity]
  );

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
}
