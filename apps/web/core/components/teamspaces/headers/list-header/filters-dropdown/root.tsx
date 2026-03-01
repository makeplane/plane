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

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { ListFilter, Search } from "lucide-react";
import { CloseIcon } from "@plane/propel/icons";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";

type TTeamListFiltersDropdown = {
  menuButton?: React.ReactNode;
};

export const TeamListFiltersDropdown = observer(function TeamListFiltersDropdown(props: TTeamListFiltersDropdown) {
  const { menuButton } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  // derived values
  const isFiltersApplied = false; // TODO: Add filters

  return (
    <FiltersDropdown
      icon={<ListFilter className="h-3 w-3" />}
      title="Filters"
      placement="bottom-end"
      isFiltersApplied={isFiltersApplied}
      menuButton={menuButton}
    >
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="bg-surface-1 p-2.5 pb-0">
          <div className="flex items-center gap-1.5 rounded-sm border-[0.5px] border-subtle-1 bg-layer-1 px-1.5 py-1 text-caption-sm-medium">
            <Search className="text-placeholder" size={12} strokeWidth={2} />
            <input
              type="text"
              className="w-full bg-layer-1 outline-none placeholder:text-placeholder"
              placeholder="Search"
              value={filtersSearchQuery}
              onChange={(e) => setFiltersSearchQuery(e.target.value)}
              autoFocus
            />
            {filtersSearchQuery !== "" && (
              <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
                <CloseIcon className="text-tertiary" height={12} width={12} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        <div className="h-full w-full divide-y divide-subtle-1 overflow-y-auto px-2.5 vertical-scrollbar scrollbar-sm">
          {/* TODO: Add filters */}
        </div>
      </div>
    </FiltersDropdown>
  );
});
