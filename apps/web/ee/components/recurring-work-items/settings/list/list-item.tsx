import { useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { IIssueType } from "@plane/types";
import { getRecurringWorkItemIntervalTypeLabel } from "@plane/utils";
// plane web imports
import { IssueTypeLogo } from "@/plane-web/components/issue-types";
import { IRecurringWorkItemInstance } from "@/plane-web/store/recurring-work-items/instance";
// local imports
import { RecurringWorkItemQuickActions } from "./quick-actions";

type RecurringWorkItemListItemProps = {
  deleteRecurringWorkItem: (id: string) => Promise<void>;
  getRecurringWorkItemById: (id: string) => IRecurringWorkItemInstance | undefined;
  getRecurringWorkItemTypeById: (typeId: string) => IIssueType | undefined;
  projectId: string;
  recurringWorkItemId: string;
  workspaceSlug: string;
};

export const RecurringWorkItemListItem = observer((props: RecurringWorkItemListItemProps) => {
  const { getRecurringWorkItemById, getRecurringWorkItemTypeById, recurringWorkItemId } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // derived values
  const recurringWorkItem = getRecurringWorkItemById(recurringWorkItemId);
  const recurringWorkItemTypeId = recurringWorkItem?.workitem_blueprint.type.id;
  const recurringWorkItemType = recurringWorkItemTypeId
    ? getRecurringWorkItemTypeById(recurringWorkItemTypeId)
    : undefined;

  if (!recurringWorkItem) return null;
  return (
    <div className="flex items-center justify-between gap-2.5 p-3 border border-custom-border-200 rounded-lg bg-custom-background-90/60">
      <div className="flex items-center gap-2.5 w-full truncate">
        <IssueTypeLogo
          icon_props={recurringWorkItemType?.logo_props?.icon}
          isDefault={recurringWorkItemType?.is_default}
          isEpic={recurringWorkItemType?.is_epic}
          size="lg"
        />
        <div className="text-sm font-medium text-custom-text-100 truncate">
          {recurringWorkItem.workitem_blueprint.name}
        </div>
      </div>
      <div className="w-full text-right text-xs font-medium text-custom-text-300">
        repeats every {getRecurringWorkItemIntervalTypeLabel(recurringWorkItem.interval_type)}
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        <RecurringWorkItemQuickActions {...props} parentRef={parentRef} />
      </div>
    </div>
  );
});
