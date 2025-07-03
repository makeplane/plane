"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane imports
import { ENotificationFilterType } from "@plane/constants";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store";

export const NotificationFilterOptionItem: FC<{ label: string; value: ENotificationFilterType }> = observer((props) => {
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
      className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
      onClick={() => handleFilterTypeChange(value, !isSelected)}
    >
      <div
        className={cn("flex-shrink-0 w-3 h-3 flex justify-center items-center rounded-sm transition-all", {
          "bg-custom-primary text-white": isSelected,
          "bg-custom-background-90": !isSelected,
        })}
      >
        {isSelected && <Check className="h-2.5 w-2.5" />}
      </div>
      <div className={cn("whitespace-nowrap text-sm", isSelected ? "text-custom-text-100" : "text-custom-text-200")}>
        {label}
      </div>
    </div>
  );
});
