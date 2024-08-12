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
    <div className="w-full mt-2 flow-root">
      <div className="overflow-x-auto horizontal-scrollbar scrollbar-sm">
        <div className="inline-block min-w-full py-2 align-middle">
          <div className="w-full">
            <div className="flex items-center mx-7 px-1 gap-1.5 border-b-[0.5px] border-custom-border-200">
              <div className="w-48 grow py-1.5 text-left text-sm font-medium text-custom-text-300 truncate">Name</div>
              <div className="w-36 py-1.5 text-left text-sm font-medium text-custom-text-300 truncate">Type</div>
              <div className="w-36 py-1.5 text-left text-sm font-medium text-custom-text-300 truncate">Attributes</div>
              <div className="w-20 py-1.5 text-center text-sm font-medium text-custom-text-300 truncate">Mandatory</div>
              <div className="w-20 py-1.5 text-center text-sm font-medium text-custom-text-300 truncate">Active</div>
              <div className="relative w-16 py-1.5 sm:pr-0 truncate">
                <span className="sr-only">Edit</span>
              </div>
            </div>
            <div ref={containerRef} className="w-full min-h-36 max-h-72 overflow-y-auto py-2 px-6 transition-all">
              {properties &&
                properties.map((property) => (
                  <IssuePropertyOptionsProvider
                    key={property.id}
                    issueTypeId={issueTypeId}
                    issuePropertyId={property.id}
                  >
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
        </div>
      </div>
    </div>
  );
});
