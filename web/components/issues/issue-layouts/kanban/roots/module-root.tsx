import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hook
import { useIssues } from "hooks/store";
// components
import { ModuleIssueQuickActions } from "components/issues";
// constants
import { BaseKanBanRoot } from "../base-kanban-root";
import { EIssuesStoreType } from "constants/issue";

export interface IModuleKanBanLayout {}

export const ModuleKanBanLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  // store
  const { issues } = useIssues(EIssuesStoreType.MODULE);

  return (
    <BaseKanBanRoot
      showLoader={true}
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
