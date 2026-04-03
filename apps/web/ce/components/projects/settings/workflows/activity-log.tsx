import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { format } from "date-fns";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IWorkflowActivity } from "@plane/types";
// hooks
import { useWorkflowStore } from "@/hooks/store/use-workflow";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const WorkflowActivityLog = observer(function WorkflowActivityLog({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const workflowStore = useWorkflowStore();
  const [activities, setActivities] = useState<IWorkflowActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // eslint-disable-next-line promise/catch-or-return
    workflowStore
      .fetchActivity(workspaceSlug, projectId)
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setIsLoading(false));
  }, [workspaceSlug, projectId, workflowStore]);

  if (isLoading) {
    return (
      <div className="py-6 text-center text-sm text-tertiary">{t("project_settings.workflows.activity_loading")}</div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-tertiary">{t("project_settings.workflows.activity_empty")}</div>
    );
  }

  return (
    <ul className="divide-y divide-color-subtle">
      {activities.map((activity) => (
        <li key={activity.id} className="flex justify-between gap-4 px-0 py-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">{activity.triggered_by?.display_name ?? "Unknown"}</p>
            <p className="text-xs text-secondary mt-1">{activity.action}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-tertiary">{format(new Date(activity.created_at), "MMM d, yyyy HH:mm")}</p>
          </div>
        </li>
      ))}
    </ul>
  );
});
