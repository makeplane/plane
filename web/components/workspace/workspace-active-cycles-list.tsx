import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// import { useTheme } from "next-themes";
// ui
import { Button } from "@plane/ui";
// components
import { ActiveCyclesListPage } from "@/components/cycles/active-cycles";
// import { EmptyState, getEmptyStateImagePath } from "@/components/empty-state";
// constants
// import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
// import { useUser } from "@/hooks/store";

const perPage = 3;

export const WorkspaceActiveCyclesList = observer(() => {
  // state
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0); // workspaceActiveCycles.results.length
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // theme
  // const { resolvedTheme } = useTheme();
  // store
  // const {
  //   membership: { currentWorkspaceRole },
  //   currentUser,
  // } = useUser();

  const activeCyclesPages = [];

  const updateTotalPages = (count: number) => {
    setTotalPages(count);
  };

  const updateResultsCount = (count: number) => {
    setResultsCount(count);
  };

  const handleLoadMore = () => {
    setPageCount(pageCount + 1);
  };

  if (!workspaceSlug) {
    return null;
  }

  for (let i = 1; i <= pageCount; i++) {
    activeCyclesPages.push(
      <ActiveCyclesListPage
        cursor={`${perPage}:${i - 1}:0`}
        perPage={perPage}
        workspaceSlug={workspaceSlug.toString()}
        updateTotalPages={updateTotalPages}
        updateResultsCount={updateResultsCount}
        key={i}
      />
    );
  }
  // const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  // const EmptyStateImagePath = getEmptyStateImagePath("onboarding", "workspace-active-cycles", isLightMode);

  // const isEditingAllowed = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <div className="h-full w-full bg-custom-background-90">
      {activeCyclesPages}

      {pageCount < totalPages && resultsCount !== 0 && (
        <div className="flex items-center justify-center gap-4 text-xs w-full py-5">
          <Button variant="outline-primary" size="sm" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}

      {/* {resultsCount === 0 && (
        <EmptyState
          image={EmptyStateImagePath}
          title="No active cycles"
          description="Cycles of your projects that includes any period that encompasses today's date within its range. Find the progress and details of all your active cycle here."
          size="lg"
          disabled={!isEditingAllowed}
        />
      )} */}
    </div>
  );
});
