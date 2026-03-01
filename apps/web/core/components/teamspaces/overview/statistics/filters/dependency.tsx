/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import type { ERelationType } from "@plane/constants";
import { ChevronDownIcon } from "@plane/propel/icons";
// plane imports
import { Dropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { TEAM_STATISTICS_DEPENDENCY_MAP } from "@/constants/teamspace";
import type { TStatisticsFilterProps } from "@/types/teamspace";

export const StatisticsDependencyFilter = observer(function StatisticsDependencyFilter(
  props: TStatisticsFilterProps<"dependency_type">
) {
  const { value, isLoading, buttonContainerClassName, chevronClassName, handleFilterChange } = props;
  // derived values
  const options = Object.entries(TEAM_STATISTICS_DEPENDENCY_MAP).map(([data, value]) => ({
    data,
    value,
  }));

  return (
    <Dropdown
      value={value ?? ""}
      options={options}
      onChange={(val) => handleFilterChange(val === value ? undefined : (val as ERelationType))}
      keyExtractor={(option) => option.data}
      buttonContainerClassName={buttonContainerClassName}
      buttonContent={(isOpen, val) => (
        <span className="flex items-center gap-1">
          {val && typeof val === "string" ? TEAM_STATISTICS_DEPENDENCY_MAP[val as ERelationType] : "Dependency"}
          <ChevronDownIcon className={cn(chevronClassName, isOpen ? "rotate-180" : "rotate-0")} />
        </span>
      )}
      disableSearch
      disabled={isLoading}
    />
  );
});
