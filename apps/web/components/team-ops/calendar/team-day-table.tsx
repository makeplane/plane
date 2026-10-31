/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { Button } from "@makeplane/propel/components/button";
import { LEAVE_TYPE_LABELS, formatDuration, formatTimeRange, parseDateKey } from "@plane/services";
import type { TTeamDayResponse, TTeamDayRow } from "@plane/types";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { DayKindBadge } from "./work-mode";

type Props = {
  workspaceSlug: string;
  day: TTeamDayResponse | undefined;
  isLoading: boolean;
  /** When given, each row gets an Edit button that calls it. Leave out when the caller cannot change plans. */
  onEdit?: (row: TTeamDayRow) => void;
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const COLUMNS = ["Person", "Plan", "Planned hours", "Note", "Logged", "Main project"];

function Empty() {
  return <span className="text-tertiary">–</span>;
}

/** The people of one day, each with their plan and the time Time Tracking logged that day. */
export const TeamDayTable = observer(function TeamDayTable({ workspaceSlug, day, isLoading, onEdit }: Props) {
  const { getUserDetails } = useMember();

  if (!day) {
    return isLoading ? <p className="text-body-sm-regular text-tertiary">Loading the day…</p> : null;
  }

  return (
    <section aria-label="Selected day" className="flex flex-col gap-2">
      <div>
        <h2 className="text-h6-medium text-primary">{dateFormat.format(parseDateKey(day.date))}</h2>
        {day.holiday ? <p className="text-caption-sm-regular text-tertiary">Holiday: {day.holiday}</p> : null}
      </div>
      {day.rows.length === 0 ? (
        <p className="text-body-sm-regular text-tertiary">Nobody matches the filters on this day.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-subtle bg-surface-1">
          <table className="w-full min-w-176 text-left">
            <thead className="border-b border-subtle bg-layer-1 text-caption-sm-medium text-tertiary">
              <tr>
                {COLUMNS.map((column) => (
                  <th key={column} scope="col" className="px-3 py-2">
                    {column}
                  </th>
                ))}
                {onEdit ? (
                  <th scope="col" className="px-3 py-2">
                    <span className="sr-only">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle text-body-sm-regular text-primary">
              {day.rows.map((row) => {
                const hours = formatTimeRange(row.planned_start_time, row.planned_end_time);
                return (
                  <tr key={row.user}>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <ButtonAvatars showTooltip={false} userIds={row.user} size="xs" />
                        <span className="truncate">{getUserDetails(row.user)?.display_name ?? "Unknown"}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {row.kind ? (
                        <DayKindBadge
                          kind={row.kind}
                          label={row.leave_type ? LEAVE_TYPE_LABELS[row.leave_type] : undefined}
                        />
                      ) : (
                        <Empty />
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{hours || <Empty />}</td>
                    <td className="max-w-56 truncate px-3 py-2">{row.description || <Empty />}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.logged_seconds > 0 ? formatDuration(row.logged_seconds, "en-US") : <Empty />}
                    </td>
                    <td className="px-3 py-2">
                      {row.top_project ? (
                        <Link
                          href={`/${workspaceSlug}/projects/${row.top_project.id}/issues/`}
                          className="hover:underline"
                        >
                          <span className="text-tertiary">{row.top_project.identifier}</span> {row.top_project.name}
                        </Link>
                      ) : (
                        <Empty />
                      )}
                    </td>
                    {onEdit ? (
                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="sm" stretch="auto" label="Edit" onClick={() => onEdit(row)} />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-caption-sm-regular text-tertiary">
        Logged time comes from Time Tracking and is shown next to the plan for comparison. Neither is proof of presence.
      </p>
    </section>
  );
});
