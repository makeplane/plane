import { forwardRef } from "react";
import { observer } from "mobx-react";
// plane web hooks
import { IssuePropertyOptionItem } from "@/plane-web/components/issue-types/properties/attributes";
// plane web types
import { TIssuePropertyOptionCreateList } from "@/plane-web/types";

type TIssuePropertyCreateOptionItem = {
  issueTypeId: string;
  issuePropertyId: string | undefined;
  propertyOptionCreateListData?: TIssuePropertyOptionCreateList;
  updateCreateListData?: (value: TIssuePropertyOptionCreateList) => void;
};

export const IssuePropertyCreateOptionItem = observer(
  forwardRef<HTMLDivElement, TIssuePropertyCreateOptionItem>(function IssuePropertyCreateOptionItem(
    props: TIssuePropertyCreateOptionItem,
    ref: React.Ref<HTMLDivElement>
  ) {
    const { issueTypeId, issuePropertyId, propertyOptionCreateListData, updateCreateListData } = props;

    return (
      <div ref={ref} className="w-full">
        <IssuePropertyOptionItem
          issueTypeId={issueTypeId}
          issuePropertyId={issuePropertyId}
          operationMode="create"
          propertyOptionCreateListData={propertyOptionCreateListData}
          updateCreateListData={updateCreateListData}
        />
      </div>
    );
  })
);
