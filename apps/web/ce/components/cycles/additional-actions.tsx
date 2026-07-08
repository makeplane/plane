/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import type { TCycleGroups } from "@plane/types";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { EndCycleModal } from "./end-cycle";

type Props = {
  cycleId: string;
  projectId: string;
};

export const CycleAdditionalActions = observer(function CycleAdditionalActions(props: Props) {
  const { cycleId, projectId } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [endCycleModal, setEndCycleModal] = useState(false);
  // store hooks
  const { getCycleById } = useCycle();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const cycleDetails = getCycleById(cycleId);
  const cycleStatus = cycleDetails?.status ? (cycleDetails.status.toLocaleLowerCase() as TCycleGroups) : "draft";
  const transferrableIssuesCount = cycleDetails
    ? cycleDetails.total_issues - (cycleDetails.cancelled_issues + cycleDetails.completed_issues)
    : 0;

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    projectId
  );

  if (!workspaceSlug || !cycleDetails || !!cycleDetails.archived_at || cycleStatus !== "current" || !isEditingAllowed)
    return <></>;

  return (
    <>
      <EndCycleModal
        isOpen={endCycleModal}
        handleClose={() => setEndCycleModal(false)}
        cycleId={cycleId}
        projectId={projectId}
        workspaceSlug={workspaceSlug.toString()}
        transferrableIssuesCount={transferrableIssuesCount}
        cycleName={cycleDetails.name}
      />
      <Button
        variant="secondary"
        size="base"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setEndCycleModal(true);
        }}
      >
        End cycle
      </Button>
    </>
  );
});
