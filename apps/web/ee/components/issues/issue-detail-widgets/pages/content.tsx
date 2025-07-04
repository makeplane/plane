import React, { FC } from "react";
import { observer } from "mobx-react";
import { TIssuePage, TIssueServiceType } from "@plane/types";
import { PagesCollapsibleContentBlock } from "./block";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  isTabs?: boolean;
  projectId: string;
  data: TIssuePage[];
  issueServiceType: TIssueServiceType;
};

export const PagesCollapsibleContent: FC<TProps> = observer((props) => {
  const { workspaceSlug, workItemId, projectId, isTabs = false, data, issueServiceType } = props;

  return (
    <>
      <div className="py-2 space-y-3 w-full @container">
        <div className=" grid gap-4 p-2 grid-cols-1 @sm:grid-cols-2 @3xl:grid-cols-3">
          {data.map((item) => (
            <PagesCollapsibleContentBlock
              key={item?.id}
              workItemId={workItemId}
              page={item}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueServiceType={issueServiceType}
            />
          ))}
        </div>
      </div>
    </>
  );
});
