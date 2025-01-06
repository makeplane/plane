"use client";

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ETeamEntityScope } from "@plane/constants";
import { TViewFilterProps } from "@plane/types";
// constants
import { Tabs } from "@plane/ui";
import { ViewAppliedFiltersList } from "@/components/views/applied-filters";
import { EViewAccess } from "@/constants/views";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// plane web imports
import { TeamViewsList } from "@/plane-web/components/teams/views";
import { getTeamEntityScopeLabel } from "@/plane-web/helpers/team-helper";
import { useTeamViews } from "@/plane-web/hooks/store";

const TeamViewsPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamId: routerTeamId } = useParams();
  const workspaceSlug = routerWorkspaceSlug!.toString();
  const teamId = routerTeamId!.toString();
  // store hooks
  const {
    getTeamViewsScope,
    getTeamViewsLoader,
    getTeamViewsFilters,
    fetchTeamViews,
    updateTeamScope,
    updateFilters,
    clearAllFilters,
  } = useTeamViews();
  // derived values
  const teamViewsScope = getTeamViewsScope(teamId);
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
        key: ETeamEntityScope.TEAM,
        label: getTeamEntityScopeLabel(ETeamEntityScope.TEAM),
        content: <TeamViewsList teamId={teamId} />,
        onClick: () => updateTeamScope(workspaceSlug, teamId, ETeamEntityScope.TEAM),
        disabled: teamViewsLoader === "init-loader",
      },
      {
        key: ETeamEntityScope.PROJECT,
        label: getTeamEntityScopeLabel(ETeamEntityScope.PROJECT),
        content: <TeamViewsList teamId={teamId} />,
        onClick: () => updateTeamScope(workspaceSlug, teamId, ETeamEntityScope.PROJECT),
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
        defaultTab={teamViewsScope}
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
