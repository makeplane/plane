import { forwardRef } from "react";
import { observer } from "mobx-react";
// plane web components
import {
  IssuePropertyListItem,
  TCustomPropertyOperations,
  TIssuePropertyCreateList,
} from "@/plane-web/components/issue-types";

export type TIssuePropertyCreateListItem = {
  issuePropertyCreateListData?: TIssuePropertyCreateList;
  customPropertyOperations: TCustomPropertyOperations;
  isUpdateAllowed: boolean;
  trackers?: {
    [key in "create" | "update" | "delete" | "quickActions"]?: {
      button?: string;
      eventName?: string;
    };
  };
};

export const IssuePropertyCreateListItem = observer(
  forwardRef<HTMLDivElement, TIssuePropertyCreateListItem>(function IssuePropertyCreateListItem(
    props: TIssuePropertyCreateListItem,
    ref: React.Ref<HTMLDivElement>
  ) {
    const { issuePropertyCreateListData, customPropertyOperations, isUpdateAllowed, trackers } = props;

    return (
      <div ref={ref}>
        <IssuePropertyListItem
          issuePropertyCreateListData={issuePropertyCreateListData}
          operationMode="create"
          customPropertyOperations={customPropertyOperations}
          isUpdateAllowed={isUpdateAllowed}
          trackers={trackers}
        />
      </div>
    );
  })
);
