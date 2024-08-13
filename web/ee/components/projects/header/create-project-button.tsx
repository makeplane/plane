"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/ui";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useCommandPalette, useEventTracker, useUser } from "@/hooks/store";

export const ProjectCreateButton: FC = observer((props) => {
  const {} = props;
  // hooks
  const { setTrackElement } = useEventTracker();
  const { toggleCreateProjectModal } = useCommandPalette();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

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
