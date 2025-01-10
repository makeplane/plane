import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ListFilter } from "lucide-react";
// plane imports
import { ETeamEntityScope } from "@plane/constants";
import { TPageFilters } from "@plane/types";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { FiltersDropdown } from "@/components/issues";
import { PageFiltersSelection, PageOrderByDropdown, PageSearchInput } from "@/components/pages";
// constants
import { EPageAccess } from "@/constants/page";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useTeamPages, useTeams } from "@/plane-web/hooks/store";

type TeamPagesListHeaderActionsProps = {
  teamId: string;
  isEditingAllowed: boolean;
};

export const TeamPagesListHeaderActions = observer((props: TeamPagesListHeaderActionsProps) => {
  const { teamId, isEditingAllowed } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // plane web hooks
  const { getTeamMemberIds } = useTeams();
  const { getTeamPagesScope, getTeamPagesFilters, updateFilters: updateTeamFilters, createPage } = useTeamPages();
  // derived values
  const teamPagesScope = getTeamPagesScope(teamId);
  const filters = getTeamPagesFilters(teamId);
  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;
  const teamMemberIds = getTeamMemberIds(teamId);
  // handlers
  const updateFilters = useCallback(
    <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => {
      updateTeamFilters(teamId, filterKey, filterValue);
    },
    [updateTeamFilters, teamId]
  );

  const handleCreatePage = async () => {
    setIsCreatingPage(true);
    // Create page
    await createPage(workspaceSlug, teamId, {
      access: EPageAccess.PUBLIC,
    })
      .then((res) => {
        const pageRedirectionLink = `/${workspaceSlug}/teams/${teamId}/pages/${res?.id}`;
        router.push(pageRedirectionLink);
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        })
      )
      .finally(() => setIsCreatingPage(false));
  };

  if (!workspaceSlug || !teamId || !filters) return;

  return (
    <>
      <PageSearchInput
        searchQuery={filters.searchQuery}
        updateSearchQuery={(val) => updateFilters("searchQuery", val)}
      />
      <PageOrderByDropdown
        sortBy={filters.sortBy}
        sortKey={filters.sortKey}
        onChange={(val) => {
          if (val.key) updateFilters("sortKey", val.key);
          if (val.order) updateFilters("sortBy", val.order);
        }}
      />
      <FiltersDropdown
        icon={<ListFilter className="h-3 w-3" />}
        title="Filters"
        placement="bottom-end"
        isFiltersApplied={isFiltersApplied}
      >
        <PageFiltersSelection
          filters={filters}
          handleFiltersUpdate={updateFilters}
          memberIds={teamMemberIds ?? undefined}
        />
      </FiltersDropdown>
      {isEditingAllowed && teamPagesScope === ETeamEntityScope.TEAM && (
        <Button variant="primary" size="sm" onClick={handleCreatePage} loading={isCreatingPage}>
          {isCreatingPage ? "Adding" : "Add page"}
        </Button>
      )}
    </>
  );
});
