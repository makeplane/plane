import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
// components
import { SpreadsheetColumnsList, SpreadsheetIssuesColumn, SpreadsheetQuickAddIssueForm } from "components/issues";
import { Spinner, LayersIcon } from "@plane/ui";
// types
import { TIssue, IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueLabel, IState } from "@plane/types";
import { EIssueActions } from "../types";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  issues: TIssue[] | undefined;
  labels?: IIssueLabel[] | undefined;
  states?: IState[] | undefined;
  quickActions: (issue: TIssue, customActionButton: any) => React.ReactNode;
  handleIssues: (issue: TIssue, action: EIssueActions) => Promise<void>;
  openIssuesListModal?: (() => void) | null;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  canEditProperties: (projectId: string | undefined) => boolean;
  enableQuickCreateIssue?: boolean;
  disableIssueCreation?: boolean;
};

export const SpreadsheetView: React.FC<Props> = observer((props) => {
  const {
    displayProperties,
    displayFilters,
    handleDisplayFilterUpdate,
    issues,
    labels,
    states,
    quickActions,
    handleIssues,
    quickAddCallback,
    viewId,
    canEditProperties,
    enableQuickCreateIssue,
    disableIssueCreation,
  } = props;
  // states
  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;

    const scrollLeft = containerRef.current.scrollLeft;
    setIsScrolled(scrollLeft > 0);
  };

  useEffect(() => {
    const currentContainerRef = containerRef.current;

    if (currentContainerRef) currentContainerRef.addEventListener("scroll", handleScroll);

    return () => {
      if (currentContainerRef) currentContainerRef.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!issues || issues.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="relative flex h-full w-full overflow-x-auto whitespace-nowrap rounded-lg bg-custom-background-200 text-custom-text-200">
      <div className="flex h-full w-full flex-col">
        <div
          ref={containerRef}
          className="horizontal-scroll-enable flex divide-x-[0.5px] divide-custom-border-200 overflow-y-auto"
        >
          {issues && issues.length > 0 && (
            <>
              <div className="sticky left-0 z-[2] w-[28rem]">
                <div
                  className="relative z-[2] flex h-max w-full flex-col bg-custom-background-100"
                  style={{
                    boxShadow: isScrolled ? "8px -9px 12px rgba(0, 0, 0, 0.05)" : "",
                  }}
                >
                  <div className="sticky top-0 z-[2] flex h-11 w-full items-center border border-l-0 border-custom-border-100 bg-custom-background-90 text-sm font-medium">
                    {displayProperties.key && (
                      <span className="flex h-full w-24 flex-shrink-0 items-center px-4 py-2.5">
                        <span className="mr-1.5 text-custom-text-400">#</span>ID
                      </span>
                    )}
                    <span className="flex h-full w-full flex-grow items-center justify-center px-4 py-2.5">
                      <LayersIcon className="mr-1.5 h-4 w-4 text-custom-text-400" />
                      Issue
                    </span>
                  </div>

                  {issues.map((issue, index) =>
                    issue ? (
                      <SpreadsheetIssuesColumn
                        key={`${issue?.id}_${index}`}
                        issueId={issue.id}
                        expandedIssues={expandedIssues}
                        setExpandedIssues={setExpandedIssues}
                        properties={displayProperties}
                        quickActions={quickActions}
                        canEditProperties={canEditProperties}
                      />
                    ) : null
                  )}
                </div>
              </div>

              <SpreadsheetColumnsList
                displayFilters={displayFilters}
                displayProperties={displayProperties}
                canEditProperties={canEditProperties}
                expandedIssues={expandedIssues}
                handleDisplayFilterUpdate={handleDisplayFilterUpdate}
                handleUpdateIssue={(issue, data) => handleIssues({ ...issue, ...data }, EIssueActions.UPDATE)}
                issues={issues}
                labels={labels}
                states={states}
              />
            </>
          )}
          <div /> {/* empty div to show right most border */}
        </div>

        <div className="border-t border-custom-border-100">
          <div className="z-5 sticky bottom-0 left-0 mb-3">
            {enableQuickCreateIssue && !disableIssueCreation && (
              <SpreadsheetQuickAddIssueForm formKey="name" quickAddCallback={quickAddCallback} viewId={viewId} />
            )}
          </div>

          {/* {!disableUserActions &&
            !isInlineCreateIssueFormOpen &&
            (type === "issue" ? (
              <button
                className="flex gap-1.5 items-center text-custom-primary-100 pl-4 py-2.5 text-sm sticky left-0 z-[1] w-full"
                onClick={() => setIsInlineCreateIssueFormOpen(true)}
              >
                <PlusIcon className="h-4 w-4" />
                New Issue
              </button>
            ) : (
              <CustomMenu
                className="sticky left-0 z-10"
                customButton={
                  <button
                    className="flex gap-1.5 items-center text-custom-primary-100 pl-4 py-2.5 text-sm sticky left-0 z-[1] border-custom-border-200 w-full"
                    type="button"
                  >
                    <PlusIcon className="h-4 w-4" />
                    New Issue
                  </button>
                }
                optionsClassName="left-5 !w-36"
                noBorder
              >
                <CustomMenu.MenuItem onClick={() => setIsInlineCreateIssueFormOpen(true)}>
                  Create new
                </CustomMenu.MenuItem>
                {openIssuesListModal && (
                  <CustomMenu.MenuItem onClick={openIssuesListModal}>Add an existing issue</CustomMenu.MenuItem>
                )}
              </CustomMenu>
            ))} */}
        </div>
      </div>
    </div>
  );
});
