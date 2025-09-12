import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ListFilter } from "lucide-react";
// plane imports
import { EPageAccess, TEAMSPACE_PAGE_TRACKER_ELEMENTS, TEAMSPACE_PAGE_TRACKER_EVENTS } from "@plane/constants";
import { TPageFilters } from "@plane/types";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
import { calculateTotalFilters } from "@plane/utils";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { PageFiltersSelection } from "@/components/pages/list/filters";
import { PageOrderByDropdown } from "@/components/pages/list/order-by";
import { PageSearchInput } from "@/components/pages/list/search-input";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
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
  const { filters, updateFilters, createPage } = usePageStore(EPageStoreType.TEAMSPACE);
  // derived values
  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;
  const teamspaceMemberIds = getTeamspaceMemberIds(teamspaceId);
  // handlers
  const handleFiltersUpdate = useCallback(
    <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => {
      updateFilters(filterKey, filterValue);
    },
    [updateFilters]
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
        captureSuccess({
          eventName: TEAMSPACE_PAGE_TRACKER_EVENTS.PAGE_CREATE,
          payload: {
            id: res?.id,
            teamspaceId,
          },
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        });
        captureError({
          eventName: TEAMSPACE_PAGE_TRACKER_EVENTS.PAGE_CREATE,
          payload: {
            teamspaceId,
          },
        });
      })
      .finally(() => setIsCreatingPage(false));
  };

  if (!workspaceSlug || !teamspaceId || !filters) return;

  return (
    <>
      <PageSearchInput
        searchQuery={filters.searchQuery}
        updateSearchQuery={(val) => handleFiltersUpdate("searchQuery", val)}
      />
      <PageOrderByDropdown
        sortBy={filters.sortBy}
        sortKey={filters.sortKey}
        onChange={(val) => {
          if (val.key) handleFiltersUpdate("sortKey", val.key);
          if (val.order) handleFiltersUpdate("sortBy", val.order);
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
          handleFiltersUpdate={handleFiltersUpdate}
          memberIds={teamspaceMemberIds ?? undefined}
        />
      </FiltersDropdown>
      {isEditingAllowed && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreatePage}
          loading={isCreatingPage}
          data-ph-element={TEAMSPACE_PAGE_TRACKER_ELEMENTS.HEADER_CREATE_PAGE_BUTTON}
        >
          {isCreatingPage ? "Adding" : "Add page"}
        </Button>
      )}
    </>
  );
});
