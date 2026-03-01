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
import { Button } from "@plane/propel/button";
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// plane web imports
import { TeamspaceProjectWorkItemFilters } from "@/components/teamspaces/projects/filters";

type TeamspaceProjectDetailHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
  projectId: string;
};

export const TeamspaceProjectDetailHeaderActions = observer(function TeamspaceProjectDetailHeaderActions(
  props: TeamspaceProjectDetailHeaderActionsProps
) {
  const { teamspaceId, isEditingAllowed, projectId } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();

  if (!workspaceSlug) return;

  return (
    <>
      <div className="hidden gap-2 items-center md:flex">
        <TeamspaceProjectWorkItemFilters
          teamspaceId={teamspaceId}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId}
        />
      </div>
      {isEditingAllowed ? (
        <Button
          onClick={() => {
            toggleCreateIssueModal(true, EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS, [projectId]);
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
