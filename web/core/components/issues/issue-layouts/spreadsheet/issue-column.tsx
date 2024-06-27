import { useRef } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// types
import { IIssueDisplayProperties, TIssue } from "@plane/types";
// constants
import { SPREADSHEET_PROPERTY_DETAILS } from "@/constants/spreadsheet";
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

export const IssueColumn = observer((props: Props) => {
  const { displayProperties, issueDetail, disableUserActions, property, updateIssue, isEstimateEnabled } = props;
  // router
  const pathname = usePathname();
  const tableCellRef = useRef<HTMLTableCellElement | null>(null);
  const { captureIssueEvent } = useEventTracker();

  const shouldRenderProperty = property === "estimate" ? isEstimateEnabled : true;

  const { Column } = SPREADSHEET_PROPERTY_DETAILS[property];

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
