/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ENotificationFilterType, FILTER_TYPE_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PillButton } from "@makeplane/propel/components/pill";
import { CloseOutline } from "@makeplane/propel/icons";
import { Header, EHeaderVariant } from "@plane/ui";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";

type TAppliedFilters = {
  workspaceSlug: string;
};

export const AppliedFilters = observer(function AppliedFilters(props: TAppliedFilters) {
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
            <PillButton
              key={filter.value}
              type="button"
              size="md"
              variant="outline"
              label={t(filter.i18n_label)}
              endIcon={<CloseOutline className="h-3 w-3" />}
              onClick={() => handleFilterTypeChange(filter?.value, !isSelected)}
            />
          );
        })}
        <PillButton
          type="button"
          size="md"
          variant="outline"
          label={t("common.clear_all")}
          endIcon={<CloseOutline height={12} width={12} />}
          onClick={handleClearFilters}
        />
      </Header.LeftItem>
    </Header>
  );
});
