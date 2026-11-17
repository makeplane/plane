/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ModuleStatusIcon } from "@plane/blocks/icons";
import type { TModuleStatus } from "@plane/types";
// components
import { FilterSubmenu } from "@/components/common/filters/filter-submenu";

type Props = {
  appliedFilters: TModuleStatus[] | null;
  handleUpdate: (val: string) => void;
};

export const FilterStatus = observer(function FilterStatus(props: Props) {
  const { appliedFilters, handleUpdate } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const options = MODULE_STATUS.map((status) => ({
    value: status.value,
    label: t(status.i18n_label),
    icon: <ModuleStatusIcon status={status.value} />,
  }));

  return <FilterSubmenu label="Status" options={options} appliedFilters={appliedFilters} onToggle={handleUpdate} />;
});
