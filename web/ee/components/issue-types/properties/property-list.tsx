import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType } from "@plane/constants";
import { IIssueProperty } from "@plane/types";
// plane web imports
import {
  IssuePropertyCreateListItem,
  IssuePropertyListItem,
  TIssuePropertyCreateList,
  TCustomPropertyOperations,
} from "@/plane-web/components/issue-types";
// plane web lib
import { IssuePropertyOptionsProvider } from "@/plane-web/lib";

type TIssuePropertyList = {
  properties: IIssueProperty<EIssuePropertyType>[] | undefined;
  issuePropertyCreateList: TIssuePropertyCreateList[];
  customPropertyOperations: TCustomPropertyOperations;
  containerRef: React.RefObject<HTMLDivElement>;
  lastElementRef: React.RefObject<HTMLDivElement>;
  isUpdateAllowed: boolean;
};

export const IssuePropertyList: FC<TIssuePropertyList> = observer((props) => {
  const {
    properties,
    issuePropertyCreateList,
    customPropertyOperations,
    containerRef,
    lastElementRef,
    isUpdateAllowed,
  } = props;

  return (
    <div className="w-full mt-1">
      <div ref={containerRef} className="w-full overflow-y-auto px-6 transition-all">
        {properties &&
          properties.map((property) => (
            <IssuePropertyOptionsProvider
              key={property.id}
              customPropertyId={property.id}
              customPropertyOperations={customPropertyOperations}
            >
              <IssuePropertyListItem
                customPropertyId={property.id}
                customPropertyOperations={customPropertyOperations}
                isUpdateAllowed={isUpdateAllowed}
              />
            </IssuePropertyOptionsProvider>
          ))}
        {/* Issue properties create list */}
        {issuePropertyCreateList.map((issueProperty, index) => (
          <IssuePropertyOptionsProvider
            key={issueProperty.key}
            customPropertyId={issueProperty.id}
            customPropertyOperations={customPropertyOperations}
          >
            <IssuePropertyCreateListItem
              ref={index === issuePropertyCreateList.length - 1 ? lastElementRef : undefined}
              issuePropertyCreateListData={issueProperty}
              customPropertyOperations={customPropertyOperations}
              isUpdateAllowed={isUpdateAllowed}
            />
          </IssuePropertyOptionsProvider>
        ))}
      </div>
    </div>
  );
});
