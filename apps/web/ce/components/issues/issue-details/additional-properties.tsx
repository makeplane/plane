import { useState, useCallback, useEffect } from "react";
import { observer } from "mobx-react";
// ui icons
import { Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/propel/input";
import { cn } from "@plane/utils";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
};

function formatHoursAndMinutes(m: number | null | undefined): string {
  if (!m) return "";
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h === 0) return `${mins}m`;
  if (mins === 0) return `${h}h`;
  return `${h}h ${mins}m`;
}

function parseHoursAndMinutes(val: string): number {
  const trimmed = val.trim();
  if (!trimmed) return 0;
  const match = trimmed.toLowerCase().match(/^(?:(\d+)h)?\s*(?:(\d+)m)?$/);
  if (!match) {
    const num = parseInt(trimmed, 10);
    return isNaN(num) || num < 0 ? 0 : num;
  }
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  return h * 60 + m;
}

export const WorkItemAdditionalSidebarProperties = observer(function WorkItemAdditionalSidebarProperties(
  props: TWorkItemAdditionalSidebarProperties
) {
  const { workItemId, workspaceSlug, projectId, isEditable } = props;
  const { t } = useTranslation();

  // hooks
  const {
    issue: { getIssueById },
    updateIssue,
  } = useIssueDetail();

  const issue = getIssueById(workItemId);
  const [draft, setDraft] = useState("");

  // Keep draft in sync with issue data
  useEffect(() => {
    if (issue) {
      setDraft(formatHoursAndMinutes(issue.estimate_time));
    }
  }, [issue?.estimate_time, issue]);

  const handleUpdate = useCallback(() => {
    if (!issue) return;
    const minutes = parseHoursAndMinutes(draft);
    if (minutes !== issue.estimate_time) {
      void updateIssue(workspaceSlug, projectId, workItemId, { estimate_time: minutes });
    } else {
      setDraft(formatHoursAndMinutes(issue.estimate_time));
    }
  }, [draft, issue, updateIssue, workspaceSlug, projectId, workItemId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setDraft(formatHoursAndMinutes(issue?.estimate_time));
      e.currentTarget.blur();
    }
  };

  if (!issue) return null;

  return (
    <>
      <SidebarPropertyListItem icon={Timer} label={t("common.estimate_time")}>
        <div className="relative flex h-7.5 w-full items-center">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={handleKeyDown}
            disabled={!isEditable}
            mode="true-transparent"
            inputSize="sm"
            placeholder={t("common.none")}
            className={cn(
              "w-full px-1.5 text-left transition-colors hover:bg-layer-transparent-hover focus:bg-layer-transparent-hover rounded-md text-body-xs-medium h-full",
              draft ? "text-primary" : "text-placeholder"
            )}
            title="E.g. 2h 30m or 150"
          />
        </div>
      </SidebarPropertyListItem>
    </>
  );
});
