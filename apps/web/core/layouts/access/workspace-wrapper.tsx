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

// plane imports
import type { WorkspaceResourceKey } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
// hooks
import { useWorkspaceAccess } from "@/hooks/permissions/use-workspace-access";

interface IWorkspaceAuthWrapper {
  children: React.ReactNode;
  pageKey: WorkspaceResourceKey;
  workspaceSlug: string;
}

function WorkspaceAccessWrapper({ children, pageKey, workspaceSlug }: IWorkspaceAuthWrapper) {
  // hooks
  const { canAccessWorkspaceResource } = useWorkspaceAccess();

  if (!canAccessWorkspaceResource(workspaceSlug, pageKey)) return <NotAuthorizedView />;

  return <>{children}</>;
}

export default WorkspaceAccessWrapper;
