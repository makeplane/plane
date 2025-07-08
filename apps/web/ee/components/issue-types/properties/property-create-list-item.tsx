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
};

export const IssuePropertyCreateListItem = observer(
  forwardRef<HTMLDivElement, TIssuePropertyCreateListItem>(function IssuePropertyCreateListItem(
    props: TIssuePropertyCreateListItem,
    ref: React.Ref<HTMLDivElement>
  ) {
    const { issuePropertyCreateListData, customPropertyOperations, isUpdateAllowed } = props;

    return (
      <div ref={ref}>
        <IssuePropertyListItem
          issuePropertyCreateListData={issuePropertyCreateListData}
          operationMode="create"
          customPropertyOperations={customPropertyOperations}
          isUpdateAllowed={isUpdateAllowed}
        />
      </div>
    );
  })
);
