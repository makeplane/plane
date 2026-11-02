/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentProps } from "react";
import { FilterOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// local imports
import { ModuleFiltersSelection } from "./root";

type Props = ComponentProps<typeof ModuleFiltersSelection> & {
  isFiltersApplied?: boolean;
  /** Renders the trigger as the icon-only Filters button. */
  iconOnly?: boolean;
};

export function ModuleFiltersDropdown({ isFiltersApplied = false, iconOnly = false, ...selectionProps }: Props) {
  const { t } = useTranslation();

  return (
    <FiltersDropdown
      icon={<FilterOutline className="h-3 w-3" />}
      title={t("common.filters")}
      placement="bottom-end"
      isFiltersApplied={isFiltersApplied}
      iconOnly={iconOnly}
    >
      <ModuleFiltersSelection {...selectionProps} />
    </FiltersDropdown>
  );
}
