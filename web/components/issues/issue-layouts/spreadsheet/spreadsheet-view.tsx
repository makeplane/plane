import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
// components
import { Spinner } from "@plane/ui";
import { SpreadsheetQuickAddIssueForm } from "components/issues";
import { SpreadsheetTable } from "./spreadsheet-table";
// types
import { TIssue, IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EIssueActions } from "../types";
//hooks
import { useProject } from "hooks/store";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  issueIds: string[] | undefined;
  quickActions: (
    issue: TIssue,
    customActionButton?: React.ReactElement,
    portalElement?: HTMLDivElement | null
  ) => React.ReactNode;
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
    issueIds,
    quickActions,
    handleIssues,
    quickAddCallback,
    viewId,
    canEditProperties,
    enableQuickCreateIssue,
    disableIssueCreation,
  } = props;
  // states
  const isScrolled = useRef(false);
  // refs
  const containerRef = useRef<HTMLTableElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const { currentProjectDetails } = useProject();

  const isEstimateEnabled: boolean = currentProjectDetails?.estimate !== null;

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;

    const columnShadow = "8px 22px 22px 10px rgba(0, 0, 0, 0.05)"; // shadow for regular columns
    const headerShadow = "8px -22px 22px 10px rgba(0, 0, 0, 0.05)"; // shadow for headers

    //The shadow styles are added this way to avoid re-render of all the rows of table, which could be costly
    if (scrollLeft > 0 !== isScrolled.current) {
      const firtColumns = containerRef.current.querySelectorAll("table tr td:first-child, th:first-child");

      for (let i = 0; i < firtColumns.length; i++) {
        const shadow = i === 0 ? headerShadow : columnShadow;
        if (scrollLeft > 0) {
          (firtColumns[i] as HTMLElement).style.boxShadow = shadow;
        } else {
          (firtColumns[i] as HTMLElement).style.boxShadow = "none";
        }
      }
      isScrolled.current = scrollLeft > 0;
    }
  };

  useEffect(() => {
    const currentContainerRef = containerRef.current;

    if (currentContainerRef) currentContainerRef.addEventListener("scroll", handleScroll);

    return () => {
      if (currentContainerRef) currentContainerRef.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!issueIds || issueIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="relative flex flex-col h-full w-full overflow-x-hidden whitespace-nowrap rounded-lg bg-custom-background-200 text-custom-text-200">
      <div ref={portalRef} className="spreadsheet-menu-portal" />
      <div ref={containerRef} className="horizontal-scroll-enable h-full w-full">
        <SpreadsheetTable
          displayProperties={displayProperties}
          displayFilters={displayFilters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          issueIds={issueIds}
          isEstimateEnabled={isEstimateEnabled}
          portalElement={portalRef}
          quickActions={quickActions}
          handleIssues={handleIssues}
          canEditProperties={canEditProperties}
        />
      </div>
      <div className="border-t border-custom-border-100">
        <div className="z-5 sticky bottom-0 left-0 mb-3">
          {enableQuickCreateIssue && !disableIssueCreation && (
            <SpreadsheetQuickAddIssueForm formKey="name" quickAddCallback={quickAddCallback} viewId={viewId} />
          )}
        </div>
      </div>
    </div>
  );
});
