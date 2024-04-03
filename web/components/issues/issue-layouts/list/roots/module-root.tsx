import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// mobx store
import { ModuleIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "@/hooks/store";
// components
// types
// constants
import { BaseListRoot } from "../base-list-root";

export interface IModuleListLayout {}

export const ModuleListLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { issues } = useIssues(EIssuesStoreType.MODULE);

  return (
    <BaseListRoot
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
