import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// mobx store
import { EIssuesStoreType } from "@/constants/issue";
import { useCycle } from "@/hooks/store";
// components
import { CycleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const CycleSpreadsheetLayout: React.FC = observer(() => {
  const router = useRouter();
  const { cycleId } = router.query;
  const { currentProjectCompletedCycleIds } = useCycle();

  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;

  const canEditIssueProperties = useCallback(() => !isCompletedCycle, [isCompletedCycle]);

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
