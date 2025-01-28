"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
// plane imports
import { ENotificationFilterType, FILTER_TYPE_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Header, EHeaderVariant, Tag } from "@plane/ui";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store";

type TAppliedFilters = {
  workspaceSlug: string;
};

export const AppliedFilters: FC<TAppliedFilters> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { filters, updateFilters } = useWorkspaceNotifications();
  const { t } = useTranslation();
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
    <Header variant={EHeaderVariant.TERNARY}>
      <Header.LeftItem className="w-full">
        {FILTER_TYPE_OPTIONS.map((filter) => {
          const isSelected = filters?.type?.[filter?.value] || false;
          if (!isSelected) return <></>;
          return (
            <Tag
              key={filter.value}
              className="flex flex-wrap flex-start"
              onClick={() => handleFilterTypeChange(filter?.value, !isSelected)}
            >
              <div className="whitespace-nowrap text-custom-text-200">{t(filter.i18n_label)}</div>
              <div className="w-4 h-4 flex justify-center items-center transition-all rounded-sm text-custom-text-200 hover:text-custom-text-100">
                <X className="h-3 w-3" />
              </div>
            </Tag>
          );
        })}
        <button type="button" onClick={handleClearFilters}>
          <Tag>
            {t("common.clear_all")}
            <X size={12} strokeWidth={2} />
          </Tag>
        </button>
      </Header.LeftItem>
    </Header>
  );
});
