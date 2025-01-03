"use client";

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane types
import { TPageFilterProps } from "@plane/types";
// constants
import { Tabs } from "@plane/ui";
import { PageAppliedFiltersList } from "@/components/pages";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// plane web components
import { TeamPagesList } from "@/plane-web/components/teams/pages";
// plane web hooks
import { useTeamPages } from "@/plane-web/hooks/store";

const TeamPagesPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamId: routerTeamId } = useParams();
  const workspaceSlug = routerWorkspaceSlug!.toString();
  const teamId = routerTeamId!.toString();
  // store hooks
  const { getTeamPagesLoader, getTeamPagesFilters, fetchTeamPages, updateTeamScope, updateFilters, clearAllFilters } =
    useTeamPages();
  // derived values
  const teamPagesLoader = getTeamPagesLoader(teamId);
  const teamPagesFilters = getTeamPagesFilters(teamId);
  const isFiltersApplied = calculateTotalFilters(teamPagesFilters?.filters ?? {}) !== 0;
  // fetch team pages
  useSWR(
    workspaceSlug && teamId ? ["teamPages", workspaceSlug, teamId] : null,
    () => (workspaceSlug && teamId ? fetchTeamPages(workspaceSlug, teamId) : null),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  // handlers
  const handleRemoveFilter = useCallback(
    (key: keyof TPageFilterProps, value: string | null) => {
      let newValues = teamPagesFilters?.filters?.[key];
      if (key === "favorites") newValues = !!value;
      if (Array.isArray(newValues)) {
        if (!value) newValues = [];
        else newValues = newValues.filter((val) => val !== value);
      }
      updateFilters(teamId, "filters", {
        ...teamPagesFilters?.filters,
        [key]: newValues,
      });
    },
    [teamId, teamPagesFilters?.filters, updateFilters]
  );

  if (!workspaceSlug || !teamId) return <></>;

  const TEAM_VIEWS_TABS = useMemo(
    () => [
      {
        key: "team",
        label: "Team",
        content: <TeamPagesList teamId={teamId} />,
        onClick: () => updateTeamScope(workspaceSlug, teamId, "teams"),
        disabled: teamPagesLoader === "init-loader",
      },
      {
        key: "project",
        label: "Project",
        content: <TeamPagesList teamId={teamId} />,
        onClick: () => updateTeamScope(workspaceSlug, teamId, "projects"),
        disabled: teamPagesLoader === "init-loader",
      },
    ],
    [workspaceSlug, teamId, teamPagesLoader, updateTeamScope]
  );

  return (
    <div className="flex w-full h-full">
      <Tabs
        tabs={TEAM_VIEWS_TABS}
        storageKey={`teams-pages-${teamId}`}
        defaultTab="teams"
        size="sm"
        tabListContainerClassName="px-6 py-2 border-b border-custom-border-200 divide-x divide-custom-border-200"
        tabListClassName="my-2 max-w-36"
        tabPanelClassName="h-full w-full overflow-hidden overflow-y-auto"
        storeInLocalStorage={false}
        actions={
          <div className="px-4">
            {isFiltersApplied && (
              <PageAppliedFiltersList
                appliedFilters={teamPagesFilters?.filters ?? {}}
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

export default TeamPagesPage;
