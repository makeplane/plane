/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TIssue, TPaginationData } from "@plane/types";
// components
import { renderFormattedPayloadDate } from "@plane/utils";
// helpers
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarIssueBlockRoot } from "./issue-block-root";
import { CalendarQuickAddIssueActions } from "./quick-add-issue-actions";
// types

type Props = {
  date: Date;
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
};

export const CalendarIssueBlocks = observer(function CalendarIssueBlocks(props: Props) {
  const {
    date,
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
  } = props;
  const formattedDatePayload = renderFormattedPayloadDate(date);
  const { t } = useTranslation();

  const {
    issues: { getGroupIssueCount, getPaginationData, getIssueLoader },
  } = useIssuesStore();

  if (!formattedDatePayload) return null;

  const dayIssueCount = getGroupIssueCount(formattedDatePayload, undefined, false);
  const nextPageResults = getPaginationData(formattedDatePayload, undefined)?.nextPageResults;
  const isPaginating = !!getIssueLoader(formattedDatePayload);

  const shouldLoadMore =
    nextPageResults === undefined && dayIssueCount !== undefined
      ? issueIdList?.length < dayIssueCount
      : !!nextPageResults;

  return (
    <>
      {issueIdList?.map((issueId) => (
        <div key={issueId} className="relative cursor-pointer p-1 px-2">
          <CalendarIssueBlockRoot
            issueId={issueId}
            quickActions={quickActions}
            isDragDisabled={isDragDisabled || isMobileView}
            canEditProperties={canEditProperties}
            isEpic={isEpic}
          />
        </div>
      ))}

      {isPaginating && (
        <div className="p-1 px-2">
          <div className="flex h-10 w-full animate-pulse items-center justify-between gap-1.5 rounded-sm bg-layer-1 px-4 py-1.5 md:h-8 md:px-1" />
        </div>
      )}

      {enableQuickIssueCreate && !disableIssueCreation && !readOnly && (
        <div className="border-b border-subtle px-1 py-1 md:border-none md:px-2">
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

      {shouldLoadMore && !isPaginating && (
        <div className="flex items-center px-2.5 py-1">
          <button
            type="button"
            className="w-min rounded-sm px-1.5 py-1 text-11 font-medium whitespace-nowrap text-accent-primary hover:bg-layer-1 hover:text-accent-secondary"
            onClick={() => loadMoreIssues(formattedDatePayload)}
          >
            {t("common.load_more")}
          </button>
        </div>
      )}
    </>
  );
});
