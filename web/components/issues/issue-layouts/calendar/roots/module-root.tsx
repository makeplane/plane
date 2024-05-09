import { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hooks
// components
import { ModuleIssueQuickActions } from "@/components/issues";
// types
// constants
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "@/hooks/store";
import { BaseCalendarRoot } from "../base-calendar-root";

export const ModuleCalendarLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { issues } = useIssues(EIssuesStoreType.MODULE);

  if (!moduleId) return null;

  const addIssuesToView = useCallback(
    (issueIds: string[]) => {
      if (!workspaceSlug || !projectId || !moduleId) throw new Error();
      return issues.addIssuesToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
    },
    [issues?.addIssuesToModule, workspaceSlug, projectId, moduleId]
  );

  return (
    <BaseCalendarRoot
      QuickActions={ModuleIssueQuickActions}
      storeType={EIssuesStoreType.MODULE}
      addIssuesToView={addIssuesToView}
      viewId={moduleId.toString()}
    />
  );
});
