/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
// plane imports
import { DATE_BEFORE_FILTER_OPTIONS } from "@plane/constants";
// local imports
import { DateFilterSubmenu, isCustomDateFilterValue } from "./date-filter-submenu";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string | string[]) => void;
};

/**
 * Render localized creation-date presets and a custom-date picker while preserving filter values.
 */
export const FilterCreatedDate = observer(function FilterCreatedDate(props: Props) {
  const { t } = useTranslation();
  const { appliedFilters, handleUpdate } = props;
  const options = DATE_BEFORE_FILTER_OPTIONS.map((option) => {
    const [amount, unit] = option.value.split(";")[0].split("_");
    return {
      value: option.value,
      name: t(`common.date_filter.${unit}_ago`, { count: Number(amount) }),
    };
  });

  return (
    <DateFilterSubmenu
      label={t("common.date_filter.created_date")}
      customLabel={t("common.date_filter.custom")}
      options={options}
      appliedFilters={appliedFilters}
      onToggleOption={handleUpdate}
      onSelectCustomRange={handleUpdate}
      // the store toggles each value it receives, so sending the custom values drops them
      onClearCustomRange={() => handleUpdate((appliedFilters ?? []).filter(isCustomDateFilterValue))}
    />
  );
});
