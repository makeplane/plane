import { useEffect } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

import {
  PeekOverviewHeader,
  PeekOverviewIssueActivity,
  PeekOverviewIssueDetails,
  PeekOverviewIssueProperties,
  TPeekOverviewModes,
} from "components/issues/peek-overview";

type Props = {
  issueId: string;
  workspaceSlug: string;
  projectId: string;
  handleClose: () => void;
  mode: TPeekOverviewModes;
  setMode: (mode: TPeekOverviewModes) => void;
};

export const FullScreenPeekView: React.FC<Props> = observer((props) => {
  const { handleClose, issueId, mode, setMode, workspaceSlug , projectId } = props;

  const { issue: issueStore } = useMobxStore();

  const issue = issueStore.issue_detail[issueId]?.issue;

  useEffect(() => {
    if (!workspaceSlug || !projectId || !issueId) return;

    issueStore.getIssueByIdAsync(workspaceSlug, projectId, issueId);
  }, [workspaceSlug, projectId, issueId, issueStore]);

  return (
    <div className="h-full w-full grid grid-cols-10 divide-x divide-custom-border-200 overflow-hidden">
            <div className="h-full w-full flex flex-col col-span-7 overflow-hidden">
              <div className="w-full p-5">
                <PeekOverviewHeader
                  handleClose={handleClose}
                  issue={issue}
                  mode={mode}
                  setMode={setMode}
                  workspaceSlug={workspaceSlug}
                />
              </div>
              <div className="h-full w-full px-6 overflow-y-auto">
                {/* issue title and description */}
                <div className="w-full">
                  <PeekOverviewIssueDetails issue={issue} />
                </div>
                {/* divider */}
                <div className="h-[1] w-full border-t border-custom-border-200 my-5" />
                {/* issue activity/comments */}
                <div className="w-full">
                  <PeekOverviewIssueActivity workspaceSlug={workspaceSlug} />
                </div>
              </div>
            </div>
            <div className="col-span-3 h-full w-full overflow-y-auto">
              {/* issue properties */}
              <div className="w-full px-6 py-5">
                <PeekOverviewIssueProperties issue={issue} mode="full" workspaceSlug={workspaceSlug} />
              </div>
            </div>
          </div>
  )
})
