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
import { WikiIcon } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import { MovePageModalListItem } from "../list-item";
import type { TMovePageSelectedValue } from "../root";
import { MovePageModalProjectsListSection } from "./projects-list";
import { MovePageModalTeamspacesListSection } from "./teamspaces-list";

type Props = {
  canPageBeMovedToTeamspace: boolean;
  searchTerm: string;
};

export const MovePageModalSections = observer(function MovePageModalSections(props: Props) {
  const { canPageBeMovedToTeamspace, searchTerm } = props;
  // navigation
  const { workspaceSlug, teamspaceId, projectId } = useParams();
  // store hooks
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { allowPermissions } = useUserPermissions();
  // auth and permissions
  const isWikiEnabled = useFlag(workspaceSlug?.toString() ?? "", "WORKSPACE_PAGES");
  const isTeamspacesEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_TEAMSPACES_ENABLED);
  const canCreateWikiPage = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );
  // section components
  const projectsListSection = <MovePageModalProjectsListSection searchTerm={searchTerm} />;
  const teamspacesListSection =
    isTeamspacesEnabled && canPageBeMovedToTeamspace ? (
      <MovePageModalTeamspacesListSection searchTerm={searchTerm} />
    ) : null;
  const shouldShowWikiSection = workspaceSlug && (projectId || teamspaceId) && isWikiEnabled && canCreateWikiPage;

  return (
    <div className="space-y-3">
      {shouldShowWikiSection && (
        <section className="px-2">
          <MovePageModalListItem
            item={{
              logo: <WikiIcon className="size-4" />,
              name: "Wiki",
              value: "workspace" satisfies TMovePageSelectedValue,
            }}
          />
        </section>
      )}
      {projectId ? (
        <>
          {projectsListSection}
          {teamspacesListSection}
        </>
      ) : teamspaceId ? (
        <>
          {teamspacesListSection}
          {projectsListSection}
        </>
      ) : (
        <>
          {projectsListSection}
          {teamspacesListSection}
        </>
      )}
    </div>
  );
});
