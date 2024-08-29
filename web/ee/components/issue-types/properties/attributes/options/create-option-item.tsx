import { forwardRef } from "react";
import { observer } from "mobx-react";
// plane web hooks
import { IssuePropertyOptionItem } from "@/plane-web/components/issue-types/properties/attributes";
// plane web types
import { TIssuePropertyOptionCreateUpdateData } from "@/plane-web/types";

type TIssuePropertyCreateOptionItem = {
  propertyOptionCreateListData: TIssuePropertyOptionCreateUpdateData;
  updateCreateListData: (value: TIssuePropertyOptionCreateUpdateData) => void;
  scrollIntoNewOptionView: () => void;
  error?: string;
};

export const IssuePropertyCreateOptionItem = observer(
  forwardRef<HTMLDivElement, TIssuePropertyCreateOptionItem>(function IssuePropertyCreateOptionItem(
    props: TIssuePropertyCreateOptionItem,
    ref: React.Ref<HTMLDivElement>
  ) {
    const { propertyOptionCreateListData, updateCreateListData, scrollIntoNewOptionView, error } = props;

    return (
      <div ref={ref} className="w-full pr-2.5">
        <IssuePropertyOptionItem
          propertyOptionData={propertyOptionCreateListData}
          updateOptionData={updateCreateListData}
          scrollIntoNewOptionView={scrollIntoNewOptionView}
          error={error}
        />
      </div>
    );
  })
);
