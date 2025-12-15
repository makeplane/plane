import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import type { TInboxIssueCurrentTab } from "@plane/types";
import { EInboxIssueCurrentTab } from "@plane/types";
// plane imports
import { Header, Loader, EHeaderVariant } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { InboxSidebarLoader } from "@/components/ui/loader/layouts/project-inbox/inbox-sidebar-loader";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
// local imports
import { FiltersRoot } from "../inbox-filter";
import { InboxIssueAppliedFilters } from "../inbox-filter/applied-filters/root";
import { InboxIssueList } from "./inbox-list";

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

export const InboxSidebar = observer(function InboxSidebar(props: IInboxSidebarProps) {
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
    <div className="bg-surface-1 flex-shrink-0 w-full h-full border-r border-strong ">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <Header variant={EHeaderVariant.SECONDARY}>
          {tabNavigationOptions.map((option) => (
            <div
              key={option?.key}
              className={cn(
                `text-13 relative flex items-center gap-1 h-full px-3 cursor-pointer transition-all font-medium`,
                currentTab === option?.key ? `text-accent-primary` : `hover:text-secondary`
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
                <div className="rounded-full p-1.5 py-0.5 bg-accent-primary/20 text-accent-primary text-11 font-semibold">
                  {inboxIssuePaginationInfo?.total_results || 0}
                </div>
              )}
              <div
                className={cn(
                  `border absolute bottom-0 right-0 left-0 rounded-t-md`,
                  currentTab === option?.key ? `border-accent-strong` : `border-transparent`
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
                  <EmptyStateDetailed
                    assetKey="search"
                    title={t("common_empty_state.search.title")}
                    description={t("common_empty_state.search.description")}
                    assetClassName="size-20"
                    rootClassName="px-page-x"
                  />
                ) : currentTab === EInboxIssueCurrentTab.OPEN ? (
                  <EmptyStateDetailed
                    assetKey="inbox"
                    title={t("project_empty_state.intake_sidebar.title")}
                    description={t("project_empty_state.intake_sidebar.description")}
                    assetClassName="size-20"
                    actions={[
                      {
                        label: t("project_empty_state.intake_sidebar.cta_primary"),
                        onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/intake`),
                        variant: "primary",
                      },
                    ]}
                    rootClassName="px-page-x"
                  />
                ) : (
                  // TODO: Add translation
                  <EmptyStateDetailed
                    assetKey="inbox"
                    title="No request closed yet"
                    description="All the work items whether accepted or declined can be found here."
                    assetClassName="size-20"
                    className="px-10"
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
