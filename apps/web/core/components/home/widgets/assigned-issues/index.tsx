/**
 * Questimus fork change (Phase 3): "My Issues" home section — issues assigned
 * to the current user across all projects, with Pending / Upcoming / Overdue /
 * Completed tabs. Computed per request from the assigned-issues fetch.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { HomeIssueRow } from "../issue-row";
import { useHomeIssues, issueDueDate, isOpenIssue, type THomeIssue } from "../use-home-issues";

type TTab = "pending" | "upcoming" | "overdue" | "completed";

const TABS: { key: TTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Marked completed" },
];

const MAX_ROWS = 8;

function splitIssues(issues: THomeIssue[], today: Date) {
  const open = issues.filter(isOpenIssue);
  const closed = issues.filter((i) => !isOpenIssue(i));
  return {
    pending: open,
    upcoming: open.filter((i) => {
      const due = issueDueDate(i);
      return due !== null && due > today;
    }),
    overdue: open.filter((i) => {
      const due = issueDueDate(i);
      return due !== null && due <= today;
    }),
    completed: closed,
  };
}

export const AssignedIssuesWidget = observer(function AssignedIssuesWidget({ workspaceSlug }: { workspaceSlug: string }) {
  const [tab, setTab] = useState<TTab>("pending");
  const { data: currentUser } = useUser();
  const { issues, isLoading } = useHomeIssues(workspaceSlug, currentUser?.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lists = splitIssues(issues, today);
  const rows = lists[tab].slice(0, MAX_ROWS);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-14 font-semibold text-tertiary">My Issues</h3>
        <span className="text-body-xs text-secondary">{lists.pending.length} pending</span>
      </div>
      <div className="mb-3 flex items-center gap-1">
        {TABS.map((tabOption) => (
          <button
            key={tabOption.key}
            type="button"
            onClick={() => setTab(tabOption.key)}
            className={`rounded-sm px-2 py-1 text-body-xs font-medium transition-colors ${
              tab === tabOption.key
                ? "bg-layer-transparent-active text-primary"
                : "text-secondary hover:bg-layer-transparent-hover"
            }`}
          >
            {tabOption.label} ({lists[tabOption.key].length})
          </button>
        ))}
      </div>
      {isLoading ? (
        <p className="px-2 py-3 text-body-xs text-secondary">Loading…</p>
      ) : rows.length > 0 ? (
        <div className="flex flex-col">
          {rows.map((issue) => (
            <HomeIssueRow key={issue.id} issue={issue} workspaceSlug={workspaceSlug} />
          ))}
        </div>
      ) : (
        <p className="px-2 py-3 text-body-xs text-secondary">Nothing here.</p>
      )}
    </section>
  );
});
