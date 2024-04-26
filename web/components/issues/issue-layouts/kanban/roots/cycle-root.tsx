import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { CycleIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
import { useCycle, useIssues } from "@/hooks/store";
// ui
// types
// components
import { BaseKanBanRoot } from "../base-kanban-root";

export interface ICycleKanBanLayout {}

export const CycleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  // store
  const { issues } = useIssues(EIssuesStoreType.CYCLE);
  const { currentProjectCompletedCycleIds } = useCycle();

  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;

  const canEditIssueProperties = useCallback(() => !isCompletedCycle, [isCompletedCycle]);

  const addIssuesToView = useCallback(
    (issueIds: string[]) => {
      if (!workspaceSlug || !projectId || !cycleId) throw new Error();
      return issues.addIssueToCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), issueIds);
    },
    [issues?.addIssueToCycle, workspaceSlug, projectId, cycleId]
  );

  return (
    <BaseKanBanRoot
      showLoader
      QuickActions={CycleIssueQuickActions}
      viewId={cycleId?.toString() ?? ""}
      storeType={EIssuesStoreType.CYCLE}
      addIssuesToView={addIssuesToView}
      canEditPropertiesBasedOnProject={canEditIssueProperties}
      isCompletedCycle={isCompletedCycle}
    />
  );
});
