import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ListFilter } from "lucide-react";
// plane imports
import { ETeamspaceEntityScope, EPageAccess } from "@plane/constants";
import { TPageFilters } from "@plane/types";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { FiltersDropdown } from "@/components/issues";
import { PageFiltersSelection, PageOrderByDropdown, PageSearchInput } from "@/components/pages";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { EPageStoreType, usePageStore, useTeamspaces } from "@/plane-web/hooks/store";

type TeamspacePagesListHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspacePagesListHeaderActions = observer((props: TeamspacePagesListHeaderActionsProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // plane web hooks
  const { getTeamspaceMemberIds } = useTeamspaces();
  const {
    getTeamspacePagesScope,
    getTeamspacePagesFilters,
    updateFilters: updateTeamspaceFilters,
    createPage,
  } = usePageStore(EPageStoreType.TEAMSPACE);
  // derived values
  const teamspacePagesScope = getTeamspacePagesScope(teamspaceId);
  const filters = getTeamspacePagesFilters(teamspaceId);
  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;
  const teamspaceMemberIds = getTeamspaceMemberIds(teamspaceId);
  // handlers
  const updateFilters = useCallback(
    <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => {
      updateTeamspaceFilters(teamspaceId, filterKey, filterValue);
    },
    [updateTeamspaceFilters, teamspaceId]
  );

  const handleCreatePage = async () => {
    setIsCreatingPage(true);
    // Create page
    await createPage({
      access: EPageAccess.PUBLIC,
    })
      .then((res) => {
        const pageRedirectionLink = `/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${res?.id}`;
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

  if (!workspaceSlug || !teamspaceId || !filters) return;

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
          memberIds={teamspaceMemberIds ?? undefined}
        />
      </FiltersDropdown>
      {isEditingAllowed && teamspacePagesScope === ETeamspaceEntityScope.TEAM && (
        <Button variant="primary" size="sm" onClick={handleCreatePage} loading={isCreatingPage}>
          {isCreatingPage ? "Adding" : "Add page"}
        </Button>
      )}
    </>
  );
});
