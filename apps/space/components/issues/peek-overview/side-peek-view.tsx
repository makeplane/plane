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
import { IIssue } from "types/issue";

type Props = {
  handleClose: () => void;
  issueDetails: IIssue;
};

export const SidePeekView: React.FC<Props> = observer((props) => {
  const { handleClose, issueDetails } = props;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="w-full p-5">
        <PeekOverviewHeader handleClose={handleClose} issueDetails={issueDetails} />
      </div>
      {issueDetails && (
        <div className="h-full w-full px-6 overflow-y-auto">
          {/* issue title and description */}
          <div className="w-full">
            <PeekOverviewIssueDetails issueDetails={issueDetails} />
          </div>
          {/* issue properties */}
          <div className="w-full mt-10">
            <PeekOverviewIssueProperties issueDetails={issueDetails} />
          </div>
          {/* divider */}
          <div className="h-[1] w-full border-t border-custom-border-200 my-5" />
          {/* issue activity/comments */}
          <div className="w-full pb-5">
            <PeekOverviewIssueActivity issueDetails={issueDetails} />
          </div>
        </div>
      )}
    </div>
  );
});
