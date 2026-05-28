/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect, Suspense, startTransition, useState, useMemo } from "react";
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

/** Resolved state groups that indicate a ticket is no longer active */
const RESOLVED_STATE_GROUPS = new Set(["completed", "cancelled"]);

/** Format a date string to a readable format like "28 May 2026" */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

/** Check if a due date has passed and the ticket is still unresolved */
function isOverdue(targetDate: string | null | undefined, stateGroup: string | undefined): boolean {
  if (!targetDate) return false;
  if (stateGroup && RESOLVED_STATE_GROUPS.has(stateGroup)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(targetDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

const FilterIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path
      fillRule="evenodd"
      d="M2.628 1.628a.75.75 0 011.06 0L10 7.94l6.312-6.312a.75.75 0 111.06 1.06L11.06 9v7.19a.75.75 0 01-.3.6l-3 2.25a.75.75 0 01-1.2-.6V9L2.628 2.688a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

export const SupportTicketTable = observer(function SupportTicketTable({ workspaceSlug, projectId }: Props) {
  const { ticketIds, ticketMap, loader, fetchTickets } = useSupportTicket();
  const { getUserDetails } = useMember();
  const { issueMap } = useIssues();
  const { getStateById, getProjectStateIds, fetchProjectStates } = useProjectState();
  const { setPeekIssue } = useIssueDetail();

  // Filter States
  const [activeDropdown, setActiveDropdown] = useState<"priority" | "status" | "tech" | null>(null);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);

  const stateIds = getProjectStateIds(projectId);

  // Close dropdown on outside clicks
  useEffect(() => {
    const handleClose = () => setActiveDropdown(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  useEffect(() => {
    if (workspaceSlug && projectId) {
      fetchTickets(workspaceSlug, projectId);
      if (stateIds === undefined || stateIds.length === 0) {
        fetchProjectStates(workspaceSlug, projectId);
      }
    }
  }, [workspaceSlug, projectId, fetchTickets, fetchProjectStates, stateIds]);

  // Pre-calculate all ticket fields for robust, clean rendering and filtering
  const resolvedTickets = useMemo(() => {
    return ticketIds
      .map((ticketId) => {
        const ticket = ticketMap[ticketId];
        if (!ticket) return null;
        const issue = issueMap[ticket.issue_id];

        const title = issue?.name ?? ticket.issue_name;
        const description = issue?.description_html
          ? sanitizeHTML(issue.description_html)
          : ticket.issue_description_stripped;
        const priority = issue?.priority ?? ticket.issue_priority;
        const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none;

        let stateName = ticket.issue_state_name;
        let stateColor = ticket.issue_state_color;
        let stateGroup = ticket.issue_state_group;
        if (issue?.state_id) {
          const state = getStateById(issue.state_id);
          if (state) {
            stateName = state.name;
            stateColor = state.color;
            stateGroup = state.group;
          }
        }

        const targetDate = issue?.target_date ?? ticket.issue_target_date;
        const overdue = isOverdue(targetDate, stateGroup);

        const assigneeIds = issue?.assignee_ids ?? ticket.assignee_ids;
        const assigneeNames = assigneeIds
          .map((assigneeId) => {
            const member = getUserDetails(assigneeId);
            return member?.display_name || "Unknown";
          })
          .filter(Boolean);

        return {
          id: ticket.id,
          ticket,
          issue,
          title,
          description,
          priority,
          priorityConfig,
          stateName: stateName || "—",
          stateColor,
          stateGroup,
          targetDate,
          createdAt: ticket.created_at,
          overdue,
          assigneeNames,
        };
      })
      .filter(Boolean);
  }, [ticketIds, ticketMap, issueMap, getStateById, getUserDetails]) as any[];

  // Unique status list gathered dynamically from loaded tickets
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    resolvedTickets.forEach((t: any) => {
      if (t.stateName && t.stateName !== "—") {
        statuses.add(t.stateName);
      }
    });
    return Array.from(statuses).toSorted();
  }, [resolvedTickets]);

  // Unique assignee names gathered dynamically from loaded tickets
  const uniqueTechs = useMemo(() => {
    const techs = new Set<string>();
    resolvedTickets.forEach((t: any) => {
      t.assigneeNames.forEach((name: string) => techs.add(name));
    });
    return Array.from(techs).toSorted();
  }, [resolvedTickets]);

  // Apply filters reactively
  const filteredTickets = useMemo(() => {
    return resolvedTickets.filter((t: any) => {
      // 1. Filter by Priority
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(t.priority)) {
        return false;
      }
      // 2. Filter by Status
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(t.stateName)) {
        return false;
      }
      // 3. Filter by Tech
      if (selectedTechs.length > 0) {
        const hasMatchingTech = t.assigneeNames.some((name: string) => selectedTechs.includes(name));
        const hasUnassigned = selectedTechs.includes("Unassigned") && t.assigneeNames.length === 0;
        if (!hasMatchingTech && !hasUnassigned) {
          return false;
        }
      }
      return true;
    });
  }, [resolvedTickets, selectedPriorities, selectedStatuses, selectedTechs]);

  if (loader) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
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
          <p className="text-sm max-w-md text-tertiary">
            Create your first support ticket or configure email ingestion to automatically receive tickets from incoming
            emails.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto">
      <table className="w-full min-w-[1100px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-subtle bg-layer-1">
            <th className="text-xs tracking-wider w-[170px] px-4 py-3 text-left font-semibold whitespace-nowrap text-tertiary uppercase">
              Ticket Number
            </th>
            <th className="text-xs tracking-wider w-[230px] px-4 py-3 text-left font-semibold whitespace-nowrap text-tertiary uppercase">
              Title
            </th>
            <th className="text-xs tracking-wider w-[320px] px-4 py-3 text-left font-semibold whitespace-nowrap text-tertiary uppercase">
              Description
            </th>
            <th className="text-xs tracking-wider w-[130px] px-4 py-3 text-left font-semibold whitespace-nowrap text-tertiary uppercase">
              Created Date
            </th>

            {/* Priority Header with Dropdown */}
            <th className="text-xs tracking-wider relative w-[125px] px-4 py-3 text-left font-semibold whitespace-nowrap text-tertiary uppercase">
              <div className="flex items-center justify-between gap-1">
                <span>Priority</span>
                <button
                  type="button"
                  className={`rounded p-1 transition-colors hover:bg-layer-2 ${
                    selectedPriorities.length > 0
                      ? "text-custom-brand-100 bg-custom-brand-100/10 font-bold"
                      : "text-tertiary"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === "priority" ? null : "priority");
                  }}
                >
                  <FilterIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {activeDropdown === "priority" && (
                <div
                  role="menu"
                  tabIndex={0}
                  className="shadow-xl font-normal text-sm absolute top-full left-4 z-50 mt-1.5 min-w-[150px] rounded-lg border border-subtle bg-layer-1 p-2 text-primary normal-case"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
                      const checked = selectedPriorities.includes(key);
                      return (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors select-none hover:bg-layer-2"
                        >
                          <input
                            type="checkbox"
                            className="text-custom-brand-100 h-3.5 w-3.5 cursor-pointer rounded border-subtle focus:ring-0"
                            checked={checked}
                            onChange={() => {
                              setSelectedPriorities(
                                checked ? selectedPriorities.filter((p) => p !== key) : [...selectedPriorities, key]
                              );
                            }}
                          />
                          <span>{config.label}</span>
                        </label>
                      );
                    })}
                    {selectedPriorities.length > 0 && (
                      <button
                        type="button"
                        className="text-xs mt-1 border-t border-subtle pt-1.5 text-left font-medium text-danger-primary hover:underline"
                        onClick={() => setSelectedPriorities([])}
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                </div>
              )}
            </th>

            {/* Status Header with Dropdown */}
            <th className="text-xs tracking-wider relative w-[125px] px-4 py-3 text-left font-semibold whitespace-nowrap text-tertiary uppercase">
              <div className="flex items-center justify-between gap-1">
                <span>Status</span>
                <button
                  type="button"
                  className={`rounded p-1 transition-colors hover:bg-layer-2 ${
                    selectedStatuses.length > 0
                      ? "text-custom-brand-100 bg-custom-brand-100/10 font-bold"
                      : "text-tertiary"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === "status" ? null : "status");
                  }}
                >
                  <FilterIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {activeDropdown === "status" && (
                <div
                  role="menu"
                  tabIndex={0}
                  className="shadow-xl font-normal text-sm absolute top-full left-4 z-50 mt-1.5 min-w-[160px] rounded-lg border border-subtle bg-layer-1 p-2 text-primary normal-case"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <div className="flex max-h-[220px] flex-col gap-1.5 overflow-y-auto">
                    {uniqueStatuses.length === 0 ? (
                      <span className="text-xs px-2 py-1 text-placeholder">No statuses found</span>
                    ) : (
                      uniqueStatuses.map((status) => {
                        const checked = selectedStatuses.includes(status);
                        return (
                          <label
                            key={status}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors select-none hover:bg-layer-2"
                          >
                            <input
                              type="checkbox"
                              className="text-custom-brand-100 h-3.5 w-3.5 cursor-pointer rounded border-subtle focus:ring-0"
                              checked={checked}
                              onChange={() => {
                                setSelectedStatuses(
                                  checked ? selectedStatuses.filter((s) => s !== status) : [...selectedStatuses, status]
                                );
                              }}
                            />
                            <span>{status}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {selectedStatuses.length > 0 && (
                    <button
                      type="button"
                      className="text-xs mt-1 w-full border-t border-subtle pt-1.5 text-left font-medium text-danger-primary hover:underline"
                      onClick={() => setSelectedStatuses([])}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              )}
            </th>

            {/* Tech Header with Dropdown */}
            <th className="text-xs tracking-wider relative w-[165px] px-4 py-3 text-left font-semibold whitespace-nowrap text-tertiary uppercase">
              <div className="flex items-center justify-between gap-1">
                <span>Tech</span>
                <button
                  type="button"
                  className={`rounded p-1 transition-colors hover:bg-layer-2 ${
                    selectedTechs.length > 0
                      ? "text-custom-brand-100 bg-custom-brand-100/10 font-bold"
                      : "text-tertiary"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === "tech" ? null : "tech");
                  }}
                >
                  <FilterIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {activeDropdown === "tech" && (
                <div
                  role="menu"
                  tabIndex={0}
                  className="shadow-xl font-normal text-sm absolute top-full left-4 z-50 mt-1.5 min-w-[180px] rounded-lg border border-subtle bg-layer-1 p-2 text-primary normal-case"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <div className="flex max-h-[220px] flex-col gap-1.5 overflow-y-auto">
                    {/* Unassigned Checkbox */}
                    {(() => {
                      const checked = selectedTechs.includes("Unassigned");
                      return (
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors select-none hover:bg-layer-2">
                          <input
                            type="checkbox"
                            className="text-custom-brand-100 h-3.5 w-3.5 cursor-pointer rounded border-subtle focus:ring-0"
                            checked={checked}
                            onChange={() => {
                              setSelectedTechs(
                                checked
                                  ? selectedTechs.filter((t) => t !== "Unassigned")
                                  : [...selectedTechs, "Unassigned"]
                              );
                            }}
                          />
                          <span className="text-placeholder">Unassigned</span>
                        </label>
                      );
                    })()}

                    {uniqueTechs.map((tech) => {
                      const checked = selectedTechs.includes(tech);
                      return (
                        <label
                          key={tech}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors select-none hover:bg-layer-2"
                        >
                          <input
                            type="checkbox"
                            className="text-custom-brand-100 h-3.5 w-3.5 cursor-pointer rounded border-subtle focus:ring-0"
                            checked={checked}
                            onChange={() => {
                              setSelectedTechs(
                                checked ? selectedTechs.filter((t) => t !== tech) : [...selectedTechs, tech]
                              );
                            }}
                          />
                          <span>{tech}</span>
                        </label>
                      );
                    })}
                  </div>
                  {selectedTechs.length > 0 && (
                    <button
                      type="button"
                      className="text-xs mt-1 w-full border-t border-subtle pt-1.5 text-left font-medium text-danger-primary hover:underline"
                      onClick={() => setSelectedTechs([])}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              )}
            </th>

            <th className="text-xs tracking-wider w-[130px] px-4 py-3 text-left font-semibold whitespace-nowrap text-tertiary uppercase">
              Due Date
            </th>
            <th className="w-auto" />
          </tr>
        </thead>
        <tbody>
          {filteredTickets.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-sm px-4 py-12 text-center text-secondary">
                <div className="flex flex-col items-center gap-2">
                  <span className="font-medium">No tickets match the selected filters.</span>
                  <button
                    type="button"
                    className="text-xs text-custom-brand-100 hover:text-custom-brand-200 font-semibold underline transition-colors"
                    onClick={() => {
                      setSelectedPriorities([]);
                      setSelectedStatuses([]);
                      setSelectedTechs([]);
                    }}
                  >
                    Clear all active filters
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            filteredTickets.map(
              ({
                id,
                ticket,
                title,
                description,
                priorityConfig,
                stateName,
                stateColor,
                targetDate,
                createdAt,
                overdue,
                assigneeNames,
              }) => {
                return (
                  <tr
                    key={id}
                    className="group cursor-pointer border-b border-subtle transition-colors hover:bg-layer-1"
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
                    {/* Ticket Number — red dot + red text when overdue */}
                    <td className="overflow-hidden px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-mono text-xs inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium ${
                          overdue ? "bg-danger-subtle text-danger-primary" : "bg-primary/8 text-primary"
                        }`}
                      >
                        {overdue && (
                          <span
                            className="h-2 w-2 flex-shrink-0 rounded-full bg-danger-primary"
                            title="Overdue — due date has passed"
                          />
                        )}
                        {ticket.ticket_display}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="overflow-hidden px-4 py-3">
                      <span className="text-sm line-clamp-1 font-medium text-primary">{title}</span>
                    </td>

                    {/* Description */}
                    <td className="overflow-hidden px-4 py-3">
                      <span className="text-sm line-clamp-1 text-tertiary">{description || "No description"}</span>
                    </td>

                    {/* Created Date */}
                    <td className="overflow-hidden px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-secondary">{formatDate(createdAt)}</span>
                    </td>

                    {/* Priority */}
                    <td className="overflow-hidden px-4 py-3 whitespace-nowrap">
                      <span
                        className="text-xs inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium"
                        style={{
                          color: priorityConfig.color,
                          backgroundColor: priorityConfig.bg,
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: priorityConfig.color }} />
                        {priorityConfig.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="overflow-hidden px-4 py-3 whitespace-nowrap">
                      <span className="text-sm inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: stateColor || "#a3a3a3" }}
                        />
                        <span className="text-secondary">{stateName}</span>
                      </span>
                    </td>

                    {/* Tech / Assignees */}
                    <td className="overflow-hidden px-4 py-3 whitespace-nowrap">
                      {assigneeNames.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-1.5">
                            {assigneeNames.slice(0, 3).map((name: string) => (
                              <div
                                key={name}
                                className="border-surface-1 bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold text-primary uppercase"
                                title={name}
                              >
                                {name[0]}
                              </div>
                            ))}
                          </div>
                          <span className="text-sm ml-1 text-secondary">
                            {assigneeNames.length <= 3
                              ? assigneeNames.join(", ")
                              : `${assigneeNames.slice(0, 2).join(", ")} +${assigneeNames.length - 2}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-placeholder">Unassigned</span>
                      )}
                    </td>

                    {/* Due Date — red text when overdue */}
                    <td className="overflow-hidden px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm ${overdue ? "font-medium text-danger-primary" : "text-secondary"}`}>
                        {formatDate(targetDate)}
                      </span>
                    </td>

                    {/* Spacer Column cell */}
                    <td />
                  </tr>
                );
              }
            )
          )}
        </tbody>
      </table>
      <Suspense fallback={null}>
        <IssuePeekOverview storeType={EIssuesStoreType.PROJECT} />
      </Suspense>
    </div>
  );
});
