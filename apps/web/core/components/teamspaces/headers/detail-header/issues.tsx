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
import { Button } from "@plane/propel/button";
import { EIssuesStoreType } from "@plane/types";
// plane constants
// components
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// plane web imports
import { TeamHeaderFilters } from "@/components/teamspaces/issues/filters";
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces/use-teamspaces";

type TeamspaceWorkItemListHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspaceWorkItemListHeaderActions = observer(function TeamspaceWorkItemListHeaderActions(
  props: TeamspaceWorkItemListHeaderActionsProps
) {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { getTeamspaceProjectIds } = useTeamspaces();
  // derived values
  const teamspaceProjectIds = teamspaceId ? getTeamspaceProjectIds(teamspaceId) : [];

  if (!workspaceSlug) return;

  return (
    <>
      <div className="hidden gap-2 items-center md:flex">
        <TeamHeaderFilters teamspaceId={teamspaceId} workspaceSlug={workspaceSlug.toString()} />
      </div>
      {isEditingAllowed ? (
        <Button
          onClick={() => {
            toggleCreateIssueModal(true, EIssuesStoreType.TEAM, teamspaceProjectIds);
          }}
          size="lg"
        >
          <div className="hidden sm:block">Add</div> work item
        </Button>
      ) : (
        <></>
      )}
    </>
  );
});
