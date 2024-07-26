"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CalendarCheck2, Signal } from "lucide-react";
// ui
import { DoubleCircleIcon, StateGroupIcon, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { Icon } from "@/components/ui";
// constants
import { issuePriorityFilter } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
import { copyTextToClipboard, addSpaceIfCamelCase } from "@/helpers/string.helper";
// hooks
import { usePublish, useStates } from "@/hooks/store";
// types
import { IIssue, IPeekMode } from "@/types/issue";

type Props = {
  issueDetails: IIssue;
  mode?: IPeekMode;
};

export const PeekOverviewIssueProperties: React.FC<Props> = observer(({ issueDetails, mode }) => {
  const { getStateById } = useStates();
  const state = getStateById(issueDetails?.state_id ?? undefined);

  const { anchor } = useParams();

  const { project_details } = usePublish(anchor?.toString());

  const priority = issueDetails.priority ? issuePriorityFilter(issueDetails.priority) : null;

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
            {project_details?.identifier}-{issueDetails.sequence_id}
          </h6>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleCopyLink} className="-rotate-45">
              <Icon iconName="link" />
            </button>
          </div>
        </div>
      )}
      <div className={`space-y-2 ${mode === "full" ? "pt-3" : ""}`}>
        <div className="flex items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <DoubleCircleIcon className="size-4 flex-shrink-0" />
            <span>State</span>
          </div>
          <div className="w-3/4 flex items-center gap-1.5 py-0.5 text-sm">
            <StateGroupIcon stateGroup={state?.group ?? "backlog"} color={state?.color} />
            {addSpaceIfCamelCase(state?.name ?? "")}
          </div>
        </div>

        <div className="flex items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Signal className="size-4 flex-shrink-0" />
            <span>Priority</span>
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

        <div className="flex items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <CalendarCheck2 className="size-4 flex-shrink-0" />
            <span>Due date</span>
          </div>
          <div>
            {issueDetails.target_date ? (
              <div
                className={cn("flex items-center gap-1.5 rounded py-0.5 text-xs text-custom-text-100", {
                  "text-red-500": shouldHighlightIssueDueDate(issueDetails.target_date, state?.group),
                })}
              >
                <CalendarCheck2 className="size-3" />
                {renderFormattedDate(issueDetails.target_date)}
              </div>
            ) : (
              <span className="text-custom-text-200">Empty</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
