/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ENotificationFilterType, FILTER_TYPE_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { Pill } from "@makeplane/propel/components/pill";
import { CloseOutline } from "@makeplane/propel/icons";
import { Header, EHeaderVariant } from "@plane/blocks/layout";
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
            <Pill
              key={filter.value}
              size="md"
              variant="outline"
              label={t(filter.i18n_label)}
              endIcon={<Icon icon={CloseOutline} />}
              onClick={() => handleFilterTypeChange(filter?.value, !isSelected)}
            />
          );
        })}
        <Pill
          size="md"
          variant="outline"
          label={t("common.clear_all")}
          endIcon={<Icon icon={CloseOutline} />}
          onClick={handleClearFilters}
        />
      </Header.LeftItem>
    </Header>
  );
});
