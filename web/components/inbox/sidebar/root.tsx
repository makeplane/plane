import {
  FC,
  useCallback,
  useRef,
  // useState,
} from "react";
import { observer } from "mobx-react";
import { Tab } from "@headlessui/react";
import { Loader } from "@plane/ui";
// components
import { FiltersRoot } from "@/components/inbox";
// hooks
import { useProject, useProjectInbox } from "@/hooks/store";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { InboxIssueList } from "./inbox-list";

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
  const { currentTab, handleCurrentTab, inboxIssuesArray, inboxIssuePaginationInfo, fetchInboxIssues } =
    useProjectInbox();
  const { currentProjectDetails } = useProject();

  const fetchNextPages = useCallback(() => {
    if (!workspaceSlug || !projectId) return;
    fetchInboxIssues(workspaceSlug.toString(), projectId.toString());
  }, [workspaceSlug, projectId, fetchInboxIssues]);
  // page observer
  useIntersectionObserver({
    containerRef,
    elementRef,
    callback: fetchNextPages,
    rootMargin: "20%",
  });

  const currentValue = (tab: string | null) => {
    switch (tab) {
      case "Open":
        return 0;
      case "Closed":
        return 1;
      default:
        return 0;
    }
  };

  return (
    <div className="flex-shrink-0 w-2/5 h-full border-r border-custom-border-300">
      <Tab.Group
        defaultIndex={currentValue(currentTab)}
        onChange={(i) => {
          switch (i) {
            case 0:
              return handleCurrentTab("open");
            case 1:
              return handleCurrentTab("closed");

            default:
              return handleCurrentTab("open");
          }
        }}
      >
        <Tab.List className="flex-shrink-0 w-full h-[50px] relative flex justify-between items-center gap-2  px-3 border-b border-custom-border-300">
          <div className="flex items-end h-full gap-2">
            <Tab
              className={({ selected }) =>
                `flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 p-3 gap-2 text-sm font-medium outline-none ${
                  selected
                    ? "border-custom-primary-100 text-custom-primary-100"
                    : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
                }`
              }
            >
              Open
              {currentTab === "open" && (
                <span className="cursor-default flex items-center text-center justify-center px-2 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl">
                  {inboxIssuePaginationInfo?.total_results || 0}
                </span>
              )}
            </Tab>
            <Tab
              className={({ selected }) =>
                `flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 p-3 gap-2 text-sm font-medium outline-none ${
                  selected
                    ? "border-custom-primary-100 text-custom-primary-100"
                    : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
                }`
              }
            >
              Closed
            </Tab>
          </div>

          <div className="flex items-center gap-2">
            <FiltersRoot />
          </div>
        </Tab.List>
        <Tab.Panels className="h-full overflow-y-auto">
          <Tab.Panel as="div" className="w-full h-full overflow-hidden">
            <div className="overflow-y-auto w-full h-full vertical-scrollbar scrollbar-md" ref={containerRef}>
              <InboxIssueList
                workspaceSlug={workspaceSlug.toString()}
                projectId={projectId.toString()}
                projectIdentifier={currentProjectDetails?.identifier}
                inboxIssues={inboxIssuesArray}
              />
              <div className="mt-4" ref={elementRef}>
                {inboxIssuePaginationInfo?.next_page_results && (
                  <Loader className="mx-auto w-full space-y-4 pb-4">
                    <Loader.Item height="64px" width="w-100" />
                    <Loader.Item height="64px" width="w-100" />
                  </Loader>
                )}
              </div>
            </div>
          </Tab.Panel>
          <Tab.Panel as="div" className="w-full h-full overflow-hidden">
            <div className="overflow-y-auto w-full h-full vertical-scrollbar scrollbar-md" ref={containerRef}>
              <InboxIssueList
                workspaceSlug={workspaceSlug.toString()}
                projectId={projectId.toString()}
                projectIdentifier={currentProjectDetails?.identifier}
                inboxIssues={inboxIssuesArray}
              />
              <div className="mt-4" ref={elementRef}>
                {inboxIssuePaginationInfo?.next_page_results && (
                  <Loader className="mx-auto w-full space-y-4 pb-4">
                    <Loader.Item height="64px" width="w-100" />
                    <Loader.Item height="64px" width="w-100" />
                  </Loader>
                )}
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
});
