import { observer } from "mobx-react";
// components
import { DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// local imports
import { CreateRecurringWorkItemsButton } from "./create-button";

type TRecurringWorkItemsEmptyStateProps = { workspaceSlug: string; projectId: string };

export const RecurringWorkItemsEmptyState = observer((props: TRecurringWorkItemsEmptyStateProps) => {
  // derived values
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/recurring-work-items/no-recurring-work-items" });

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-center h-full w-full">
        <DetailedEmptyState
          title={""}
          assetPath={resolvedPath}
          className="h-fit min-h-full items-start !p-0"
          size="md"
          customPrimaryButton={
            <CreateRecurringWorkItemsButton
              {...props}
              buttonSize="md"
              buttonI18nLabel="recurring_work_items.empty_state.no_templates.button"
            />
          }
        />
      </div>
    </div>
  );
});
