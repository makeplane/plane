import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { RotateCcw, History } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomMenu, ToggleSwitch } from "@plane/ui";
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
  const [showActivityLog, setShowActivityLog] = useState(false);

  // Fetch workflow data on mount
  useEffect(() => {
    setIsLoading(true);
    workflowStore
      .fetchWorkflow(workspaceSlug, projectId)
      .catch(() => setToast({ type: TOAST_TYPE.ERROR, title: t("common.error") }))
      .finally(() => setIsLoading(false));
  }, [workspaceSlug, projectId, workflowStore, t]);

  const isLive = workflowStore.isLive(projectId);
  const workflowData = workflowStore.workflowByProject.get(projectId);
  const states = getProjectStates(projectId) ?? [];

  const handleToggleLive = async (value: boolean) => {
    try {
      await workflowStore.updateIsLive(workspaceSlug, projectId, value);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: value ? t("project_settings.workflows.live_toggle_on") : t("project_settings.workflows.live_toggle_off"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error") });
    }
  };

  const handleReset = async () => {
    if (!confirm(t("project_settings.workflows.reset_confirm_title"))) return;
    try {
      await workflowStore.resetWorkflow(workspaceSlug, projectId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("project_settings.workflows.reset") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error") });
    }
  };

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-color-tertiary">Loading...</div>;
  }

  return (
    <div className="w-full space-y-6">
      {/* Header: Live toggle + three-dot menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-color-primary">
            {t("project_settings.workflows.live_toggle_label")}
          </span>
          <ToggleSwitch value={isLive} onChange={(v) => void handleToggleLive(v)} size="sm" />
          <span className="text-xs text-color-secondary">
            {isLive
              ? t("project_settings.workflows.live_toggle_on")
              : t("project_settings.workflows.live_toggle_off")}
          </span>
        </div>

        <CustomMenu ellipsis customButtonClassName="flex items-center text-color-secondary hover:text-color-primary">
          <CustomMenu.MenuItem onClick={() => void handleReset()}>
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="h-4 w-4" />
              {t("project_settings.workflows.reset")}
            </div>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={() => setShowActivityLog((prev) => !prev)}>
            <div className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4" />
              {t("project_settings.workflows.view_history")}
            </div>
          </CustomMenu.MenuItem>
        </CustomMenu>
      </div>

      {/* Activity log panel */}
      {showActivityLog && (
        <div className="rounded-lg border border-color-subtle bg-surface-1 p-4">
          <h3 className="mb-3 text-sm font-medium text-color-primary">{t("project_settings.workflows.view_history")}</h3>
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
