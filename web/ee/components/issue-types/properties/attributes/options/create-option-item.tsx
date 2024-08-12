import { forwardRef } from "react";
import { observer } from "mobx-react";
// plane web hooks
import { IssuePropertyOptionItem } from "@/plane-web/components/issue-types/properties/attributes";
// plane web types
import { TIssuePropertyOptionCreateUpdateData } from "@/plane-web/types";

type TIssuePropertyCreateOptionItem = {
  propertyOptionCreateListData: TIssuePropertyOptionCreateUpdateData;
  updateCreateListData: (value: TIssuePropertyOptionCreateUpdateData) => void;
};

export const IssuePropertyCreateOptionItem = observer(
  forwardRef<HTMLDivElement, TIssuePropertyCreateOptionItem>(function IssuePropertyCreateOptionItem(
    props: TIssuePropertyCreateOptionItem,
    ref: React.Ref<HTMLDivElement>
  ) {
    const { propertyOptionCreateListData, updateCreateListData } = props;

    return (
      <div ref={ref} className="w-full px-1 pr-2">
        <IssuePropertyOptionItem
          propertyOptionData={propertyOptionCreateListData}
          updateOptionData={updateCreateListData}
        />
      </div>
    );
  })
);
