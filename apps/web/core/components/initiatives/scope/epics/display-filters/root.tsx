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
// plane imports
import type { TInitiativeScopeEpicGroupBy } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// local imports
import { EpicDisplayFilterGroupBy } from "./group-by";

type Props = {
  activeLayout?: EIssueLayoutTypes;
  epicGroupBy: TInitiativeScopeEpicGroupBy;
  handleEpicGroupByChange: (groupBy: TInitiativeScopeEpicGroupBy) => void;
};

export const InitiativeScopeEpicsDisplayFilters = observer(function InitiativeScopeEpicsDisplayFilters(props: Props) {
  const { activeLayout, epicGroupBy, handleEpicGroupByChange } = props;

  return (
    <FiltersDropdown title="Display" placement="bottom-end">
      <div className="vertical-scrollbar scrollbar-sm relative h-full w-full divide-y divide-subtle-1 overflow-hidden overflow-y-auto px-2.5">
        <div className="py-2">
          <EpicDisplayFilterGroupBy
            activeLayout={activeLayout}
            epicGroupBy={epicGroupBy}
            handleEpicGroupByChange={handleEpicGroupByChange}
          />
        </div>
      </div>
    </FiltersDropdown>
  );
});
