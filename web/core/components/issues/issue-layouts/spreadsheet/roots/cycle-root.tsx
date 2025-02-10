import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useCycle, useUserPermissions } from "@/hooks/store";
// components
import { CycleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const CycleSpreadsheetLayout: React.FC = observer(() => {
  // router
  const { cycleId } = useParams();
  // store hooks
  const { currentProjectCompletedCycleIds } = useCycle();
  const { allowPermissions } = useUserPermissions();
  // auth
  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const canEditIssueProperties = useCallback(
    () => !isCompletedCycle && isEditingAllowed,
    [isCompletedCycle, isEditingAllowed]
  );

  if (!cycleId) return null;

  return (
    <BaseSpreadsheetRoot
      QuickActions={CycleIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditIssueProperties}
      isCompletedCycle={isCompletedCycle}
      viewId={cycleId.toString()}
    />
  );
});
