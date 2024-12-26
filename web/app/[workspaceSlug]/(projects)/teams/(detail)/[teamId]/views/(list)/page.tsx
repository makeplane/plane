"use client";

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane types
import { TViewFilterProps } from "@plane/types";
// constants
import { Tabs } from "@plane/ui";
import { ViewAppliedFiltersList } from "@/components/views/applied-filters";
import { EViewAccess } from "@/constants/views";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// plane web components
import { TeamViewsList } from "@/plane-web/components/teams/views";
// plane web hooks
import { useTeamViews } from "@/plane-web/hooks/store";

const TeamViewsPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamId: routerTeamId } = useParams();
  const workspaceSlug = routerWorkspaceSlug!.toString();
  const teamId = routerTeamId!.toString();
  // store hooks
  const { getTeamViewsLoader, getTeamViewsFilters, fetchTeamViews, updateTeamScope, updateFilters, clearAllFilters } =
    useTeamViews();
  // derived values
  const teamViewsLoader = getTeamViewsLoader(teamId);
  const teamViewsFilters = getTeamViewsFilters(teamId);
  const isFiltersApplied = calculateTotalFilters(teamViewsFilters?.filters ?? {}) !== 0;
  // fetch team views
  useSWR(
    workspaceSlug && teamId ? ["teamViews", workspaceSlug, teamId] : null,
    () => (workspaceSlug && teamId ? fetchTeamViews(workspaceSlug, teamId) : null),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  // handlers
  const handleRemoveFilter = useCallback(
    (key: keyof TViewFilterProps, value: string | EViewAccess | null) => {
      let newValues = teamViewsFilters?.filters?.[key];

      if (key === "favorites") {
        newValues = !!value;
      }
      if (Array.isArray(newValues)) {
        if (!value) newValues = [];
        else newValues = newValues.filter((val) => val !== value) as string[];
      }

      updateFilters(teamId, "filters", {
        ...teamViewsFilters?.filters,
        [key]: newValues,
      });
    },
    [teamId, teamViewsFilters?.filters, updateFilters]
  );

  if (!workspaceSlug || !teamId) return <></>;

  const TEAM_VIEWS_TABS = useMemo(
    () => [
      {
        key: "teams",
        label: "Teams",
        content: <TeamViewsList teamId={teamId} />,
        onClick: () => updateTeamScope(workspaceSlug, teamId, "teams"),
        disabled: teamViewsLoader === "init-loader",
      },
      {
        key: "projects",
        label: "Projects",
        content: <TeamViewsList teamId={teamId} />,
        onClick: () => updateTeamScope(workspaceSlug, teamId, "projects"),
        disabled: teamViewsLoader === "init-loader",
      },
    ],
    [workspaceSlug, teamId, teamViewsLoader, updateTeamScope]
  );

  return (
    <div className="flex w-full h-full">
      <Tabs
        tabs={TEAM_VIEWS_TABS}
        storageKey={`teams-views-${teamId}`}
        defaultTab="teams"
        size="sm"
        tabListContainerClassName="px-6 py-2 border-b border-custom-border-200 divide-x divide-custom-border-200"
        tabListClassName="my-2 max-w-36"
        tabPanelClassName="h-full w-full overflow-hidden overflow-y-auto"
        storeInLocalStorage={false}
        actions={
          <div className="px-4">
            {isFiltersApplied && (
              <ViewAppliedFiltersList
                appliedFilters={teamViewsFilters?.filters ?? {}}
                handleClearAllFilters={() => clearAllFilters(teamId)}
                handleRemoveFilter={handleRemoveFilter}
                alwaysAllowEditing
              />
            )}
          </div>
        }
      />
    </div>
  );
});

export default TeamViewsPage;
