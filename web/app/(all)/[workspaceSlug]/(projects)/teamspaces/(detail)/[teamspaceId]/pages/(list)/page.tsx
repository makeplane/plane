"use client";

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane types
import { ETeamspaceEntityScope } from "@plane/constants";
import { TPageFilterProps } from "@plane/types";
// constants
import { Tabs } from "@plane/ui";
import { PageAppliedFiltersList } from "@/components/pages";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// plane web imports
import { TeamspacePagesList } from "@/plane-web/components/teamspaces/pages";
import { getTeamspaceEntityScopeLabel } from "@/plane-web/helpers/teamspace-helper";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.TEAMSPACE;

const TeamspacePagesPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId } = useParams();
  const workspaceSlug = routerWorkspaceSlug!.toString();
  const teamspaceId = routerTeamSpaceId!.toString();
  // store hooks
  const {
    getTeamspacePagesScope,
    getTeamspacePagesLoader,
    getTeamspacePagesFilters,
    updateTeamScope,
    updateFilters,
    clearAllFilters,
  } = usePageStore(storeType);
  // derived values
  const teamspacePagesScope = getTeamspacePagesScope(teamspaceId);
  const teamspacePagesLoader = getTeamspacePagesLoader(teamspaceId);
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

  const TEAM_VIEWS_TABS = useMemo(
    () => [
      {
        key: ETeamspaceEntityScope.TEAM,
        label: getTeamspaceEntityScopeLabel(ETeamspaceEntityScope.TEAM),
        content: <TeamspacePagesList teamspaceId={teamspaceId} />,
        onClick: () => updateTeamScope(workspaceSlug, teamspaceId, ETeamspaceEntityScope.TEAM),
        disabled: teamspacePagesLoader === "init-loader",
      },
      {
        key: ETeamspaceEntityScope.PROJECT,
        label: getTeamspaceEntityScopeLabel(ETeamspaceEntityScope.PROJECT),
        content: <TeamspacePagesList teamspaceId={teamspaceId} />,
        onClick: () => updateTeamScope(workspaceSlug, teamspaceId, ETeamspaceEntityScope.PROJECT),
        disabled: teamspacePagesLoader === "init-loader",
      },
    ],
    [workspaceSlug, teamspaceId, teamspacePagesLoader, updateTeamScope]
  );

  return (
    <div className="flex w-full h-full">
      <Tabs
        tabs={TEAM_VIEWS_TABS}
        storageKey={`teamspace-pages-${teamspaceId}`}
        defaultTab={teamspacePagesScope}
        size="sm"
        tabListContainerClassName="px-6 py-2 border-b border-custom-border-200 divide-x divide-custom-border-200"
        tabListClassName="my-2 max-w-36"
        tabPanelClassName="h-full w-full overflow-hidden overflow-y-auto"
        storeInLocalStorage={false}
        actions={
          <div className="px-4">
            {isFiltersApplied && (
              <PageAppliedFiltersList
                appliedFilters={teamspacePagesFilters?.filters ?? {}}
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

export default TeamspacePagesPage;
