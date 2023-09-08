// hooks
import useToast from "hooks/use-toast";
// icons
import { Icon } from "components/ui";
// helpers
import { copyTextToClipboard, addSpaceIfCamelCase } from "helpers/string.helper";
import { renderFullDate } from "helpers/date-time.helper";
import { dueDateIconDetails } from "../board-views/block-due-date";
// types
import { IIssue } from "types/issue";
import { IPeekMode } from "store/issue_details";
// constants
import { issueGroupFilter, issuePriorityFilter } from "constants/data";

type Props = {
  issueDetails: IIssue;
  mode?: IPeekMode;
};

export const PeekOverviewIssueProperties: React.FC<Props> = ({ issueDetails, mode }) => {
  const { setToastAlert } = useToast();

  const state = issueDetails.state_detail;
  const stateGroup = issueGroupFilter(state.group);

  const priority = issueDetails.priority ? issuePriorityFilter(issueDetails.priority) : null;

  const dueDateIcon = dueDateIconDetails(issueDetails.target_date, state.group);

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToastAlert({
        type: "success",
        title: "Link copied!",
        message: "Issue link copied to clipboard",
      });
    });
  };

  return (
    <div className={mode === "full" ? "divide-y divide-custom-border-200" : ""}>
      {mode === "full" && (
        <div className="flex justify-between gap-2 pb-3">
          <h6 className="flex items-center gap-2 font-medium">
            {/* {getStateGroupIcon(issue.state_detail.group, "16", "16", issue.state_detail.color)} */}
            {issueDetails.project_detail.identifier}-{issueDetails.sequence_id}
          </h6>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleCopyLink} className="-rotate-45">
              <Icon iconName="link" />
            </button>
          </div>
        </div>
      )}
      <div className={`space-y-4 ${mode === "full" ? "pt-3" : ""}`}>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="radio_button_checked" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">State</span>
          </div>
          <div className="w-3/4">
            {stateGroup && (
              <div className="inline-flex bg-custom-background-80 text-sm rounded px-2.5 py-0.5">
                <div className="flex items-center gap-1.5 text-left text-custom-text-100">
                  <stateGroup.icon />
                  {addSpaceIfCamelCase(state?.name ?? "")}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="signal_cellular_alt" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Priority</span>
          </div>
          <div className="w-3/4">
            <div
              className={`inline-flex items-center gap-1.5 text-left text-sm capitalize rounded px-2.5 py-0.5 ${
                priority?.key === "urgent"
                  ? "border-red-500/20 bg-red-500/20 text-red-500"
                  : priority?.key === "high"
                  ? "border-orange-500/20 bg-orange-500/20 text-orange-500"
                  : priority?.key === "medium"
                  ? "border-yellow-500/20 bg-yellow-500/20 text-yellow-500"
                  : priority?.key === "low"
                  ? "border-green-500/20 bg-green-500/20 text-green-500"
                  : "bg-custom-background-80 border-custom-border-200"
              }`}
            >
              {priority && (
                <span className="grid place-items-center -my-1">
                  <Icon iconName={priority?.icon!} />
                </span>
              )}
              <span>{priority?.title ?? "None"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="calendar_today" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Due date</span>
          </div>
          <div>
            {issueDetails.target_date ? (
              <div className="h-6 rounded flex items-center gap-1 px-2.5 py-1 border border-custom-border-100 text-custom-text-100 text-xs bg-custom-background-80">
                <span className={`material-symbols-rounded text-sm -my-0.5 ${dueDateIcon.className}`}>
                  {dueDateIcon.iconName}
                </span>
                {renderFullDate(issueDetails.target_date)}
              </div>
            ) : (
              <span className="text-custom-text-200">Empty</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
