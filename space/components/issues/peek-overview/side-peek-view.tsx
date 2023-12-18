import { observer } from "mobx-react-lite";
// components
import {
  PeekOverviewHeader,
  PeekOverviewIssueActivity,
  PeekOverviewIssueDetails,
  PeekOverviewIssueProperties,
} from "components/issues/peek-overview";

import { Loader } from "@plane/ui";
import { IIssue } from "types/issue";

type Props = {
  handleClose: () => void;
  issueDetails: IIssue | undefined;
};

export const SidePeekView: React.FC<Props> = observer((props) => {
  const { handleClose, issueDetails } = props;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="w-full p-5">
        <PeekOverviewHeader handleClose={handleClose} issueDetails={issueDetails} />
      </div>
      {issueDetails ? (
        <div className="h-full w-full overflow-y-auto px-6">
          {/* issue title and description */}
          <div className="w-full">
            <PeekOverviewIssueDetails issueDetails={issueDetails} />
          </div>
          {/* issue properties */}
          <div className="mt-6 w-full">
            <PeekOverviewIssueProperties issueDetails={issueDetails} />
          </div>
          {/* divider */}
          <div className="my-5 h-[1] w-full border-t border-custom-border-200" />
          {/* issue activity/comments */}
          <div className="w-full pb-5">
            <PeekOverviewIssueActivity issueDetails={issueDetails} />
          </div>
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
