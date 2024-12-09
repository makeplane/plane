import { FC } from "react";
import { observer } from "mobx-react";
// plane web components / types
import {
  IssuePropertyCreateListItem,
  IssuePropertyListItem,
  TIssuePropertyCreateList,
} from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web lib
import { IssuePropertyOptionsProvider } from "@/plane-web/lib";
// plane web types
import { TCreationListModes } from "@/plane-web/types";

type TIssuePropertyList = {
  issueTypeId: string;
  issuePropertyCreateList: TIssuePropertyCreateList[];
  handleIssuePropertyCreateList: (mode: TCreationListModes, value: TIssuePropertyCreateList) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  lastElementRef: React.RefObject<HTMLDivElement>;
};

export const IssuePropertyList: FC<TIssuePropertyList> = observer((props) => {
  const { issueTypeId, issuePropertyCreateList, handleIssuePropertyCreateList, containerRef, lastElementRef } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const properties = issueType?.properties;

  return (
    <div className="w-full mt-1">
      <div ref={containerRef} className="w-full overflow-y-auto px-6 transition-all">
        {properties &&
          properties.map((property) => (
            <IssuePropertyOptionsProvider key={property.id} issueTypeId={issueTypeId} issuePropertyId={property.id}>
              <IssuePropertyListItem
                issueTypeId={issueTypeId}
                issuePropertyId={property.id}
                handleIssuePropertyCreateList={handleIssuePropertyCreateList}
              />
            </IssuePropertyOptionsProvider>
          ))}
        {/* Issue properties create list */}
        {issuePropertyCreateList.map((issueProperty, index) => (
          <IssuePropertyOptionsProvider
            key={issueProperty.key}
            issueTypeId={issueTypeId}
            issuePropertyId={issueProperty.id}
          >
            <IssuePropertyCreateListItem
              ref={index === issuePropertyCreateList.length - 1 ? lastElementRef : undefined}
              issueTypeId={issueTypeId}
              issuePropertyCreateListData={issueProperty}
              handleIssuePropertyCreateList={handleIssuePropertyCreateList}
            />
          </IssuePropertyOptionsProvider>
        ))}
      </div>
    </div>
  );
});
