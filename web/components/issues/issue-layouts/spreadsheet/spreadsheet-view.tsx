import React, { useRef } from "react";
import { observer } from "mobx-react-lite";
import { TIssue, IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common";
import { SpreadsheetQuickAddIssueForm } from "@/components/issues";
import { SPREADSHEET_PROPERTY_LIST } from "@/constants/spreadsheet";
import { useProject } from "@/hooks/store";
import { TRenderQuickActions } from "../list/list-view-types";
import { SpreadsheetTable } from "./spreadsheet-table";
// types
//hooks

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  issueIds: string[] | undefined;
  quickActions: TRenderQuickActions;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
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
  isWorkspaceLevel?: boolean;
};

export const SpreadsheetView: React.FC<Props> = observer((props) => {
  const {
    displayProperties,
    displayFilters,
    handleDisplayFilterUpdate,
    issueIds,
    quickActions,
    updateIssue,
    quickAddCallback,
    viewId,
    canEditProperties,
    enableQuickCreateIssue,
    disableIssueCreation,
    isWorkspaceLevel = false,
  } = props;
  // refs
  const containerRef = useRef<HTMLTableElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const { currentProjectDetails } = useProject();

  const isEstimateEnabled: boolean = currentProjectDetails?.estimate !== null;

  const spreadsheetColumnsList = isWorkspaceLevel
    ? SPREADSHEET_PROPERTY_LIST
    : SPREADSHEET_PROPERTY_LIST.filter((property) => {
        if (property === "cycle" && !currentProjectDetails?.cycle_view) return false;
        if (property === "modules" && !currentProjectDetails?.module_view) return false;
        return true;
      });

  if (!issueIds || issueIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <LogoSpinner />
      </div>
    );

  return (
    <div className="relative flex h-full w-full flex-col overflow-x-hidden whitespace-nowrap rounded-lg bg-custom-background-200 text-custom-text-200">
      <div ref={portalRef} className="spreadsheet-menu-portal" />
      <div ref={containerRef} className="vertical-scrollbar horizontal-scrollbar scrollbar-lg h-full w-full">
        <SpreadsheetTable
          displayProperties={displayProperties}
          displayFilters={displayFilters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          issueIds={issueIds}
          isEstimateEnabled={isEstimateEnabled}
          portalElement={portalRef}
          quickActions={quickActions}
          updateIssue={updateIssue}
          canEditProperties={canEditProperties}
          containerRef={containerRef}
          spreadsheetColumnsList={spreadsheetColumnsList}
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
