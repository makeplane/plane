import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// components
import { CycleIssueQuickActions } from "@/components/issues";
// constants
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useCycle, useIssues, useUser } from "@/hooks/store";
// components
import { BaseKanBanRoot } from "../base-kanban-root";

export interface ICycleKanBanLayout {}

export const CycleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  // store
  const { issues } = useIssues(EIssuesStoreType.CYCLE);
  const { currentProjectCompletedCycleIds } = useCycle();
  const {
    membership: { currentProjectRole },
  } = useUser();

  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId.toString()) : false;
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const canEditIssueProperties = useCallback(
    () => !isCompletedCycle && isEditingAllowed,
    [isCompletedCycle, isEditingAllowed]
  );

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
