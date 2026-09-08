/**
 * Questimus fork change (Phase 3): "Today" home section — issues assigned to
 * me, state open, due today or overdue. Computed per request (§5.7).
 */

import { observer } from "mobx-react";
import { startOfDay } from "date-fns";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { HomeIssueRow } from "../issue-row";
import { useHomeIssues, issueDueDate, isOpenIssue } from "../use-home-issues";

const MAX_ROWS = 8;

export const TodayWidget = observer(function TodayWidget({ workspaceSlug }: { workspaceSlug: string }) {
  const { data: currentUser } = useUser();
  const { issues, isLoading } = useHomeIssues(workspaceSlug, currentUser?.id);

  const today = startOfDay(new Date());

  const todayIssues = issues
    .filter(isOpenIssue)
    .filter((issue) => {
      const due = issueDueDate(issue);
      return due !== null && due <= today;
    })
    .slice(0, MAX_ROWS);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-14 font-semibold text-tertiary">Today</h3>
        <span className="text-body-xs text-secondary">due today or overdue</span>
      </div>
      {isLoading ? (
        <p className="px-2 py-3 text-body-xs text-secondary">Loading…</p>
      ) : todayIssues.length > 0 ? (
        <div className="flex flex-col">
          {todayIssues.map((issue) => (
            <HomeIssueRow key={issue.id} issue={issue} workspaceSlug={workspaceSlug} />
          ))}
        </div>
      ) : (
        <p className="px-2 py-3 text-body-xs text-secondary">Nothing here.</p>
      )}
    </section>
  );
});
