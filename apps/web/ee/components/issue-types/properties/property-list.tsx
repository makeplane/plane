import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType, IIssueProperty } from "@plane/types";
// plane web imports
import { IssuePropertyOptionsProvider } from "@/plane-web/lib";
// local imports
import { IssuePropertyCreateListItem } from "./property-create-list-item";
import { IssuePropertyListItem, type TCustomPropertyOperations } from "./property-list-item";
import type { TIssuePropertyCreateList } from "./root";

type TIssuePropertyList = {
  properties: IIssueProperty<EIssuePropertyType>[] | undefined;
  issuePropertyCreateList: TIssuePropertyCreateList[];
  customPropertyOperations: TCustomPropertyOperations;
  containerRef: React.RefObject<HTMLDivElement>;
  lastElementRef: React.RefObject<HTMLDivElement>;
  isUpdateAllowed: boolean;
  trackers?: {
    [key in "create" | "update" | "delete" | "quickActions"]?: {
      button?: string;
      eventName?: string;
    };
  };
};

export const IssuePropertyList: FC<TIssuePropertyList> = observer((props) => {
  const {
    properties,
    issuePropertyCreateList,
    customPropertyOperations,
    containerRef,
    lastElementRef,
    isUpdateAllowed,
    trackers,
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
                trackers={trackers}
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
              isUpdateAllowed
              trackers={trackers}
            />
          </IssuePropertyOptionsProvider>
        ))}
      </div>
    </div>
  );
});
