import { observer } from "mobx-react";
// plane imports
import { Loader } from "@plane/ui";
// plane web imports
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types/use-issue-types";
import { useRecurringWorkItems } from "@/plane-web/hooks/store/recurring-work-items/use-recurring-work-items";
// local imports
import { RecurringWorkItemListItem } from "./list-item";

type TRecurringWorkItemsSettingsListProps = {
  projectId: string;
  workspaceSlug: string;
};

export const RecurringWorkItemsSettingsList = observer((props: TRecurringWorkItemsSettingsListProps) => {
  const { projectId, workspaceSlug } = props;
  // store hooks
  const {
    deleteRecurringWorkItem,
    getAllRecurringWorkItemIdsByProjectId,
    getRecurringWorkItemById,
    isRecurringWorkItemsInitializing,
  } = useRecurringWorkItems();
  const { getIssueTypeById } = useIssueTypes();
  // derived values
  const recurringWorkItemIds = getAllRecurringWorkItemIdsByProjectId(workspaceSlug, projectId);

  return (
    <div className="flex flex-col gap-4 w-full">
      {isRecurringWorkItemsInitializing ? (
        <Loader className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Loader.Item key={index} height="55px" />
          ))}
        </Loader>
      ) : (
        recurringWorkItemIds.map((recurringWorkItemId) => (
          <div key={recurringWorkItemId}>
            <RecurringWorkItemListItem
              deleteRecurringWorkItem={(rwiId) => deleteRecurringWorkItem(workspaceSlug, projectId, rwiId)}
              getRecurringWorkItemById={getRecurringWorkItemById}
              getRecurringWorkItemTypeById={getIssueTypeById}
              key={recurringWorkItemId}
              projectId={projectId}
              recurringWorkItemId={recurringWorkItemId}
              workspaceSlug={workspaceSlug}
            />
          </div>
        ))
      )}
    </div>
  );
});
