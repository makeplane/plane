"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TInboxIssueCurrentTab, EInboxIssueCurrentTab } from "@plane/types";
// plane imports
import { Header, Loader, EHeaderVariant } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { SimpleEmptyState } from "@/components/empty-state";
import { FiltersRoot, InboxIssueAppliedFilters, InboxIssueList } from "@/components/inbox";
import { InboxSidebarLoader } from "@/components/ui";
// helpers
// hooks
import { useProject, useProjectInbox } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

type IInboxSidebarProps = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string | undefined;
  setIsMobileSidebar: (value: boolean) => void;
};

const tabNavigationOptions: { key: TInboxIssueCurrentTab; i18n_label: string }[] = [
  {
    key: EInboxIssueCurrentTab.OPEN,
    i18n_label: "inbox_issue.tabs.open",
  },
  {
    key: EInboxIssueCurrentTab.CLOSED,
    i18n_label: "inbox_issue.tabs.closed",
  },
];

export const InboxSidebar: FC<IInboxSidebarProps> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssueId, setIsMobileSidebar } = props;
  // router
  const router = useAppRouter();
  // ref
  const containerRef = useRef<HTMLDivElement>(null);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);
  // plane hooks
  const { t } = useTranslation();
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
  // derived values
  const sidebarAssetPath = useResolvedAssetPath({ basePath: "/empty-state/intake/intake-issue" });
  const sidebarFilterAssetPath = useResolvedAssetPath({
    basePath: "/empty-state/intake/filter-issue",
  });

  const fetchNextPages = useCallback(() => {
    if (!workspaceSlug || !projectId) return;
    fetchInboxPaginationIssues(workspaceSlug.toString(), projectId.toString());
  }, [workspaceSlug, projectId, fetchInboxPaginationIssues]);

  // page observer
  useIntersectionObserver(containerRef, elementRef, fetchNextPages, "20%");

  useEffect(() => {
    if (workspaceSlug && projectId && currentTab && filteredInboxIssueIds.length > 0) {
      if (inboxIssueId === undefined) {
        router.push(
          `/${workspaceSlug}/projects/${projectId}/intake?currentTab=${currentTab}&inboxIssueId=${filteredInboxIssueIds[0]}`
        );
      }
    }
  }, [currentTab, filteredInboxIssueIds, inboxIssueId, projectId, router, workspaceSlug]);

  return (
    <div className="bg-custom-background-100 flex-shrink-0 w-full h-full border-r border-custom-border-300 ">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <Header variant={EHeaderVariant.SECONDARY}>
          {tabNavigationOptions.map((option) => (
            <div
              key={option?.key}
              className={cn(
                `text-sm relative flex items-center gap-1 h-full px-3 cursor-pointer transition-all font-medium`,
                currentTab === option?.key ? `text-custom-primary-100` : `hover:text-custom-text-200`
              )}
              onClick={() => {
                if (currentTab != option?.key) {
                  handleCurrentTab(workspaceSlug, projectId, option?.key);
                  router.push(`/${workspaceSlug}/projects/${projectId}/intake?currentTab=${option?.key}`);
                }
              }}
            >
              <div>{t(option?.i18n_label)}</div>
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
          <div className="m-auto mr-0">
            <FiltersRoot />
          </div>
        </Header>
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
                {getAppliedFiltersCount > 0 ? (
                  <SimpleEmptyState
                    title={t("inbox_issue.empty_state.sidebar_filter.title")}
                    description={t("inbox_issue.empty_state.sidebar_filter.description")}
                    assetPath={sidebarFilterAssetPath}
                  />
                ) : currentTab === EInboxIssueCurrentTab.OPEN ? (
                  <SimpleEmptyState
                    title={t("inbox_issue.empty_state.sidebar_open_tab.title")}
                    description={t("inbox_issue.empty_state.sidebar_open_tab.description")}
                    assetPath={sidebarAssetPath}
                  />
                ) : (
                  <SimpleEmptyState
                    title={t("inbox_issue.empty_state.sidebar_closed_tab.title")}
                    description={t("inbox_issue.empty_state.sidebar_closed_tab.description")}
                    assetPath={sidebarAssetPath}
                  />
                )}
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
