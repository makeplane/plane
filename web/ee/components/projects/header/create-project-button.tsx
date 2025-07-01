"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { Button } from "@plane/ui";
// hooks
import { useCommandPalette, useEventTracker, useUserPermissions } from "@/hooks/store";

export const ProjectCreateButton: FC = observer((props) => {
  const {} = props;
  // hooks
  const { setTrackElement } = useEventTracker();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  const isAuthorizedUser = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (!isAuthorizedUser) return <></>;
  return (
    <Button
      size="sm"
      onClick={() => {
        setTrackElement("Projects page");
        toggleCreateProjectModal(true);
      }}
      className="items-center gap-1"
    >
      <span className="hidden sm:inline-block">Add</span> Project
    </Button>
  );
});
