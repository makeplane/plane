/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ChevronLeftOutline, ChevronRightOutline } from "@makeplane/propel/icons";
import { formatDuration, getMonthGrid, parseDateKey, shiftMonths } from "@plane/services";
import type { TBoardStatus, TReportKindName } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useCalendarSettings } from "@/hooks/team-ops/use-work-calendar";
import { useReportBoard, useWorkReport } from "@/hooks/team-ops/use-work-reports";

type Props = { workspaceSlug: string };

const monthFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const dayFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });

const CELL: Record<TBoardStatus, { label: string; className: string }> = {
  SUBMITTED: { label: "Submitted", className: "bg-success-subtle text-success-primary" },
  DRAFT: { label: "Draft", className: "bg-warning-subtle text-warning-primary" },
  MISSING: { label: "Missing", className: "bg-danger-subtle text-danger-primary" },
  NOT_EXPECTED: { label: "–", className: "text-tertiary" },
};

type Selected = { user: string; start: string };

const ReportDialogBody = observer(function ReportDialogBody({
  workspaceSlug,
  kind,
  selected,
}: {
  workspaceSlug: string;
  kind: TReportKindName;
  selected: Selected;
}) {
  const { getUserDetails } = useMember();
  const { report } = useWorkReport(workspaceSlug, kind, selected.start, selected.user);
  const sections: [string, string][] = report
    ? [
        ["Done", report.done],
        ["Blocked by", report.blockers],
        ["Next", report.next_steps],
      ]
    : [];
  return (
    <DialogMain>
      <DialogHeader>
        <DialogHeading>
          <DialogTitle>
            {getUserDetails(selected.user)?.display_name ?? "Report"} · {dayFormat.format(parseDateKey(selected.start))}
          </DialogTitle>
        </DialogHeading>
      </DialogHeader>
      <DialogBody tabIndex={0}>
        {!report ? null : report.status === null ? (
          <p className="text-body-sm-regular text-tertiary">Nothing was written for this period.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-caption-sm-regular text-tertiary">
              {report.status === "SUBMITTED" ? "Submitted" : "Draft, not submitted"}
              {report.logged_seconds > 0
                ? ` · ${formatDuration(report.logged_seconds, "en-US")} logged in Time Tracking`
                : ""}
            </p>
            {sections.map(([label, text]) => (
              <section key={label}>
                <h3 className="text-body-xs-medium text-secondary">{label}</h3>
                <p className="text-body-sm-regular whitespace-pre-wrap text-primary">{text || "–"}</p>
              </section>
            ))}
          </div>
        )}
      </DialogBody>
    </DialogMain>
  );
});

/** People by days (or weeks): who has handed in their report, who has not. Click a cell to read it. */
export const ReportsBoardRoot = observer(function ReportsBoardRoot({ workspaceSlug }: Props) {
  const [kind, setKind] = useState<TReportKindName>("DAILY");
  const [reference, setReference] = useState(() => new Date());
  const [selected, setSelected] = useState<Selected | null>(null);
  const { getUserDetails } = useMember();
  const { permissions } = useCalendarSettings(workspaceSlug);

  const grid = useMemo(() => getMonthGrid(reference, 1), [reference]);
  const monthStart = `${grid.year}-${String(grid.month + 1).padStart(2, "0")}-01`;
  const { board, error } = useReportBoard(workspaceSlug, permissions?.can_view_team ?? false, {
    kind,
    from: kind === "DAILY" ? monthStart : grid.from,
    to: grid.to,
  });

  if (!permissions) return null;
  if (!permissions.can_view_team) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <p className="rounded-lg border border-dashed border-subtle p-4 text-body-sm-regular text-tertiary">
          The team board is only open to the people your workspace admins chose. Ask an admin if you need it.
        </p>
      </div>
    );
  }

  const periods = (board?.periods ?? []).filter(
    (start) => kind === "WEEKLY" || parseDateKey(start).getMonth() === grid.month
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconButton
            icon={<Icon icon={ChevronLeftOutline} />}
            variant="ghost"
            size="sm"
            aria-label="Previous month"
            onClick={() => setReference((c) => shiftMonths(c, -1))}
          />
          <h2 className="min-w-44 text-center text-body-sm-medium text-primary">{monthFormat.format(reference)}</h2>
          <IconButton
            icon={<Icon icon={ChevronRightOutline} />}
            variant="ghost"
            size="sm"
            aria-label="Next month"
            onClick={() => setReference((c) => shiftMonths(c, 1))}
          />
        </div>
        <div role="group" aria-label="Report type" className="flex gap-1">
          {(["DAILY", "WEEKLY"] as const).map((item) => (
            <Button
              key={item}
              type="button"
              variant={kind === item ? "primary" : "secondary"}
              size="sm"
              stretch="auto"
              label={item === "DAILY" ? "Daily" : "Weekly"}
              aria-pressed={kind === item}
              onClick={() => setKind(item)}
            />
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-body-sm-medium text-danger-primary">
          The board could not be loaded. Reload the page to try again.
        </p>
      ) : null}

      {board ? (
        <div className="overflow-x-auto rounded-lg border border-subtle bg-surface-1">
          <table className="w-full text-left">
            <thead className="border-b border-subtle bg-layer-1 text-caption-sm-medium text-tertiary">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Person
                </th>
                {periods.map((start) => (
                  <th key={start} scope="col" className="px-1 py-2 text-center tabular-nums">
                    {kind === "DAILY" ? parseDateKey(start).getDate() : dayFormat.format(parseDateKey(start))}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2">
                  Missing
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle text-body-sm-regular text-primary">
              {board.people.map((person) => (
                <tr key={person.user}>
                  <td className="px-3 py-2">{getUserDetails(person.user)?.display_name ?? "Unknown"}</td>
                  {person.periods
                    .filter((cell) => periods.includes(cell.start))
                    .map((cell) => (
                      <td key={cell.start} className="p-0.5 text-center">
                        <button
                          type="button"
                          title={CELL[cell.status].label}
                          aria-label={`${CELL[cell.status].label}, ${dayFormat.format(parseDateKey(cell.start))}`}
                          disabled={cell.status === "NOT_EXPECTED"}
                          onClick={() => setSelected({ user: person.user, start: cell.start })}
                          className={cn(
                            "h-7 w-full min-w-7 rounded-sm text-caption-sm-medium",
                            CELL[cell.status].className
                          )}
                        >
                          {cell.status === "SUBMITTED"
                            ? "✓"
                            : cell.status === "DRAFT"
                              ? "…"
                              : cell.status === "MISSING"
                                ? "!"
                                : "–"}
                        </button>
                      </td>
                    ))}
                  <td className="px-3 py-2 tabular-nums">{person.missing || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="text-caption-sm-regular text-tertiary">
        ✓ submitted · … draft · ! expected and missing · – not expected (weekend, holiday, day off, leave or not
        started).
      </p>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent size="md">
          {selected ? <ReportDialogBody workspaceSlug={workspaceSlug} kind={kind} selected={selected} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
});
