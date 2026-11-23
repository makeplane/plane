/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
import type { IIssueLabel } from "@plane/types";
// components
import { FilterSubmenu } from "@/components/common/filters/filter-submenu";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  labels: IIssueLabel[] | undefined;
};

export const FilterLabels = observer(function FilterLabels(props: Props) {
  const { appliedFilters, handleUpdate, labels } = props;

  const options = useMemo(
    () =>
      sortBy(labels ?? [], [(label) => label.name.toLowerCase()]).map((label) => ({
        value: label.id,
        label: label.name,
        icon: <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />,
      })),
    [labels]
  );

  return (
    <FilterSubmenu label="Label" options={options} appliedFilters={appliedFilters} onToggle={handleUpdate} searchable />
  );
});
