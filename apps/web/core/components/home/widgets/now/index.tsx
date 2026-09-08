/**
 * Questimus fork change (Phase 3): "Now" home section — issues assigned to me,
 * state open, with priority urgent/high OR due within the next 7 days
 * (includes overdue). Computed per request (migration-karol.md §5.7).
 */

import { observer } from "mobx-react";
import { addDays, startOfDay } from "date-fns";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { HomeIssueRow } from "../issue-row";
import { useHomeIssues, issueDueDate, isOpenIssue } from "../use-home-issues";

const MAX_ROWS = 8;

export const NowWidget = observer(function NowWidget({ workspaceSlug }: { workspaceSlug: string }) {
  const { data: currentUser } = useUser();
  const { issues, isLoading } = useHomeIssues(workspaceSlug, currentUser?.id);

  const today = startOfDay(new Date());
  const inSevenDays = addDays(today, 7);

  const now = issues
    .filter(isOpenIssue)
    .filter((issue) => {
      const urgentOrHigh = issue.priority === "urgent" || issue.priority === "high";
      const due = issueDueDate(issue);
      return urgentOrHigh || (due !== null && due >= today && due <= inSevenDays);
    })
    .slice(0, MAX_ROWS);

  return (
    <section className="rounded-md border border-custom-border-200 bg-custom-background-100 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-body-lg font-semibold text-primary">Now</h3>
        <span className="text-body-xs text-secondary">urgent/high or due ≤ 7 days</span>
      </div>
      {isLoading ? (
        <p className="px-2 py-3 text-body-xs text-secondary">Loading…</p>
      ) : now.length > 0 ? (
        <div className="flex flex-col">
          {now.map((issue) => (
            <HomeIssueRow key={issue.id} issue={issue} workspaceSlug={workspaceSlug} />
          ))}
        </div>
      ) : (
        <p className="px-2 py-3 text-body-xs text-secondary">Nothing here.</p>
      )}
    </section>
  );
});
