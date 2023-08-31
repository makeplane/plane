import { useEffect } from "react";
import { observer } from "mobx-react-lite";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  PeekOverviewHeader,
  PeekOverviewIssueActivity,
  PeekOverviewIssueDetails,
  PeekOverviewIssueProperties,
} from "components/issues/peek-overview";
// types
import { Loader } from "components/ui/loader";
import { IIssue } from "types/issue";

type Props = {
  handleClose: () => void;
  issueDetails: IIssue | undefined;
};

export const FullScreenPeekView: React.FC<Props> = observer((props) => {
  const { handleClose, issueDetails } = props;

  return (
    <div className="h-full w-full grid grid-cols-10 divide-x divide-custom-border-200 overflow-hidden">
      <div className="h-full w-full flex flex-col col-span-7 overflow-hidden">
        <div className="w-full p-5">
          <PeekOverviewHeader handleClose={handleClose} issueDetails={issueDetails} />
        </div>
        {issueDetails ? (
          <div className="h-full w-full px-6 overflow-y-auto">
            {/* issue title and description */}
            <div className="w-full">
              <PeekOverviewIssueDetails issueDetails={issueDetails} />
            </div>
            {/* divider */}
            <div className="h-[1] w-full border-t border-custom-border-200 my-5" />
            {/* issue activity/comments */}
            <div className="w-full pb-5">
              <PeekOverviewIssueActivity issueDetails={issueDetails} />
            </div>
          </div>
        ) : (
          <Loader className="px-6">
            <Loader.Item height="30px" />
            <div className="space-y-2 mt-3">
              <Loader.Item height="20px" width="70%" />
              <Loader.Item height="20px" width="60%" />
              <Loader.Item height="20px" width="60%" />
            </div>
          </Loader>
        )}
      </div>
      <div className="col-span-3 h-full w-full overflow-y-auto">
        {/* issue properties */}
        <div className="w-full px-6 py-5">
          {issueDetails ? (
            <PeekOverviewIssueProperties issueDetails={issueDetails} />
          ) : (
            <Loader className="mt-11 space-y-4">
              <Loader.Item height="30px" />
              <Loader.Item height="30px" />
              <Loader.Item height="30px" />
              <Loader.Item height="30px" />
            </Loader>
          )}
        </div>
      </div>
    </div>
  );
});
