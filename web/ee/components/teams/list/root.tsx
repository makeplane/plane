"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { TeamsList } from "@/plane-web/components/teams/list/teams-list";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const TeamsListRoot = observer(() => {
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
      <TeamsList isEditingAllowed={isEditingAllowed} />
    </div>
  );
});

export default TeamsListRoot;
