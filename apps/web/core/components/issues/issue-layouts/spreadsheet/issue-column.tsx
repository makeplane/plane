import { useRef } from "react";
import { observer } from "mobx-react";
// types
import type { IIssueDisplayProperties, TIssue } from "@plane/types";
// components
import { SPREADSHEET_COLUMNS } from "@/plane-web/components/issues/issue-layouts/utils";
import { shouldRenderColumn } from "@/plane-web/helpers/issue-filter.helper";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";

type Props = {
  displayProperties: IIssueDisplayProperties;
  issueDetail: TIssue;
  disableUserActions: boolean;
  property: keyof IIssueDisplayProperties;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  isEstimateEnabled: boolean;
};

export const IssueColumn = observer(function IssueColumn(props: Props) {
  const { displayProperties, issueDetail, disableUserActions, property, updateIssue } = props;
  // router
  const tableCellRef = useRef<HTMLTableCellElement | null>(null);

  const shouldRenderProperty = shouldRenderColumn(property);

  const Column = SPREADSHEET_COLUMNS[property];

  if (!Column) return null;

  const handleUpdateIssue = async (issue: TIssue, data: Partial<TIssue>) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, data);
  };

  return (
    <WithDisplayPropertiesHOC
      displayProperties={displayProperties}
      displayPropertyKey={property}
      shouldRenderProperty={() => shouldRenderProperty}
    >
      <td
        tabIndex={0}
        className="h-11 min-w-36 text-13 after:absolute after:w-full after:bottom-[-1px] after:border after:border-subtle border-r-[1px] border-subtle"
        ref={tableCellRef}
      >
        <Column
          issue={issueDetail}
          onChange={handleUpdateIssue}
          disabled={disableUserActions}
          onClose={() => tableCellRef?.current?.focus()}
        />
      </td>
    </WithDisplayPropertiesHOC>
  );
});
