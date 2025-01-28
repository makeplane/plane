"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// constants
import { EUserPermissionsLevel } from "@plane/constants";
// types
import { EUserPermissions } from "@plane/types/src/enums";
// hooks
import { useUserPermissions } from "@/hooks/store";
// local components
import { LayoutRoot } from "../../common";
import { ProjectOverviewMainContentRoot } from "./main/root";
import { ProjectOverviewSidebarRoot } from "./sidebar/root";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { allowPermissions } = useUserPermissions();

  // derived values
  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <LayoutRoot>
      <ProjectOverviewMainContentRoot workspaceSlug={workspaceSlug} projectId={projectId} disabled={!isEditable} />
      <ProjectOverviewSidebarRoot workspaceSlug={workspaceSlug} projectId={projectId} />
    </LayoutRoot>
  );
});
