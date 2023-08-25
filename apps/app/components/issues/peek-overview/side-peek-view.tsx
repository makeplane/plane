import {
  PeekOverviewHeader,
  PeekOverviewIssueActivity,
  PeekOverviewIssueDetails,
  PeekOverviewIssueProperties,
  TPeekOverviewModes,
} from "components/issues";
import { IIssue } from "types";

type Props = {
  handleClose: () => void;
  handleUpdateIssue: (issue: Partial<IIssue>) => Promise<void>;
  issue: IIssue;
  mode: TPeekOverviewModes;
  readOnly: boolean;
  setMode: (mode: TPeekOverviewModes) => void;
  workspaceSlug: string;
};

export const SidePeekView: React.FC<Props> = ({
  handleClose,
  handleUpdateIssue,
  issue,
  mode,
  readOnly,
  setMode,
  workspaceSlug,
}) => (
  <div className="h-full w-full flex flex-col overflow-hidden">
    <div className="w-full p-5">
      <PeekOverviewHeader handleClose={handleClose} issue={issue} mode={mode} setMode={setMode} />
    </div>
    <div className="h-full w-full px-6 overflow-y-auto">
      {/* issue title and description */}
      <div className="w-full">
        <PeekOverviewIssueDetails
          handleUpdateIssue={handleUpdateIssue}
          issue={issue}
          readOnly={readOnly}
          workspaceSlug={workspaceSlug}
        />
      </div>
      {/* issue properties */}
      <div className="w-full mt-10">
        <PeekOverviewIssueProperties
          issue={issue}
          mode={mode}
          onChange={handleUpdateIssue}
          readOnly={readOnly}
        />
      </div>
      {/* divider */}
      <div className="h-[1] w-full border-t border-custom-border-200 my-5" />
      {/* issue activity/comments */}
      <div className="w-full pb-5">
        <PeekOverviewIssueActivity
          workspaceSlug={workspaceSlug}
          issue={issue}
          readOnly={readOnly}
        />
      </div>
    </div>
  </div>
);
