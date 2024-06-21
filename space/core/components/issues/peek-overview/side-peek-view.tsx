"use client";

import { observer } from "mobx-react";
// components
import { Loader } from "@plane/ui";
import {
  PeekOverviewHeader,
  PeekOverviewIssueActivity,
  PeekOverviewIssueDetails,
  PeekOverviewIssueProperties,
} from "@/components/issues/peek-overview";
// store hooks
import { usePublish } from "@/hooks/store";
// types
import { IIssue } from "@/types/issue";

type Props = {
  anchor: string;
  handleClose: () => void;
  issueDetails: IIssue | undefined;
};

export const SidePeekView: React.FC<Props> = observer((props) => {
  const { anchor, handleClose, issueDetails } = props;
  // store hooks
  const { canComment } = usePublish(anchor);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="w-full p-5">
        <PeekOverviewHeader handleClose={handleClose} issueDetails={issueDetails} />
      </div>
      {issueDetails ? (
        <div className="h-full w-full overflow-y-auto px-6">
          {/* issue title and description */}
          <div className="w-full">
            <PeekOverviewIssueDetails anchor={anchor} issueDetails={issueDetails} />
          </div>
          {/* issue properties */}
          <div className="mt-6 w-full">
            <PeekOverviewIssueProperties issueDetails={issueDetails} />
          </div>
          {/* divider */}
          <div className="my-5 h-[1] w-full border-t border-custom-border-200" />
          {/* issue activity/comments */}
          {canComment && (
            <div className="w-full pb-5">
              <PeekOverviewIssueActivity anchor={anchor} issueDetails={issueDetails} />
            </div>
          )}
        </div>
      ) : (
        <Loader className="px-6">
          <Loader.Item height="30px" />
          <div className="mt-3 space-y-2">
            <Loader.Item height="20px" width="70%" />
            <Loader.Item height="20px" width="60%" />
            <Loader.Item height="20px" width="60%" />
          </div>
        </Loader>
      )}
    </div>
  );
});
