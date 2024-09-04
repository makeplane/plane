import { forwardRef } from "react";
import { observer } from "mobx-react";
// plane web components
import { IssuePropertyListItem, TIssuePropertyCreateList } from "@/plane-web/components/issue-types";
// plane web types
import { TCreationListModes } from "@/plane-web/types";

export type TIssuePropertyCreateListItem = {
  issueTypeId: string;
  issuePropertyCreateListData?: TIssuePropertyCreateList;
  handleIssuePropertyCreateList: (mode: TCreationListModes, value: TIssuePropertyCreateList) => void;
};

export const IssuePropertyCreateListItem = observer(
  forwardRef<HTMLDivElement, TIssuePropertyCreateListItem>(function IssuePropertyCreateListItem(
    props: TIssuePropertyCreateListItem,
    ref: React.Ref<HTMLDivElement>
  ) {
    const { issueTypeId, issuePropertyCreateListData, handleIssuePropertyCreateList } = props;

    return (
      <div ref={ref}>
        <IssuePropertyListItem
          issueTypeId={issueTypeId}
          issuePropertyCreateListData={issuePropertyCreateListData}
          operationMode="create"
          handleIssuePropertyCreateList={handleIssuePropertyCreateList}
        />
      </div>
    );
  })
);
