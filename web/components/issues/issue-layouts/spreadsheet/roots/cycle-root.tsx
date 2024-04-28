import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// constants
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useCycle, useUser } from "@/hooks/store";
// components
import { CycleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const CycleSpreadsheetLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { cycleId } = router.query;
  // store hooks
  const { currentProjectCompletedCycleIds } = useCycle();
  const {
    membership: { currentProjectRole },
  } = useUser();
  // auth
  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const canEditIssueProperties = useCallback(
    () => !isCompletedCycle && isEditingAllowed,
    [isCompletedCycle, isEditingAllowed]
  );

  if (!cycleId) return null;

  return (
    <BaseSpreadsheetRoot
      viewId={cycleId?.toString()}
      QuickActions={CycleIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditIssueProperties}
      isCompletedCycle={isCompletedCycle}
      storeType={EIssuesStoreType.CYCLE}
    />
  );
});
