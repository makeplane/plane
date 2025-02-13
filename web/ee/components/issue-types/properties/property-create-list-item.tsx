import { forwardRef } from "react";
import { observer } from "mobx-react";
// plane web components
import { TCreationListModes } from "@plane/types";
import { IssuePropertyListItem, TIssuePropertyCreateList } from "@/plane-web/components/issue-types";
// plane imports

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
