// ui
import { StateGroupIcon, TOAST_TYPE, setToast } from "@plane/ui";
// icons
import { Icon } from "@/components/ui";
// constants
import { issueGroupFilter, issuePriorityFilter } from "@/constants/issue";
// helpers
import { renderFullDate } from "@/helpers/date-time.helper";
import { copyTextToClipboard, addSpaceIfCamelCase } from "@/helpers/string.helper";
// types
import { IIssue, IPeekMode } from "@/types/issue";
// components
import { dueDateIconDetails } from "../board-views/block-due-date";

type Props = {
  issueDetails: IIssue;
  mode?: IPeekMode;
};

export const PeekOverviewIssueProperties: React.FC<Props> = ({ issueDetails, mode }) => {
  const state = issueDetails.state_detail;
  const stateGroup = issueGroupFilter(state.group);

  const priority = issueDetails.priority ? issuePriorityFilter(issueDetails.priority) : null;

  const dueDateIcon = dueDateIconDetails(issueDetails.target_date, state.group);

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToast({
        type: TOAST_TYPE.INFO,
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
          <div className="flex w-1/4 flex-shrink-0 items-center gap-2 font-medium">
            <Icon iconName="radio_button_checked" className="flex-shrink-0 !text-base" />
            <span className="flex-grow truncate">State</span>
          </div>
          <div className="w-3/4">
            {stateGroup && (
              <div className="inline-flex rounded bg-custom-background-80 px-2.5 py-0.5 text-sm">
                <div className="flex items-center gap-1.5 text-left text-custom-text-100">
                  <StateGroupIcon stateGroup={state.group} color={state.color} />
                  {addSpaceIfCamelCase(state?.name ?? "")}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex w-1/4 flex-shrink-0 items-center gap-2 font-medium">
            <Icon iconName="signal_cellular_alt" className="flex-shrink-0 !text-base" />
            <span className="flex-grow truncate">Priority</span>
          </div>
          <div className="w-3/4">
            <div
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-left text-sm capitalize ${
                priority?.key === "urgent"
                  ? "border-red-500/20 bg-red-500/20 text-red-500"
                  : priority?.key === "high"
                    ? "border-orange-500/20 bg-orange-500/20 text-orange-500"
                    : priority?.key === "medium"
                      ? "border-yellow-500/20 bg-yellow-500/20 text-yellow-500"
                      : priority?.key === "low"
                        ? "border-green-500/20 bg-green-500/20 text-green-500"
                        : "border-custom-border-200 bg-custom-background-80"
              }`}
            >
              {priority && (
                <span className="-my-1 grid place-items-center">
                  <Icon iconName={priority?.icon} />
                </span>
              )}
              <span>{priority?.title ?? "None"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex w-1/4 flex-shrink-0 items-center gap-2 font-medium">
            <Icon iconName="calendar_today" className="flex-shrink-0 !text-base" />
            <span className="flex-grow truncate">Due date</span>
          </div>
          <div>
            {issueDetails.target_date ? (
              <div className="flex h-6 items-center gap-1 rounded border border-custom-border-100 bg-custom-background-80 px-2.5 py-1 text-xs text-custom-text-100">
                <span className={`material-symbols-rounded -my-0.5 text-sm ${dueDateIcon.className}`}>
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
