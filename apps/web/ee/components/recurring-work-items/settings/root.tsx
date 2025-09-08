import { FC } from "react";
import { observer } from "mobx-react";
// plane web imports
import { useRecurringWorkItems } from "@/plane-web/hooks/store/recurring-work-items/use-recurring-work-items";
// local imports
import { RecurringWorkItemsEmptyState } from "./empty-state";
import { RecurringWorkItemsSettingsList } from "./list/root";

type TRecurringWorkItemsSettingsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const RecurringWorkItemsSettingsRoot: FC<TRecurringWorkItemsSettingsRootProps> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { isRecurringWorkItemsInitializing, isAnyRecurringWorkItemsAvailableForProject } = useRecurringWorkItems();
  // derived values
  const isRecurringWorkItemsAvailable = isAnyRecurringWorkItemsAvailableForProject(workspaceSlug, projectId);

  if (!isRecurringWorkItemsInitializing && !isRecurringWorkItemsAvailable) {
    return <RecurringWorkItemsEmptyState workspaceSlug={workspaceSlug} projectId={projectId} />;
  }

  return <RecurringWorkItemsSettingsList workspaceSlug={workspaceSlug} projectId={projectId} />;
});
