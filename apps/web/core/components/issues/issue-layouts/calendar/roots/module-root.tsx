import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
// local imports
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseCalendarRoot } from "../base-calendar-root";

export const ModuleCalendarLayout: React.FC = observer(() => {
  const { workspaceSlug, projectId, moduleId } = useParams();

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
      addIssuesToView={addIssuesToView}
      viewId={moduleId?.toString()}
    />
  );
});
