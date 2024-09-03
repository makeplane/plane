"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
// constants
import { CustomContainer, CustomHeader, EHeaderVariant } from "@plane/ui";
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
    <CustomHeader variant={EHeaderVariant.TERNARY} className="justify-start flex-wrap gap-2">
      {FILTER_TYPE_OPTIONS.map((filter) => {
        const isSelected = filters?.type?.[filter?.value] || false;
        if (!isSelected) return <></>;
        return (
          <CustomContainer
            key={filter.value}
            className="flex flex-wrap flex-start"
            onClick={() => handleFilterTypeChange(filter?.value, !isSelected)}
          >
            <div className="whitespace-nowrap text-custom-text-200">{filter.label}</div>
            <div className="w-4 h-4 flex justify-center items-center transition-all rounded-sm bg-custom-background-90 hover:bg-custom-background-80  text-custom-text-200 hover:text-custom-text-100">
              <X className="h-3 w-3" />
            </div>
          </CustomContainer>
        );
      })}
      <button type="button" onClick={handleClearFilters}>
        <CustomContainer>
          Clear all
          <X size={12} strokeWidth={2} />
        </CustomContainer>
      </button>
    </CustomHeader>
  );
});
