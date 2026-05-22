/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect, Suspense, startTransition } from "react";
import { observer } from "mobx-react";
// hooks
import { useSupportTicket } from "@/hooks/store/use-support-ticket";
import { useMember } from "@/hooks/store/use-member";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// types
import { EIssuesStoreType } from "@plane/types";
// utils
import { sanitizeHTML } from "@plane/utils";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  high: { label: "High", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  medium: { label: "Medium", color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  low: { label: "Low", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  none: { label: "None", color: "#a3a3a3", bg: "rgba(163,163,163,0.12)" },
};

export const SupportTicketTable = observer(function SupportTicketTable({
  workspaceSlug,
  projectId,
}: Props) {
  const { ticketIds, ticketMap, loader, fetchTickets } = useSupportTicket();
  const { getUserDetails } = useMember();
  const { issueMap } = useIssues();
  const { getStateById, getProjectStateIds, fetchProjectStates } = useProjectState();
  const { setPeekIssue } = useIssueDetail();

  const stateIds = getProjectStateIds(projectId);

  useEffect(() => {
    if (workspaceSlug && projectId) {
      fetchTickets(workspaceSlug, projectId);
      if (stateIds === undefined || stateIds.length === 0) {
        fetchProjectStates(workspaceSlug, projectId);
      }
    }
  }, [workspaceSlug, projectId, fetchTickets, fetchProjectStates, stateIds]);

  if (loader) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-tertiary">Loading tickets...</span>
        </div>
      </div>
    );
  }

  if (ticketIds.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-xl bg-layer-1 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-tertiary"
            >
              <path d="M15 5v2" />
              <path d="M15 11v2" />
              <path d="M15 17v2" />
              <path d="M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-primary">No support tickets yet</h3>
          <p className="max-w-md text-sm text-tertiary">
            Create your first support ticket or configure email ingestion to automatically receive
            tickets from incoming emails.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr className="border-b border-subtle bg-layer-1">
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">
              Ticket Number
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">
              Title
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">
              Description
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">
              Priority
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">
              State
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">
              Tech
            </th>
          </tr>
        </thead>
        <tbody>
          {ticketIds.map((ticketId) => {
            const ticket = ticketMap[ticketId];
            if (!ticket) return null;

            // Get reactive issue if loaded in global issues store
            const issue = issueMap[ticket.issue_id];

            // Resolve values reactively
            const title = issue?.name ?? ticket.issue_name;
            const description = issue?.description_html
              ? sanitizeHTML(issue.description_html)
              : ticket.issue_description_stripped;
            const priority = issue?.priority ?? ticket.issue_priority;
            const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none;

            let stateName = ticket.issue_state_name;
            let stateColor = ticket.issue_state_color;
            if (issue?.state_id) {
              const state = getStateById(issue.state_id);
              if (state) {
                stateName = state.name;
                stateColor = state.color;
              }
            }

            const assigneeIds = issue?.assignee_ids ?? ticket.assignee_ids;
            const assigneeNames = assigneeIds
              .map((assigneeId) => {
                const member = getUserDetails(assigneeId);
                return member?.display_name || "Unknown";
              })
              .filter(Boolean);

            return (
              <tr
                key={ticket.id}
                className="group border-b border-subtle transition-colors hover:bg-layer-1 cursor-pointer"
                onClick={() => {
                  startTransition(() => {
                    setPeekIssue({
                      workspaceSlug,
                      projectId,
                      issueId: ticket.issue_id,
                    });
                  });
                }}
              >
                {/* Ticket Number */}
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-md bg-primary/8 px-2 py-1 font-mono text-xs font-medium text-primary">
                    {ticket.ticket_display}
                  </span>
                </td>

                {/* Title */}
                <td className="max-w-[250px] px-4 py-3">
                  <span className="line-clamp-1 text-sm font-medium text-primary">
                    {title}
                  </span>
                </td>

                {/* Description */}
                <td className="max-w-[300px] px-4 py-3">
                  <span className="line-clamp-1 text-sm text-tertiary">
                    {description || "No description"}
                  </span>
                </td>

                {/* Priority */}
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      color: priorityConfig.color,
                      backgroundColor: priorityConfig.bg,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: priorityConfig.color }}
                    />
                    {priorityConfig.label}
                  </span>
                </td>

                {/* State */}
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stateColor || "#a3a3a3" }}
                    />
                    <span className="text-secondary">{stateName || "—"}</span>
                  </span>
                </td>

                {/* Tech / Assignees */}
                <td className="whitespace-nowrap px-4 py-3">
                  {assigneeNames.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-1.5">
                        {assigneeNames.slice(0, 3).map((name, i) => (
                          <div
                            key={i}
                            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-1 bg-primary/10 text-[10px] font-semibold uppercase text-primary"
                            title={name}
                          >
                            {name[0]}
                          </div>
                        ))}
                      </div>
                      <span className="ml-1 text-sm text-secondary">
                        {assigneeNames.length <= 3
                          ? assigneeNames.join(", ")
                          : `${assigneeNames.slice(0, 2).join(", ")} +${assigneeNames.length - 2}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-placeholder">Unassigned</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Suspense fallback={null}>
        <IssuePeekOverview storeType={EIssuesStoreType.PROJECT} />
      </Suspense>
    </div>
  );
});
