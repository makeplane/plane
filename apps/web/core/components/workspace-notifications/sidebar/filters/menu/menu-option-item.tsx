import { observer } from "mobx-react";

import type { ENotificationFilterType } from "@plane/constants";
import { CheckIcon } from "@plane/propel/icons";
// plane imports
// helpers
import { cn } from "@plane/utils";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";

export const NotificationFilterOptionItem = observer(function NotificationFilterOptionItem(props: {
  label: string;
  value: ENotificationFilterType;
}) {
  const { value, label } = props;
  // hooks
  const { filters, updateFilters } = useWorkspaceNotifications();

  const handleFilterTypeChange = (filterType: ENotificationFilterType, filterValue: boolean) =>
    updateFilters("type", {
      ...filters.type,
      [filterType]: filterValue,
    });

  // derived values
  const isSelected = filters?.type?.[value] || false;

  return (
    <div
      key={value}
      className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all hover:bg-layer-1 rounded-xs"
      onClick={() => handleFilterTypeChange(value, !isSelected)}
    >
      <div
        className={cn("flex-shrink-0 w-3 h-3 flex justify-center items-center rounded-xs transition-all", {
          "bg-accent-primary text-on-color": isSelected,
          "bg-surface-2": !isSelected,
        })}
      >
        {isSelected && <CheckIcon className="h-2.5 w-2.5" />}
      </div>
      <div
        className={cn("whitespace-nowrap text-body-xs-medium", {
          "text-primary": isSelected,
          "text-secondary": !isSelected,
        })}
      >
        {label}
      </div>
    </div>
  );
});
