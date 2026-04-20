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
// hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
// plane web components
import { TeamspacesList } from "@/components/teamspaces/list/teamspaces-list";
// types
import type { TTeamspaceListPermissions } from "@/store/teamspace/permissions/root";

type TeamspaceListItemRootProps = {
  workspaceSlug: string;
};

const TeamspaceListItemRoot = observer(function TeamspaceListItemRoot(props: TeamspaceListItemRootProps) {
  const { workspaceSlug } = props;
  // plane web hooks
  const { permissions } = useTeamspaces();
  // derived values
  const listPermissions: TTeamspaceListPermissions = {
    canCreate: permissions.getCanCreate(workspaceSlug),
    getCanEdit: (teamspaceId) => permissions.getCanEdit(workspaceSlug, teamspaceId),
    getCanDelete: (teamspaceId) => permissions.getCanDelete(workspaceSlug, teamspaceId),
    getCanManage: (teamspaceId) => permissions.getCanManage(workspaceSlug, teamspaceId),
    getCanAddProject: (teamspaceId) => permissions.getCanAddProject(workspaceSlug, teamspaceId),
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* TODO: Add applied filters */}
      <TeamspacesList permissions={listPermissions} />
    </div>
  );
});

export default TeamspaceListItemRoot;
