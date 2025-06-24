"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EViewAccess } from "@plane/constants";
import { TViewFilterProps } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// constants
import { ViewAppliedFiltersList } from "@/components/views/applied-filters";
// plane web imports
import { TeamspaceViewsList } from "@/plane-web/components/teamspaces/views";
import { useTeamspaceViews } from "@/plane-web/hooks/store";

const TeamspaceViewsPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId } = useParams();
  const workspaceSlug = routerWorkspaceSlug!.toString();
  const teamspaceId = routerTeamSpaceId!.toString();
  // store hooks
  const { getTeamspaceViewsFilters, fetchTeamspaceViews, updateFilters, clearAllFilters } = useTeamspaceViews();
  // derived values
  const teamspaceViewsFilters = getTeamspaceViewsFilters(teamspaceId);
  const isFiltersApplied = calculateTotalFilters(teamspaceViewsFilters?.filters ?? {}) !== 0;
  // fetch teamspace views
  useSWR(
    workspaceSlug && teamspaceId ? ["teamspaceViews", workspaceSlug, teamspaceId] : null,
    () => (workspaceSlug && teamspaceId ? fetchTeamspaceViews(workspaceSlug, teamspaceId) : null),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

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

  if (!workspaceSlug || !teamspaceId) return <></>;

  return (
    <div className="flex flex-col w-full h-full">
      {isFiltersApplied && (
        <div className="w-full px-6 py-3 border-b border-custom-border-200">
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
});

export default TeamspaceViewsPage;
