import { useRef } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IIssueDisplayProperties, TIssue } from "@plane/types";
// types
// constants
import { E_SPREADSHEET_LAYOUT } from "@/constants/event-tracker";
import { SPREADSHEET_PROPERTY_DETAILS } from "@/constants/spreadsheet";
import { useEventTracker } from "@/hooks/store";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
// components

type Props = {
  displayProperties: IIssueDisplayProperties;
  issueDetail: TIssue;
  disableUserActions: boolean;
  property: keyof IIssueDisplayProperties;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  isEstimateEnabled: boolean;
};

export const IssueColumn = observer((props: Props) => {
  const { displayProperties, issueDetail, disableUserActions, property, updateIssue, isEstimateEnabled } = props;
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
            updateIssue &&
            updateIssue(issue.project_id, issue.id, data).then(() => {
              captureIssueEvent({
                eventName: "Issue updated",
                payload: {
                  ...issue,
                  ...data,
                  element: E_SPREADSHEET_LAYOUT,
                },
                updates: updates,
                routePath: router.asPath,
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
