import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hook
import { ModuleIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "@/hooks/store";
// components
// types
// constants
import { BaseKanBanRoot } from "../base-kanban-root";

export interface IModuleKanBanLayout {}

export const ModuleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  // store
  const { issues } = useIssues(EIssuesStoreType.MODULE);

  return (
    <BaseKanBanRoot
      showLoader
      QuickActions={ModuleIssueQuickActions}
      viewId={moduleId?.toString()}
      storeType={EIssuesStoreType.MODULE}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId || !moduleId) throw new Error();
        return issues.addIssuesToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
      }}
    />
  );
});
