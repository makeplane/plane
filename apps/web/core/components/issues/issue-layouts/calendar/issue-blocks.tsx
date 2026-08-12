/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TIssue, TPaginationData } from "@plane/types";
// components
import { renderFormattedPayloadDate } from "@plane/utils";
// helpers
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarIssueBlockRoot } from "./issue-block-root";
import { CalendarQuickAddIssueActions } from "./quick-add-issue-actions";
// types

type Props = {
  date?: Date;
  sourceDate?: string;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  issueIdList: string[];
  quickActions: TRenderQuickActions;
  isDragDisabled?: boolean;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  readOnly?: boolean;
  isMobileView?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
  showDueDateBadge?: boolean;
  showProjectBadge?: boolean;
  stackProjectBadge?: boolean;
  enableInfiniteScroll?: boolean;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
};

export const CalendarIssueBlocks = observer(function CalendarIssueBlocks(props: Props) {
  const {
    date,
    sourceDate,
    issueIdList,
    quickActions,
    loadMoreIssues,
    isDragDisabled = false,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    addIssuesToView,
    readOnly,
    isMobileView = false,
    canEditProperties,
    isEpic = false,
    showDueDateBadge = false,
    showProjectBadge = false,
    stackProjectBadge = false,
    enableInfiniteScroll = false,
    scrollContainerRef,
  } = props;
  const formattedDatePayload = sourceDate ?? (date ? renderFormattedPayloadDate(date) : undefined);
  const { t } = useTranslation();
  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);
  const fallbackScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    issues: { getGroupIssueCount, getPaginationData, getIssueLoader },
  } = useIssuesStore();

  const dayIssueCount = formattedDatePayload ? getGroupIssueCount(formattedDatePayload, undefined, false) : undefined;
  const nextPageResults = formattedDatePayload
    ? getPaginationData(formattedDatePayload, undefined)?.nextPageResults
    : undefined;
  const isPaginating = formattedDatePayload ? !!getIssueLoader(formattedDatePayload) : false;

  const shouldLoadMore =
    nextPageResults === undefined && dayIssueCount !== undefined
      ? issueIdList?.length < dayIssueCount
      : !!nextPageResults;

  const handleLoadMore = useCallback(() => {
    if (!formattedDatePayload) return;
    loadMoreIssues(formattedDatePayload);
  }, [formattedDatePayload, loadMoreIssues]);

  useIntersectionObserver(
    scrollContainerRef ?? fallbackScrollContainerRef,
    enableInfiniteScroll && shouldLoadMore && !isPaginating ? intersectionElement : null,
    handleLoadMore,
    "100% 0% 100% 0%"
  );

  if (!formattedDatePayload) return null;

  return (
    <>
      {issueIdList?.map((issueId) => (
        <div key={issueId} className="relative cursor-pointer p-1 px-2">
          <CalendarIssueBlockRoot
            issueId={issueId}
            quickActions={quickActions}
            isDragDisabled={isDragDisabled || isMobileView}
            sourceDate={formattedDatePayload}
            canEditProperties={canEditProperties}
            isEpic={isEpic}
            showDueDateBadge={showDueDateBadge}
            showProjectBadge={showProjectBadge}
            stackProjectBadge={stackProjectBadge}
          />
        </div>
      ))}

      {isPaginating && (
        <div className="p-1 px-2">
          <div className="flex h-10 w-full animate-pulse items-center justify-between gap-1.5 rounded-sm bg-layer-1 px-4 py-1.5 md:h-8 md:px-1" />
        </div>
      )}

      {enableQuickIssueCreate && !disableIssueCreation && !readOnly && (
        <div
          role="presentation"
          className="border-b border-subtle px-1 py-1 md:border-none md:px-2"
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarQuickAddIssueActions
            prePopulatedData={{
              target_date: formattedDatePayload,
            }}
            quickAddCallback={quickAddCallback}
            addIssuesToView={addIssuesToView}
            isEpic={isEpic}
          />
        </div>
      )}

      {shouldLoadMore && !isPaginating && enableInfiniteScroll && (
        <div ref={setIntersectionElement} className="p-1 px-2">
          <div className="flex h-10 w-full animate-pulse items-center justify-between gap-1.5 rounded-sm bg-layer-1 px-4 py-1.5 md:h-8 md:px-1" />
        </div>
      )}

      {shouldLoadMore && !isPaginating && !enableInfiniteScroll && (
        <div className="flex items-center px-2.5 py-1">
          <button
            type="button"
            className="w-min rounded-sm px-1.5 py-1 text-11 font-medium whitespace-nowrap text-accent-primary hover:bg-layer-1 hover:text-accent-secondary"
            onClick={handleLoadMore}
          >
            {t("common.load_more")}
          </button>
        </div>
      )}
    </>
  );
});
