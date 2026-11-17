/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { NETWORK_CHOICES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { FilterSubmenu } from "@/components/common/filters/filter-submenu";
// local imports
import { ProjectNetworkIcon } from "../../project-network-icon";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
};

export const FilterAccess = observer(function FilterAccess(props: Props) {
  const { appliedFilters, handleUpdate } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const options = NETWORK_CHOICES.map((access) => ({
    value: `${access.key}`,
    label: t(access.i18n_label),
    icon: <ProjectNetworkIcon iconKey={access.iconKey} />,
  }));

  return <FilterSubmenu label="Access" options={options} appliedFilters={appliedFilters} onToggle={handleUpdate} />;
});
