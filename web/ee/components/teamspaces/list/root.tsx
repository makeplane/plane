"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { TeamspacesList } from "@/plane-web/components/teamspaces/list/teamspaces-list";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const TeamspaceListItemRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // plane web hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN],
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
