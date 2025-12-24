import { observer } from "mobx-react";
// plane imports
import { Loader } from "@plane/ui";
// store hooks
import { usePublish } from "@/hooks/store/publish";
// types
import type { IIssue } from "@/types/issue";
// local imports
import { PeekOverviewHeader } from "./header";
import { PeekOverviewIssueActivity } from "./issue-activity";
import { PeekOverviewIssueDetails } from "./issue-details";
import { PeekOverviewIssueProperties } from "./issue-properties";

type Props = {
  anchor: string;
  handleClose: () => void;
  issueDetails: IIssue | undefined;
};

export const SidePeekView = observer(function SidePeekView(props: Props) {
  const { anchor, handleClose, issueDetails } = props;
  // store hooks
  const { canComment } = usePublish(anchor);

  return (
    <div className="flex size-full flex-col overflow-hidden">
      <div className="w-full p-5">
        <PeekOverviewHeader handleClose={handleClose} issueDetails={issueDetails} />
      </div>
      {issueDetails ? (
        <div className="size-full overflow-y-auto px-6">
          {/* issue title and description */}
          <div className="w-full">
            <PeekOverviewIssueDetails anchor={anchor} issueDetails={issueDetails} />
          </div>
          {/* issue properties */}
          <div className="mt-6 w-full">
            <PeekOverviewIssueProperties issueDetails={issueDetails} />
          </div>
          {/* divider */}
          <div className="my-5 h-[1] w-full border-t border-subtle" />
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
