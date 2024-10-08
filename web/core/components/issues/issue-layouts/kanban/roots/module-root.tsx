import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hook
import { ModuleIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "@/hooks/store";
// components
// types
// constants
import { BaseKanBanRoot } from "../base-kanban-root";

export const ModuleKanBanLayout: React.FC = observer(() => {
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
