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
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// plane web imports
import { TeamspaceViewListHeader } from "@/components/teamspaces/views/filters/list";

type TeamspaceViewsListHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspaceViewsListHeaderActions = observer(function TeamspaceViewsListHeaderActions(
  props: TeamspaceViewsListHeaderActionsProps
) {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateTeamspaceViewModal } = useCommandPalette();

  if (!workspaceSlug) return;

  return (
    <>
      <TeamspaceViewListHeader teamspaceId={teamspaceId} />
      {isEditingAllowed && (
        <Button
          variant="primary"
          onClick={() => {
            toggleCreateTeamspaceViewModal({ isOpen: true, teamspaceId });
          }}
          size="lg"
        >
          Add view
        </Button>
      )}
    </>
  );
});
