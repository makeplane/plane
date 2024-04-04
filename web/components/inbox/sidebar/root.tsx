import { FC, useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { TInboxIssueCurrentTab } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { FiltersRoot, InboxIssueList } from "@/components/inbox";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProject, useProjectInbox } from "@/hooks/store";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

type IInboxSidebarProps = {
  workspaceSlug: string;
  projectId: string;
};

export const InboxSidebar: FC<IInboxSidebarProps> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // ref
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  // store
  const { currentTab, handleCurrentTab, inboxIssuesArray, inboxIssuePaginationInfo, fetchInboxPaginationIssues } =
    useProjectInbox();
  const { currentProjectDetails } = useProject();

  const fetchNextPages = useCallback(() => {
    if (!workspaceSlug || !projectId) return;
    fetchInboxPaginationIssues(workspaceSlug.toString(), projectId.toString());
  }, [workspaceSlug, projectId, fetchInboxPaginationIssues]);
  // page observer
  useIntersectionObserver({
    containerRef,
    elementRef,
    callback: fetchNextPages,
    rootMargin: "20%",
  });

  const tabNavigationOptions: { key: TInboxIssueCurrentTab; label: string }[] = [
    {
      key: "open",
      label: "Open",
    },
    {
      key: "closed",
      label: "Closed",
    },
  ];

  return (
    <div className="flex-shrink-0 w-2/5 h-full border-r border-custom-border-300">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <div className="border-b border-custom-border-300 flex-shrink-0 w-full h-[50px] relative flex items-center gap-2 px-3 whitespace-nowrap">
          {tabNavigationOptions.map((option) => (
            <div
              key={option?.key}
              className={cn(
                `text-sm relative flex items-center gap-1 h-[50px] px-2 cursor-pointer transition-all font-medium`,
                currentTab === option?.key
                  ? `text-custom-primary-100 bg-custom-primary-100/10`
                  : `hover:text-custom-text-200`
              )}
              onClick={() => handleCurrentTab(option?.key)}
            >
              <div>{option?.label}</div>
              {option?.key === "open" && currentTab === option?.key && (
                <div className="rounded-full p-1.5 py-0.5 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold">
                  {inboxIssuesArray.length || 0}/{inboxIssuePaginationInfo?.total_results || 0}
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
        <div
          className="w-full h-full overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-md"
          ref={containerRef}
        >
          <InboxIssueList
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            projectIdentifier={currentProjectDetails?.identifier}
            inboxIssues={inboxIssuesArray}
          />
          <div ref={elementRef}>
            {inboxIssuePaginationInfo?.next_page_results && (
              <Loader className="mx-auto w-full space-y-4 py-4 px-2">
                <Loader.Item height="64px" width="w-100" />
                <Loader.Item height="64px" width="w-100" />
              </Loader>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
