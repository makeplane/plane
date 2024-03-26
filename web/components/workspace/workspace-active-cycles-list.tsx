import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { Button } from "@plane/ui";
import { ActiveCyclesListPage } from "@/components/active-cycles";
import { EmptyStateType } from "@/constants/empty-state";
import { EmptyState } from "../empty-state";

const perPage = 3;

export const WorkspaceActiveCyclesList = observer(() => {
  // state
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0); // workspaceActiveCycles.results.length
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

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

  return (
    <div className="h-full w-full overflow-y-scroll bg-custom-background-90 vertical-scrollbar scrollbar-md">
      {activeCyclesPages}

      {pageCount < totalPages && resultsCount !== 0 && (
        <div className="flex items-center justify-center gap-4 text-xs w-full py-5">
          <Button variant="outline-primary" size="sm" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}

      <EmptyState type={EmptyStateType.WORKSPACE_ACTIVE_CYCLES} />
    </div>
  );
});
