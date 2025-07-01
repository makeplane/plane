"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { TeamspacesList } from "@/plane-web/components/teamspaces/list/teamspaces-list";

const TeamspaceListItemRoot = observer(() => {
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
