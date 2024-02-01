import { observer } from "mobx-react-lite";
//types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, TIssue } from "@plane/types";
import { EIssueActions } from "../types";
//components
import { SpreadsheetIssueRow } from "./issue-row";
import { SpreadsheetHeader } from "./spreadsheet-header";
import { MutableRefObject, useRef } from "react";
import RenderIfVisible from "components/core/render-if-visible-HOC";
import { cn } from "helpers/common.helper";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  issueIds: string[];
  isEstimateEnabled: boolean;
  quickActions: (
    issue: TIssue,
    customActionButton?: React.ReactElement,
    portalElement?: HTMLDivElement | null
  ) => React.ReactNode;
  handleIssues: (issue: TIssue, action: EIssueActions) => Promise<void>;
  canEditProperties: (projectId: string | undefined) => boolean;
  portalElement: React.MutableRefObject<HTMLDivElement | null>;
  containerRef: MutableRefObject<HTMLTableElement | null>;
};

export const SpreadsheetTable = observer((props: Props) => {
  const {
    displayProperties,
    displayFilters,
    handleDisplayFilterUpdate,
    issueIds,
    isEstimateEnabled,
    portalElement,
    quickActions,
    handleIssues,
    canEditProperties,
    containerRef,
  } = props;

  return (
    <table className="overflow-y-auto">
      <SpreadsheetHeader
        displayProperties={displayProperties}
        displayFilters={displayFilters}
        handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        isEstimateEnabled={isEstimateEnabled}
      />
      <tbody>
        {issueIds.map((id) => (
          <RenderIfVisible key={id} as="tr" defaultHeight={44.5} root={containerRef}>
            <SpreadsheetIssueRow
              issueId={id}
              displayProperties={displayProperties}
              quickActions={quickActions}
              canEditProperties={canEditProperties}
              nestingLevel={0}
              isEstimateEnabled={isEstimateEnabled}
              handleIssues={handleIssues}
              portalElement={portalElement}
            />
          </RenderIfVisible>
        ))}
      </tbody>
    </table>
  );
});
