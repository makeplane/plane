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
import { useEffect } from "react";

type Props = {
  issueId: string;
  projectId: string;
  workspaceSlug: string;
  handleClose: () => void;
  mode: TPeekOverviewModes;
  setMode: (mode: TPeekOverviewModes) => void;
};

export const SidePeekView: React.FC<Props> = observer((props) => {
  const { handleClose, issueId, mode, setMode, workspaceSlug, projectId } = props;

  const { issue: issueStore } = useMobxStore();

  const issue = issueStore.issue_detail[issueId]?.issue;

  useEffect(() => {
    if (!workspaceSlug || !projectId || !issueId) return;

    issueStore.getIssueByIdAsync(workspaceSlug, projectId, issueId);
  }, [workspaceSlug, projectId, issueId, issueStore]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="w-full p-5">
        <PeekOverviewHeader
          handleClose={handleClose}
          issue={issue}
          mode={mode}
          setMode={setMode}
          workspaceSlug={workspaceSlug}
        />
      </div>
      {issue && (
        <div className="h-full w-full px-6 overflow-y-auto">
          {/* issue title and description */}
          <div className="w-full">
            <PeekOverviewIssueDetails issue={issue} />
          </div>
          {/* issue properties */}
          <div className="w-full mt-10">
            <PeekOverviewIssueProperties issue={issue} mode={mode} workspaceSlug={workspaceSlug} />
          </div>
          {/* divider */}
          <div className="h-[1] w-full border-t border-custom-border-200 my-5" />
          {/* issue activity/comments */}
          <div className="w-full pb-5">
            <PeekOverviewIssueActivity workspaceSlug={workspaceSlug} />
          </div>
        </div>
      )}
    </div>
  );
});
