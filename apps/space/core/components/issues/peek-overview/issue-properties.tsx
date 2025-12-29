import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { LinkIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import {
  StatePropertyIcon,
  StateGroupIcon,
  PriorityPropertyIcon,
  DueDatePropertyIcon,
  PriorityIcon,
} from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn, getIssuePriorityFilters } from "@plane/utils";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
import { copyTextToClipboard, addSpaceIfCamelCase } from "@/helpers/string.helper";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useStates } from "@/hooks/store/use-state";
// types
import type { IIssue, IPeekMode } from "@/types/issue";

type Props = {
  issueDetails: IIssue;
  mode?: IPeekMode;
};

export const PeekOverviewIssueProperties = observer(function PeekOverviewIssueProperties({
  issueDetails,
  mode,
}: Props) {
  // hooks
  const { t } = useTranslation();
  const { getStateById } = useStates();
  const state = getStateById(issueDetails?.state_id ?? undefined);

  const { anchor } = useParams();

  const { project_details } = usePublish(anchor?.toString());

  const priority = issueDetails.priority ? getIssuePriorityFilters(issueDetails.priority) : null;

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Link copied!",
        message: "Work item link copied to clipboard",
      });
    });
  };

  return (
    <div className={mode === "full" ? "divide-y divide-subtle-1" : ""}>
      {mode === "full" && (
        <div className="flex justify-between gap-2 pb-3">
          <h6 className="flex items-center gap-2 font-medium">
            {project_details?.identifier}-{issueDetails.sequence_id}
          </h6>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleCopyLink} className="-rotate-45">
              <LinkIcon className="shrink-0 size-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className={`space-y-2 ${mode === "full" ? "pt-3" : ""}`}>
        <div className="flex items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-13 text-tertiary">
            <StatePropertyIcon className="size-4 flex-shrink-0" />
            <span>State</span>
          </div>
          <div className="w-3/4 flex items-center gap-1.5 py-0.5 text-13">
            <StateGroupIcon stateGroup={state?.group ?? "backlog"} color={state?.color} />
            {addSpaceIfCamelCase(state?.name ?? "")}
          </div>
        </div>

        <div className="flex items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-13 text-tertiary">
            <PriorityPropertyIcon className="size-4 flex-shrink-0" />
            <span>Priority</span>
          </div>
          <div className="w-3/4">
            <div
              className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 text-left text-13 capitalize bg-layer-2 ${
                priority?.key === "urgent"
                  ? "border-priority-urgent text-priority-urgent"
                  : priority?.key === "high"
                    ? "border-priority-high text-priority-high"
                    : priority?.key === "medium"
                      ? "border-priority-medium text-priority-medium"
                      : priority?.key === "low"
                        ? "border-priority-low text-priority-low"
                        : "border-priority-none text-priority-none"
              }`}
            >
              {priority && <PriorityIcon priority={priority?.key} size={12} className="flex-shrink-0" />}
              <span>{t(priority?.titleTranslationKey || "common.none")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-13 text-tertiary">
            <DueDatePropertyIcon className="size-4 flex-shrink-0" />
            <span>Due date</span>
          </div>
          <div>
            {issueDetails.target_date ? (
              <div
                className={cn("flex items-center gap-1.5 rounded-sm py-0.5 text-11 text-primary", {
                  "text-danger-primary": shouldHighlightIssueDueDate(issueDetails.target_date, state?.group),
                })}
              >
                <DueDatePropertyIcon className="size-3" />
                {renderFormattedDate(issueDetails.target_date)}
              </div>
            ) : (
              <span className="text-secondary text-13">Empty</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
