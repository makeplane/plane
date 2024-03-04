import { useRef } from "react";
import { useRouter } from "next/router";
// types
import { IIssueDisplayProperties, TIssue } from "@plane/types";
import { EIssueActions } from "../types";
// constants
import { SPREADSHEET_PROPERTY_DETAILS } from "constants/spreadsheet";
// components
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import { useEventTracker } from "hooks/store";
import { observer } from "mobx-react";

type Props = {
  displayProperties: IIssueDisplayProperties;
  issueDetail: TIssue;
  disableUserActions: boolean;
  property: keyof IIssueDisplayProperties;
  handleIssues: (issue: TIssue, action: EIssueActions) => Promise<void>;
  isEstimateEnabled: boolean;
};

export const IssueColumn = observer((props: Props) => {
  const { displayProperties, issueDetail, disableUserActions, property, handleIssues, isEstimateEnabled } = props;
  // router
  const router = useRouter();
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
        className="h-11 w-full min-w-[8rem] bg-custom-background-100 text-sm after:absolute after:w-full after:bottom-[-1px] after:border after:border-custom-border-100 border-r-[1px] border-custom-border-100"
        ref={tableCellRef}
      >
        <Column
          issue={issueDetail}
          onChange={(issue: TIssue, data: Partial<TIssue>, updates: any) =>
            handleIssues({ ...issue, ...data }, EIssueActions.UPDATE).then(() => {
              captureIssueEvent({
                eventName: "Issue updated",
                payload: {
                  ...issue,
                  ...data,
                  element: "Spreadsheet layout",
                },
                updates: updates,
                path: router.asPath,
              });
            })
          }
          disabled={disableUserActions}
          onClose={() => {
            tableCellRef?.current?.focus();
          }}
        />
      </td>
    </WithDisplayPropertiesHOC>
  );
});
