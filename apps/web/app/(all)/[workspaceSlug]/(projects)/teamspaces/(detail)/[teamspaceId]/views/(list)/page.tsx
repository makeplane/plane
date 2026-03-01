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

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EViewAccess, TViewFilterProps } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// constants
import { ViewAppliedFiltersList } from "@/components/views/applied-filters";
// plane web imports
import { TeamspaceViewsList } from "@/components/teamspaces/views/views-list";
import { useTeamspaceViews } from "@/plane-web/hooks/store";
import type { Route } from "./+types/page";

function TeamspaceViewsPage({ params }: Route.ComponentProps) {
  const { teamspaceId } = params;
  // store hooks
  const { getTeamspaceViewsFilters, updateFilters, clearAllFilters } = useTeamspaceViews();
  // derived values
  const teamspaceViewsFilters = getTeamspaceViewsFilters(teamspaceId);
  const isFiltersApplied = calculateTotalFilters(teamspaceViewsFilters?.filters ?? {}) !== 0;

  // handlers
  const handleRemoveFilter = useCallback(
    (key: keyof TViewFilterProps, value: string | EViewAccess | null) => {
      let newValues = teamspaceViewsFilters?.filters?.[key];

      if (key === "favorites") {
        newValues = !!value;
      }
      if (Array.isArray(newValues)) {
        if (!value) newValues = [];
        else newValues = newValues.filter((val) => val !== value) as string[];
      }

      updateFilters(teamspaceId, "filters", {
        ...teamspaceViewsFilters?.filters,
        [key]: newValues,
      });
    },
    [teamspaceId, teamspaceViewsFilters?.filters, updateFilters]
  );

  return (
    <div className="flex flex-col w-full h-full">
      {isFiltersApplied && (
        <div className="w-full px-6 py-3 border-b border-subtle-1">
          <ViewAppliedFiltersList
            appliedFilters={teamspaceViewsFilters?.filters ?? {}}
            handleClearAllFilters={() => clearAllFilters(teamspaceId)}
            handleRemoveFilter={handleRemoveFilter}
            alwaysAllowEditing
          />
        </div>
      )}
      <div className="h-full w-full overflow-hidden overflow-y-auto">
        <TeamspaceViewsList teamspaceId={teamspaceId} />
      </div>
    </div>
  );
}

export default observer(TeamspaceViewsPage);
