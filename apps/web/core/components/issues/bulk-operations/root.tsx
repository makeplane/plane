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

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import { Checkbox } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
// plane-web
import { hideFloatingBot, showFloatingBot } from "@/helpers/pi-chat";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
import { UpgradeToast } from "@/components/workspace/upgrade-toast";
import { BulkOperationsActionsRoot } from "./actions";
import { IssueBulkOperationsProperties } from "./properties";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

export const IssueBulkOperationsRoot = observer(function IssueBulkOperationsRoot(props: Props) {
  const { className, selectionHelpers } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { isSelectionActive, selectedEntityIds } = useMultipleSelectStore();
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const isBulkOpsEnabled = useFlag(workspaceSlug?.toString(), "BULK_OPS_ONE");
  const { handleClearSelection } = selectionHelpers;

  useEffect(() => {
    if (isSelectionActive) {
      hideFloatingBot();
    }
    if (!isSelectionActive) {
      showFloatingBot();
    }
  }, [isSelectionActive]);

  if (!isSelectionActive || selectionHelpers.isSelectionDisabled) return null;

  return (
    <div className={cn("sticky bottom-0 left-0 z-10 h-14", className)}>
      <div className="size-full bg-surface-1 border-t border-subtle-1 py-4 px-3.5 flex items-center divide-x-[0.5px] divide-subtle-1 text-tertiary">
        <div className="h-7 pr-3 text-13 flex items-center gap-2 flex-shrink-0">
          <Checkbox
            className="!outline-none size-3.5"
            iconClassName="size-3"
            onClick={handleClearSelection}
            indeterminate
          />
          <div className="flex items-center gap-1">
            <span
              className="flex-shrink-0"
              style={{ minWidth: `${Math.max(8, String(selectedEntityIds.length).length * 8)}px` }}
            >
              {selectedEntityIds.length}
            </span>
            selected
          </div>
        </div>
        <Tooltip
          position="top-end"
          className="mb-4 rounded-lg shadow"
          disabled={isBulkOpsEnabled}
          tooltipContent={<UpgradeToast />}
        >
          <div className="flex w-full overflow-hidden overflow-x-auto">
            <div
              className={cn("flex grow", {
                "opacity-50 pointer-events-none": !isBulkOpsEnabled,
              })}
            >
              <BulkOperationsActionsRoot
                handleClearSelection={handleClearSelection}
                selectedEntityIds={selectedEntityIds}
              />
              <div className="h-7 pl-3 flex-grow">
                <IssueBulkOperationsProperties
                  selectionHelpers={selectionHelpers}
                  snapshot={{ isSelectionActive, selectedEntityIds }}
                />
              </div>
            </div>
            {!isBulkOpsEnabled && (
              <div className="flex-shrink-0">
                <Button variant="secondary" onClick={() => togglePaidPlanModal(true)}>
                  Upgrade
                </Button>
              </div>
            )}
          </div>
        </Tooltip>
      </div>
    </div>
  );
});
