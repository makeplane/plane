import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
// local imports
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseKanBanRoot } from "../base-kanban-root";

export const ModuleKanBanLayout = observer(function ModuleKanBanLayout() {
  const { workspaceSlug, projectId, moduleId } = useParams();

  // store
  const { issues } = useIssues(EIssuesStoreType.MODULE);

  return (
    <BaseKanBanRoot
      QuickActions={ModuleIssueQuickActions}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId || !moduleId) throw new Error();
        return issues.addIssuesToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
      }}
      viewId={moduleId?.toString()}
    />
  );
});
