"use client";

import { FC, useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { TInboxIssueCurrentTab } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { EmptyState } from "@/components/empty-state";
import { FiltersRoot, InboxIssueAppliedFilters, InboxIssueList } from "@/components/inbox";
import { InboxSidebarLoader } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// helpers
import { cn } from "@/helpers/common.helper";
import { EInboxIssueCurrentTab } from "@/helpers/inbox.helper";
// hooks
import { useProject, useProjectInbox } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

type IInboxSidebarProps = {
  workspaceSlug: string;
  projectId: string;
  setIsMobileSidebar: (value: boolean) => void;
};

const tabNavigationOptions: { key: TInboxIssueCurrentTab; label: string }[] = [
  {
    key: EInboxIssueCurrentTab.OPEN,
    label: "Open",
  },
  {
    key: EInboxIssueCurrentTab.CLOSED,
    label: "Closed",
  },
];

export const InboxSidebar: FC<IInboxSidebarProps> = observer((props) => {
  const { workspaceSlug, projectId, setIsMobileSidebar } = props;
  // ref
  const containerRef = useRef<HTMLDivElement>(null);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);
  // store
  const { currentProjectDetails } = useProject();
  const {
    currentTab,
    handleCurrentTab,
    loader,
    filteredInboxIssueIds,
    inboxIssuePaginationInfo,
    fetchInboxPaginationIssues,
    getAppliedFiltersCount,
  } = useProjectInbox();

  const router = useAppRouter();

  const fetchNextPages = useCallback(() => {
    if (!workspaceSlug || !projectId) return;
    fetchInboxPaginationIssues(workspaceSlug.toString(), projectId.toString());
  }, [workspaceSlug, projectId, fetchInboxPaginationIssues]);

  // page observer
  useIntersectionObserver(containerRef, elementRef, fetchNextPages, "20%");

  return (
    <div className="bg-custom-background-100 flex-shrink-0 w-full h-full border-r border-custom-border-300 ">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <div className="border-b border-custom-border-300 flex-shrink-0 w-full h-[50px] relative flex items-center gap-2  whitespace-nowrap px-3">
          {tabNavigationOptions.map((option) => (
            <div
              key={option?.key}
              className={cn(
                `text-sm relative flex items-center gap-1 h-[50px] px-3 cursor-pointer transition-all font-medium`,
                currentTab === option?.key ? `text-custom-primary-100` : `hover:text-custom-text-200`
              )}
              onClick={() => {
                if (currentTab != option?.key) {
                  handleCurrentTab(workspaceSlug, projectId, option?.key);
                  router.push(`/${workspaceSlug}/projects/${projectId}/inbox?currentTab=${option?.key}`);
                }
              }}
            >
              <div>{option?.label}</div>
              {option?.key === "open" && currentTab === option?.key && (
                <div className="rounded-full p-1.5 py-0.5 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold">
                  {inboxIssuePaginationInfo?.total_results || 0}
                </div>
              )}
              <div
                className={cn(
                  `border absolute bottom-0 right-0 left-0 rounded-t-md`,
                  currentTab === option?.key ? `border-custom-primary-100` : `border-transparent`
                )}
              />
            </div>
          ))}
          <div className="ml-auto">
            <FiltersRoot />
          </div>
        </div>

        <InboxIssueAppliedFilters />

        {loader != undefined && loader === "filter-loading" && !inboxIssuePaginationInfo?.next_page_results ? (
          <InboxSidebarLoader />
        ) : (
          <div
            className="w-full h-full overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-md"
            ref={containerRef}
          >
            {filteredInboxIssueIds.length > 0 ? (
              <InboxIssueList
                setIsMobileSidebar={setIsMobileSidebar}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                projectIdentifier={currentProjectDetails?.identifier}
                inboxIssueIds={filteredInboxIssueIds}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <EmptyState
                  type={
                    getAppliedFiltersCount > 0
                      ? EmptyStateType.INBOX_SIDEBAR_FILTER_EMPTY_STATE
                      : currentTab === EInboxIssueCurrentTab.OPEN
                        ? EmptyStateType.INBOX_SIDEBAR_OPEN_TAB
                        : EmptyStateType.INBOX_SIDEBAR_CLOSED_TAB
                  }
                  layout="screen-simple"
                />
              </div>
            )}
            <div ref={setElementRef}>
              {inboxIssuePaginationInfo?.next_page_results && (
                <Loader className="mx-auto w-full space-y-4 py-4 px-2">
                  <Loader.Item height="64px" width="w-100" />
                  <Loader.Item height="64px" width="w-100" />
                </Loader>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
