"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
// constants
import { ENotificationFilterType, FILTER_TYPE_OPTIONS } from "@/constants/notification";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store";

type TAppliedFilters = {
  workspaceSlug: string;
};

export const AppliedFilters: FC<TAppliedFilters> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { filters, updateFilters } = useWorkspaceNotifications();
  // derived values
  const isFiltersEnabled = Object.entries(filters.type || {}).some(([, value]) => value);

  const handleFilterTypeChange = (filterType: ENotificationFilterType, filterValue: boolean) =>
    updateFilters("type", {
      ...filters.type,
      [filterType]: filterValue,
    });

  const handleClearFilters = () => {
    updateFilters("type", {
      [ENotificationFilterType.ASSIGNED]: false,
      [ENotificationFilterType.CREATED]: false,
      [ENotificationFilterType.SUBSCRIBED]: false,
    });
  };

  if (!isFiltersEnabled || !workspaceSlug) return <></>;
  return (
    <div className="border-b border-custom-border-200 px-5 py-3 flex items-center flex-wrap gap-2">
      {FILTER_TYPE_OPTIONS.map((filter) => {
        const isSelected = filters?.type?.[filter?.value] || false;
        if (!isSelected) return <></>;
        return (
          <div
            key={filter.value}
            className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all border border-custom-border-200 rounded-sm text-xs"
            onClick={() => handleFilterTypeChange(filter?.value, !isSelected)}
          >
            <div className="whitespace-nowrap text-custom-text-200">{filter.label}</div>
            <div className="w-4 h-4 flex justify-center items-center transition-all rounded-sm bg-custom-background-90 hover:bg-custom-background-80  text-custom-text-200 hover:text-custom-text-100">
              <X className="h-3 w-3" />
            </div>
          </div>
        );
      })}

      <div
        className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all border border-custom-border-200 rounded-sm text-xs bg-custom-background-90 hover:bg-custom-background-80  text-custom-text-200 hover:text-custom-text-100"
        onClick={handleClearFilters}
      >
        <div className="whitespace-nowrap">Clear all</div>
      </div>
    </div>
  );
});
