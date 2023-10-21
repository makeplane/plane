// components
import {
  PeekOverviewHeader,
  PeekOverviewIssueActivity,
  PeekOverviewIssueDetails,
  PeekOverviewIssueProperties,
  TPeekOverviewModes,
} from "components/issues";
// ui
import { Loader } from "@plane/ui";
// types
import { IIssue } from "types";

type Props = {
  handleClose: () => void;
  handleDeleteIssue: () => void;
  handleUpdateIssue: (formData: Partial<IIssue>) => Promise<void>;
  issue: IIssue | undefined;
  mode: TPeekOverviewModes;
  readOnly: boolean;
  setMode: (mode: TPeekOverviewModes) => void;
  workspaceSlug: string;
};

export const FullScreenPeekView: React.FC<Props> = ({
  handleClose,
  handleDeleteIssue,
  handleUpdateIssue,
  issue,
  mode,
  readOnly,
  setMode,
  workspaceSlug,
}) => (
  <div className="h-full w-full grid grid-cols-10 divide-x divide-custom-border-200 overflow-hidden">
    <div className="h-full w-full flex flex-col col-span-7 overflow-hidden">
      <div className="w-full p-5">
        <PeekOverviewHeader
          handleClose={handleClose}
          handleDeleteIssue={handleDeleteIssue}
          issue={issue}
          mode={mode}
          setMode={setMode}
          workspaceSlug={workspaceSlug}
        />
      </div>
      {issue ? (
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
          {/* divider */}
          <div className="h-[1] w-full border-t border-custom-border-200 my-5" />
          {/* issue activity/comments */}
          <div className="w-full pb-5">
            <PeekOverviewIssueActivity workspaceSlug={workspaceSlug} issue={issue} readOnly={readOnly} />
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
        {issue ? (
          <PeekOverviewIssueProperties
            handleDeleteIssue={handleDeleteIssue}
            handleUpdateIssue={handleUpdateIssue}
            issue={issue}
            mode="full"
            readOnly={readOnly}
            workspaceSlug={workspaceSlug}
          />
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
