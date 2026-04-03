import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflowStore } from "@/hooks/store/use-workflow";
// local
import { WorkflowActivityLog } from "./activity-log";
import { WorkflowStateCard } from "./workflow-state-card";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const WorkflowSettingsRoot = observer(function WorkflowSettingsRoot({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const workflowStore = useWorkflowStore();
  const { getProjectStates } = useProjectState();

  const [isLoading, setIsLoading] = useState(true);
  const [showActivityLog, _setShowActivityLog] = useState(false);

  // Fetch workflow data on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await workflowStore.fetchWorkflow(workspaceSlug, projectId);
      } catch {
        setToast({ type: TOAST_TYPE.ERROR, title: t("error") });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [workspaceSlug, projectId, workflowStore]); // eslint-disable-line react-hooks/exhaustive-deps

  const workflowData = workflowStore.workflowByProject.get(projectId);
  const states = getProjectStates(projectId) ?? [];

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-tertiary">Loading...</div>;
  }

  return (
    <div className="w-full space-y-4">
      {/* Activity log panel */}
      {showActivityLog && (
        <div className="rounded-lg border border-subtle bg-surface-1 p-4">
          <h3 className="mb-3 text-sm font-medium text-primary">{t("project_settings.workflows.view_history")}</h3>
          <WorkflowActivityLog workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>
      )}

      {/* Per-state workflow cards */}
      <div className="space-y-3">
        {states.map((state) => {
          const stateData = workflowData?.states[state.id];
          return (
            <WorkflowStateCard
              key={state.id}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              stateId={state.id}
              allowIssueCreation={stateData?.allow_issue_creation ?? true}
              transitions={stateData?.transitions ?? {}}
            />
          );
        })}
      </div>
    </div>
  );
});
