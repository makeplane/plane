import { observer } from "mobx-react-lite";
//types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, TIssue } from "@plane/types";
import { EIssueActions } from "../types";
//components
import { SpreadsheetIssueRow } from "./issue-row";
import { SpreadsheetHeader } from "./spreadsheet-header";

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
          <SpreadsheetIssueRow
            key={id}
            issueId={id}
            displayProperties={displayProperties}
            quickActions={quickActions}
            canEditProperties={canEditProperties}
            nestingLevel={0}
            isEstimateEnabled={isEstimateEnabled}
            handleIssues={handleIssues}
            portalElement={portalElement}
          />
        ))}
      </tbody>
    </table>
  );
});
