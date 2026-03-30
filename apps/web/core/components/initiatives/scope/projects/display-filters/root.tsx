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
import type { TInitiativeScopeProjectGroupBy } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// local imports
import { ProjectDisplayFilterGroupBy } from "./group-by";

type Props = {
  activeLayout?: EIssueLayoutTypes;
  projectGroupBy: TInitiativeScopeProjectGroupBy;
  handleProjectGroupByChange: (groupBy: TInitiativeScopeProjectGroupBy) => void;
};

export const InitiativeScopeProjectsDisplayFilters = observer(function InitiativeScopeProjectsDisplayFilters(
  props: Props
) {
  const { activeLayout, projectGroupBy, handleProjectGroupByChange } = props;

  return (
    <FiltersDropdown title="Display" placement="bottom-end">
      <div className="vertical-scrollbar scrollbar-sm relative h-full w-full divide-y divide-subtle-1 overflow-hidden overflow-y-auto px-2.5">
        <div className="py-2">
          <ProjectDisplayFilterGroupBy
            activeLayout={activeLayout}
            projectGroupBy={projectGroupBy}
            handleProjectGroupByChange={handleProjectGroupByChange}
          />
        </div>
      </div>
    </FiltersDropdown>
  );
});
