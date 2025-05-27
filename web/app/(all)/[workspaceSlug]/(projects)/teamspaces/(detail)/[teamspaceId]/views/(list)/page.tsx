"use client";

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ETeamspaceEntityScope, EViewAccess } from "@plane/constants";
import { TViewFilterProps } from "@plane/types";
// constants
import { Tabs } from "@plane/ui";
import { ViewAppliedFiltersList } from "@/components/views/applied-filters";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// plane web imports
import { TeamspaceViewsList } from "@/plane-web/components/teamspaces/views";
import { getTeamspaceEntityScopeLabel } from "@/plane-web/helpers/teamspace-helper";
import { useTeamspaceViews } from "@/plane-web/hooks/store";

const TeamspaceViewsPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId } = useParams();
  const workspaceSlug = routerWorkspaceSlug!.toString();
  const teamspaceId = routerTeamSpaceId!.toString();
  // store hooks
  const {
    getTeamspaceViewsScope,
    getTeamspaceViewsLoader,
    getTeamspaceViewsFilters,
    fetchTeamspaceViews,
    updateTeamScope,
    updateFilters,
    clearAllFilters,
  } = useTeamspaceViews();
  // derived values
  const teamspaceViewsScope = getTeamspaceViewsScope(teamspaceId);
  const teamspaceViewsLoader = getTeamspaceViewsLoader(teamspaceId);
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

  const TEAM_VIEWS_TABS = useMemo(
    () => [
      {
        key: ETeamspaceEntityScope.TEAM,
        label: getTeamspaceEntityScopeLabel(ETeamspaceEntityScope.TEAM),
        content: <TeamspaceViewsList teamspaceId={teamspaceId} />,
        onClick: () => updateTeamScope(workspaceSlug, teamspaceId, ETeamspaceEntityScope.TEAM),
        disabled: teamspaceViewsLoader === "init-loader",
      },
      {
        key: ETeamspaceEntityScope.PROJECT,
        label: getTeamspaceEntityScopeLabel(ETeamspaceEntityScope.PROJECT),
        content: <TeamspaceViewsList teamspaceId={teamspaceId} />,
        onClick: () => updateTeamScope(workspaceSlug, teamspaceId, ETeamspaceEntityScope.PROJECT),
        disabled: teamspaceViewsLoader === "init-loader",
      },
    ],
    [workspaceSlug, teamspaceId, teamspaceViewsLoader, updateTeamScope]
  );

  return (
    <div className="flex w-full h-full">
      <Tabs
        tabs={TEAM_VIEWS_TABS}
        storageKey={`teamspace-views-${teamspaceId}`}
        defaultTab={teamspaceViewsScope}
        size="sm"
        tabListContainerClassName="px-6 py-2 border-b border-custom-border-200 divide-x divide-custom-border-200"
        tabListClassName="my-2 max-w-36"
        tabPanelClassName="h-full w-full overflow-hidden overflow-y-auto"
        storeInLocalStorage={false}
        actions={
          <div className="px-4">
            {isFiltersApplied && (
              <ViewAppliedFiltersList
                appliedFilters={teamspaceViewsFilters?.filters ?? {}}
                handleClearAllFilters={() => clearAllFilters(teamspaceId)}
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

export default TeamspaceViewsPage;
