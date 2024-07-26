import { FC, RefObject, useCallback, useEffect, useState } from "react";
import useSWR from "swr";
// ui
import { Loader } from "@plane/ui";
// components
import { WORKSPACE_ACTIVE_CYCLES_LIST } from "@/constants/fetch-keys";
// hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
// plane web components
import { WorkspaceActiveCyclesUpgrade } from "@/plane-web/components/active-cycles/";
import { ActiveCycleInfoCard } from "@/plane-web/components/cycles/active-cycles";
// constants
// services
import { CycleService } from "@/services/cycle.service";

const cycleService = new CycleService();
const DEFAULT_LIMIT = 3;

export type ActiveCyclesListPageProps = {
  workspaceSlug: string;
  cursor: string;
  perPage: number;
  updateTotalPages: (count: number) => void;
  updateResultsCount: (count: number) => void;
  containerRef: RefObject<HTMLDivElement | null>;
};

export const ActiveCyclesListPage: FC<ActiveCyclesListPageProps> = (props) => {
  const { workspaceSlug, cursor, perPage, updateTotalPages, updateResultsCount, containerRef } = props;
  const [cyclesInView, setCyclesInView] = useState<number>(DEFAULT_LIMIT);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  // fetching active cycles in workspace
  const { data: workspaceActiveCycles, error } = useSWR(
    workspaceSlug && cursor ? WORKSPACE_ACTIVE_CYCLES_LIST(workspaceSlug as string, cursor, `${perPage}`) : null,
    workspaceSlug && cursor
      ? () => cycleService.workspaceActiveCycles(workspaceSlug.toString(), cursor, perPage)
      : null,
    {
      revalidateOnFocus: false,
    }
  );

  const handleLoadMore = useCallback(() => {
    setCyclesInView((state) => state + DEFAULT_LIMIT);
  }, []);

  useEffect(() => {
    if (workspaceActiveCycles) {
      updateTotalPages(workspaceActiveCycles.total_pages);
      updateResultsCount(workspaceActiveCycles.results.length);
    }
  }, [updateTotalPages, updateResultsCount, workspaceActiveCycles]);

  if (error) {
    if (error.error_code === 1999) return <WorkspaceActiveCyclesUpgrade />;
    else throw Error(error.error);
  }
  useIntersectionObserver(containerRef, elementRef, handleLoadMore);

  if (!workspaceActiveCycles) {
    return Array.from({ length: 3 }).map((_, index) => (
      <Loader className="px-5 pt-5 last:pb-5" key={index}>
        <Loader.Item height="256px" width="100%" />
      </Loader>
    ));
  }
  return (
    <div>
      {workspaceActiveCycles.results.slice(0, cyclesInView).map((cycle: any) => (
        <div key={cycle.id} className="px-5 pt-5 last:pb-5">
          <ActiveCycleInfoCard workspaceSlug={workspaceSlug?.toString()} projectId={cycle.project_id} cycle={cycle} />
        </div>
      ))}
      {cyclesInView < workspaceActiveCycles.results.length && workspaceActiveCycles.results.length > 0 && (
        <div ref={setElementRef} className="p-5">
          <div className="flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded md:px-1 px-4 py-1.5 bg-custom-background-80 animate-pulse" />
        </div>
      )}
    </div>
  );
};
