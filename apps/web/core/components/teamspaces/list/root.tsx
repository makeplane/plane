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

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { TeamspacesList } from "@/components/teamspaces/list/teamspaces-list";

const TeamspaceListItemRoot = observer(function TeamspaceListItemRoot() {
  // router
  const { workspaceSlug } = useParams();
  // plane web hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isEditingAllowed = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* TODO: Add applied filters */}
      <TeamspacesList isEditingAllowed={isEditingAllowed} />
    </div>
  );
});

export default TeamspaceListItemRoot;
