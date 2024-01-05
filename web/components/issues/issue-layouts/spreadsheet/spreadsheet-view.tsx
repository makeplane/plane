import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { IssuePeekOverview, SpreadsheetQuickAddIssueForm } from "components/issues";
import { Spinner } from "@plane/ui";
// types
import { TIssue, IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EIssueActions } from "../types";
import { useProject } from "hooks/store";
import { SpreadsheetHeader } from "./spreadsheet-header";
import { SpreadsheetIssueRow } from "./issue-row";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  issues: TIssue[] | undefined;
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
    quickActions,
    handleIssues,
    quickAddCallback,
    viewId,
    canEditProperties,
    enableQuickCreateIssue,
    disableIssueCreation,
  } = props;
  // states
  const [isScrolled, setIsScrolled] = useState(false);
  // refs
  const containerRef = useRef<HTMLTableElement | null>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, peekIssueId, peekProjectId } = router.query;

  const { currentProjectDetails } = useProject();

  const isEstimateEnabled: boolean = currentProjectDetails?.estimate !== null;

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
        <table
          ref={containerRef}
          className="horizontal-scroll-enable flex divide-x-[0.5px] divide-custom-border-200 overflow-y-auto"
        >
          <SpreadsheetHeader
            displayProperties={displayProperties}
            displayFilters={displayFilters}
            handleDisplayFilterUpdate={handleDisplayFilterUpdate}
            isEstimateEnabled={isEstimateEnabled}
          />
          {issues.map(({ id }) => (
            <SpreadsheetIssueRow
              key={id}
              issueId={id}
              displayProperties={displayProperties}
              quickActions={quickActions}
              canEditProperties={canEditProperties}
              nestingLevel={0}
              isEstimateEnabled={isEstimateEnabled}
              handleIssues={handleIssues}
            />
          ))}
        </table>

        <div className="border-t border-custom-border-100">
          <div className="z-5 sticky bottom-0 left-0 mb-3">
            {enableQuickCreateIssue && !disableIssueCreation && (
              <SpreadsheetQuickAddIssueForm formKey="name" quickAddCallback={quickAddCallback} viewId={viewId} />
            )}
          </div>
        </div>
      </div>
      {workspaceSlug && peekIssueId && peekProjectId && (
        <IssuePeekOverview
          workspaceSlug={workspaceSlug.toString()}
          projectId={peekProjectId.toString()}
          issueId={peekIssueId.toString()}
          handleIssue={async (issueToUpdate: any) => await handleIssues(issueToUpdate, EIssueActions.UPDATE)}
        />
      )}
    </div>
  );
});
