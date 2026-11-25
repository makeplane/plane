/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
import { STATE_GROUPS } from "@plane/constants";
import { StateGroupIcon } from "@plane/blocks/icons";
// components
import { FilterSubmenu } from "@/components/common/filters/filter-submenu";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
};

const STATE_GROUP_OPTIONS = Object.values(STATE_GROUPS).map((stateGroup) => ({
  value: stateGroup.key,
  i18n_label: stateGroup.i18n_label,
  icon: <StateGroupIcon stateGroup={stateGroup.key} />,
}));

export const FilterStateGroup = observer(function FilterStateGroup(props: Props) {
  const { t } = useTranslation();
  const { appliedFilters, handleUpdate } = props;

  return (
    <FilterSubmenu
      label="State group"
      options={STATE_GROUP_OPTIONS.map(({ value, icon, i18n_label }) => ({ value, icon, label: t(i18n_label) }))}
      appliedFilters={appliedFilters}
      onToggle={handleUpdate}
    />
  );
});
