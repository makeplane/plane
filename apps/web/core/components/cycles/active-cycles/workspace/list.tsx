/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { uniqBy } from "lodash-es";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import type { IActiveCycle } from "@plane/types";
import { ContentWrapper, Loader } from "@plane/ui";
// components
// plane web components
import { WORKSPACE_ACTIVE_CYCLES_LIST } from "@/constants/fetch-keys";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

// services
import { CycleService } from "@/services/cycle.service";
import { WorkspaceActiveCycleCard } from "./card/root";

const perPage = 100;
const cycleService = new CycleService();
const DEFAULT_LIMIT = 3;

type TWorkspaceActiveCyclesList = {
  workspaceSlug: string;
};

export const WorkspaceActiveCyclesList = observer(function WorkspaceActiveCyclesList(
  props: TWorkspaceActiveCyclesList
) {
  const { workspaceSlug } = props;
  // ref
  const containerRef = useRef<HTMLDivElement>(null);
  // state
  const [pageCount, setPageCount] = useState(0);
  const [cycles, setCycles] = useState<IActiveCycle[] | null>();
  const [totalPages, setTotalPages] = useState(0);
  const [cyclesInView, setCyclesInView] = useState<number>(DEFAULT_LIMIT);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);
  // plane hooks
  const { t } = useTranslation();

  // fetching active cycles in workspace
  const { data: workspaceActiveCycles, isLoading } = useSWR(
    WORKSPACE_ACTIVE_CYCLES_LIST(workspaceSlug, `${perPage}:${pageCount}:0`, `${perPage}`),
    () => cycleService.workspaceActiveCycles(workspaceSlug.toString(), `${perPage}:${pageCount}:0`, perPage),
    {
      revalidateOnFocus: false,
    }
  );

  const handleLoadMore = () => {
    setPageCount((state) => state + 1);
    loadMoreCycles();
  };

  const updateTotalPages = (count: number) => {
    setTotalPages(count);
  };

  const loadMoreCycles = useCallback(() => {
    setCyclesInView((state) => state + DEFAULT_LIMIT);
  }, []);

  useEffect(() => {
    if (workspaceActiveCycles) {
      if (!totalPages) {
        updateTotalPages(workspaceActiveCycles.total_pages);
      }
      setCycles((state) =>
        state ? uniqBy([...state, ...workspaceActiveCycles.results], "id") : workspaceActiveCycles.results
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceActiveCycles]);

  useIntersectionObserver(containerRef, elementRef, loadMoreCycles);

  if (!cycles) {
    return Array.from({ length: 3 }).map((_, index) => (
      <Loader className="px-5 pt-5 last:pb-5" key={index}>
        <Loader.Item height="256px" width="100%" />
      </Loader>
    ));
  }

  return (
    <ContentWrapper ref={containerRef} className="space-y-4">
      {cycles.slice(0, cyclesInView).map((cycle) => (
        <WorkspaceActiveCycleCard
          key={cycle.id}
          workspaceSlug={workspaceSlug?.toString()}
          projectId={cycle.project_id}
          cycle={cycle}
        />
      ))}
      {cyclesInView < cycles.length && cycles.length > 0 && (
        <div ref={setElementRef} className="p-5">
          <div className="flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded-sm md:px-1 px-4 py-1.5 bg-layer-1 animate-pulse" />
        </div>
      )}
      {pageCount + 1 < totalPages && cycles.length !== 0 && (
        <div className="flex items-center justify-center gap-4 text-11 w-full py-5">
          <Button variant="secondary" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}

      {!isLoading && cycles.length === 0 && (
        <EmptyStateDetailed
          assetKey="cycle"
          title={t("workspace_empty_state.active_cycles.title")}
          description={t("workspace_empty_state.active_cycles.description")}
        />
      )}
    </ContentWrapper>
  );
});
