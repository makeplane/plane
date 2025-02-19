import { useRef } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// types
import { IIssueDisplayProperties, TIssue } from "@plane/types";
// components
import {
  SpreadsheetAssigneeColumn,
  SpreadsheetAttachmentColumn,
  SpreadsheetCreatedOnColumn,
  SpreadsheetDueDateColumn,
  SpreadsheetEstimateColumn,
  SpreadsheetLabelColumn,
  SpreadsheetModuleColumn,
  SpreadsheetCycleColumn,
  SpreadsheetLinkColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStartDateColumn,
  SpreadsheetStateColumn,
  SpreadsheetSubIssueColumn,
  SpreadsheetUpdatedOnColumn,
} from "@/components/issues/issue-layouts/spreadsheet";
// hooks
import { useEventTracker } from "@/hooks/store";
// components
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";

type Props = {
  displayProperties: IIssueDisplayProperties;
  issueDetail: TIssue;
  disableUserActions: boolean;
  property: keyof IIssueDisplayProperties;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  isEstimateEnabled: boolean;
};

type TSpreadsheetColumn = React.FC<{
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
}>;

const SPREADSHEET_COLUMNS: { [key in keyof IIssueDisplayProperties]: TSpreadsheetColumn } = {
  assignee: SpreadsheetAssigneeColumn,
  created_on: SpreadsheetCreatedOnColumn,
  due_date: SpreadsheetDueDateColumn,
  estimate: SpreadsheetEstimateColumn,
  labels: SpreadsheetLabelColumn,
  modules: SpreadsheetModuleColumn,
  cycle: SpreadsheetCycleColumn,
  link: SpreadsheetLinkColumn,
  priority: SpreadsheetPriorityColumn,
  start_date: SpreadsheetStartDateColumn,
  state: SpreadsheetStateColumn,
  sub_issue_count: SpreadsheetSubIssueColumn,
  updated_on: SpreadsheetUpdatedOnColumn,
  attachment_count: SpreadsheetAttachmentColumn,
};

export const IssueColumn = observer((props: Props) => {
  const { displayProperties, issueDetail, disableUserActions, property, updateIssue, isEstimateEnabled } = props;
  // router
  const pathname = usePathname();
  const tableCellRef = useRef<HTMLTableCellElement | null>(null);
  const { captureIssueEvent } = useEventTracker();

  const shouldRenderProperty = property === "estimate" ? isEstimateEnabled : true;

  const Column = SPREADSHEET_COLUMNS[property];

  if (!Column) return null;

  return (
    <WithDisplayPropertiesHOC
      displayProperties={displayProperties}
      displayPropertyKey={property}
      shouldRenderProperty={() => shouldRenderProperty}
    >
      <td
        tabIndex={0}
        className="h-11 w-full min-w-36 max-w-48 text-sm after:absolute after:w-full after:bottom-[-1px] after:border after:border-custom-border-100 border-r-[1px] border-custom-border-100"
        ref={tableCellRef}
      >
        <Column
          issue={issueDetail}
          onChange={(issue: TIssue, data: Partial<TIssue>, updates: any) =>
            updateIssue &&
            updateIssue(issue.project_id, issue.id, data).then(() => {
              captureIssueEvent({
                eventName: "Issue updated",
                payload: {
                  ...issue,
                  ...data,
                  element: "Spreadsheet layout",
                },
                updates: updates,
                path: pathname,
              });
            })
          }
          disabled={disableUserActions}
          onClose={() => tableCellRef?.current?.focus()}
        />
      </td>
    </WithDisplayPropertiesHOC>
  );
});
