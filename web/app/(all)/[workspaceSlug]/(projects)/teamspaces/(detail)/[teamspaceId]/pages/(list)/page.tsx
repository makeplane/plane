"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane types
import { TPageFilterProps } from "@plane/types";
// constants
import { PageAppliedFiltersList } from "@/components/pages";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// plane web imports
import { TeamspacePagesList } from "@/plane-web/components/teamspaces/pages";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.TEAMSPACE;

const TeamspacePagesPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId } = useParams();
  const workspaceSlug = routerWorkspaceSlug!.toString();
  const teamspaceId = routerTeamSpaceId!.toString();
  // store hooks
  const { getTeamspacePagesFilters, updateFilters, clearAllFilters } = usePageStore(storeType);
  // derived values
  const teamspacePagesFilters = getTeamspacePagesFilters(teamspaceId);
  const isFiltersApplied = calculateTotalFilters(teamspacePagesFilters?.filters ?? {}) !== 0;

  // handlers
  const handleRemoveFilter = useCallback(
    (key: keyof TPageFilterProps, value: string | null) => {
      let newValues = teamspacePagesFilters?.filters?.[key];
      if (key === "favorites") newValues = !!value;
      if (Array.isArray(newValues)) {
        if (!value) newValues = [];
        else newValues = newValues.filter((val) => val !== value);
      }
      updateFilters(teamspaceId, "filters", {
        ...teamspacePagesFilters?.filters,
        [key]: newValues,
      });
    },
    [teamspaceId, teamspacePagesFilters?.filters, updateFilters]
  );

  if (!workspaceSlug || !teamspaceId) return <></>;

  return (
    <div className="flex flex-col w-full h-full">
      {isFiltersApplied && (
        <div className="w-full px-6 py-3 border-b border-custom-border-200">
          <PageAppliedFiltersList
            appliedFilters={teamspacePagesFilters?.filters ?? {}}
            handleClearAllFilters={() => clearAllFilters(teamspaceId)}
            handleRemoveFilter={handleRemoveFilter}
            alwaysAllowEditing
          />
        </div>
      )}
      <TeamspacePagesList teamspaceId={teamspaceId} />
    </div>
  );
});

export default TeamspacePagesPage;
