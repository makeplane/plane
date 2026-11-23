/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { DATE_BEFORE_FILTER_OPTIONS } from "@plane/constants";
// local imports
import { DateFilterSubmenu, isCustomDateFilterValue } from "./date-filter-submenu";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string | string[]) => void;
};

export const FilterCreatedDate = observer(function FilterCreatedDate(props: Props) {
  const { appliedFilters, handleUpdate } = props;

  return (
    <DateFilterSubmenu
      label="Created date"
      options={DATE_BEFORE_FILTER_OPTIONS}
      appliedFilters={appliedFilters}
      onToggleOption={handleUpdate}
      onSelectCustomRange={handleUpdate}
      // the store toggles each value it receives, so sending the custom values drops them
      onClearCustomRange={() => handleUpdate((appliedFilters ?? []).filter(isCustomDateFilterValue))}
    />
  );
});
