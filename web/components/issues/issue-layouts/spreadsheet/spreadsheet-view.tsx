import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// components
import { SpreadsheetColumnsList, SpreadsheetIssuesColumn, SpreadsheetInlineCreateIssueForm } from "components/issues";
import { CustomMenu, Spinner } from "@plane/ui";
// types
import {
  IIssue,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueLabels,
  IStateResponse,
  IUserLite,
} from "types";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  issues: IIssue[] | undefined;
  members?: IUserLite[] | undefined;
  labels?: IIssueLabels[] | undefined;
  states?: IStateResponse | undefined;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  handleUpdateIssue: (issue: IIssue, data: Partial<IIssue>) => void;
  openIssuesListModal?: (() => void) | null;
  disableUserActions: boolean;
  enableQuickCreateIssue?: boolean;
};

export const SpreadsheetView: React.FC<Props> = observer((props) => {
  const {
    displayProperties,
    displayFilters,
    handleDisplayFilterUpdate,
    issues,
    members,
    labels,
    states,
    handleIssueAction,
    handleUpdateIssue,
    openIssuesListModal,
    disableUserActions,
    enableQuickCreateIssue,
  } = props;

  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);

  const [isInlineCreateIssueFormOpen, setIsInlineCreateIssueFormOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const { cycleId, moduleId } = router.query;

  const type = cycleId ? "cycle" : moduleId ? "module" : "issue";

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

  return (
    <div className="relative flex h-full w-full rounded-lg text-custom-text-200 overflow-x-auto whitespace-nowrap bg-custom-background-200">
      <div className="h-full w-full flex flex-col">
        <div
          ref={containerRef}
          className="flex max-h-full h-full overflow-y-auto divide-x-[0.5px] divide-custom-border-200"
        >
          {issues && issues.length > 0 ? (
            <>
              <div className="sticky left-0 w-[28rem] z-[2]">
                <div
                  className="relative flex flex-col h-max w-full bg-custom-background-100 z-[2]"
                  style={{
                    boxShadow: isScrolled ? "8px -9px 12px rgba(0, 0, 0, 0.05)" : "",
                  }}
                >
                  <div className="flex items-center text-sm font-medium z-[2] h-11 w-full sticky top-0 bg-custom-background-90 border border-l-0 border-custom-border-100">
                    {displayProperties.key && (
                      <span className="flex items-center px-4 py-2.5 h-full w-24 flex-shrink-0">ID</span>
                    )}
                    <span className="flex items-center px-4 py-2.5 h-full w-full flex-grow">Issue</span>
                  </div>

                  {issues.map((issue, index) => (
                    <SpreadsheetIssuesColumn
                      key={`${issue.id}_${index}`}
                      issue={issue}
                      expandedIssues={expandedIssues}
                      setExpandedIssues={setExpandedIssues}
                      properties={displayProperties}
                      handleIssueAction={handleIssueAction}
                      disableUserActions={disableUserActions}
                    />
                  ))}
                </div>
              </div>

              <SpreadsheetColumnsList
                displayFilters={displayFilters}
                displayProperties={displayProperties}
                disableUserActions={disableUserActions}
                expandedIssues={expandedIssues}
                handleDisplayFilterUpdate={handleDisplayFilterUpdate}
                handleUpdateIssue={handleUpdateIssue}
                issues={issues}
                members={members}
                labels={labels}
                states={states}
              />
            </>
          ) : (
            <div className="grid place-items-center h-full w-full">
              <Spinner />
            </div>
          )}
        </div>

        <div className="border-t border-custom-border-100">
          <div className="mb-3 z-50 sticky bottom-0 left-0">
            {enableQuickCreateIssue && <SpreadsheetInlineCreateIssueForm />}
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
