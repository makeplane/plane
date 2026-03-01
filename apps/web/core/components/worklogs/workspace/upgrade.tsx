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
import { Button } from "@plane/propel/button";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { EmptyStateCompact } from "@plane/propel/empty-state";

export const WorkspaceWorklogsUpgrade = observer(function WorkspaceWorklogsUpgrade() {
  // store hooks
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 border-b border-subtle-1 pb-3">
        <div>
          <h3 className="text-18 font-medium">Worklogs</h3>
          <span className="text-13 text-tertiary">Download worklogs AKA timesheets for anyone in any project.</span>
        </div>
        <Button onClick={() => togglePaidPlanModal(true)} className="w-fit">
          Upgrade
        </Button>
      </div>
      <EmptyStateCompact
        assetKey="worklog"
        title="Get detailed time-tracking reports from your workspace"
        description="Set date ranges for logged time by any member in any project in your workspace and get full CSVs in a click."
        align="start"
        rootClassName="py-20"
        actions={[
          {
            label: "Upgrade",
            onClick: () => togglePaidPlanModal(true),
            variant: "primary",
          },
        ]}
      />
    </div>
  );
});
