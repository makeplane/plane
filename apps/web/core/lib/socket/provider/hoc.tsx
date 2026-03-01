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

import type { ReactNode } from "react";
import { observer } from "mobx-react";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// local imports
import { SocketProvider } from "./root";

type TWithSocketProviderHOCProps = {
  workspaceSlug: string;
  children: ReactNode;
};

export const WithSocketProviderHOC = observer(function WithSocketProviderHOC(props: TWithSocketProviderHOCProps) {
  const { workspaceSlug, children } = props;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // feature flag check
  const isWorkspaceSocketEnabled = useFlag(workspaceSlug, "WORKSPACE_SOCKET", false);
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const currentWorkspaceId = currentWorkspace?.id;

  // If workspace doesn't exist, return children without socket provider
  if (!currentWorkspaceId) return children;

  return (
    <SocketProvider
      options={{
        url: process.env.VITE_FLUX_BASE_URL || "",
        path: `${process.env.VITE_FLUX_BASE_PATH || ""}/socket.io`,
      }}
      workspaceId={currentWorkspaceId}
      enabled={isWorkspaceSocketEnabled}
    >
      {children}
    </SocketProvider>
  );
});
