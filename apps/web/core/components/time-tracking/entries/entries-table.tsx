/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { Pencil, Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@plane/propel/table";
import type { TTimeEntry } from "@plane/types";
import { Avatar, CustomMenu, ToggleSwitch } from "@plane/ui";
import { cn, formatTimeDuration, getFileURL, renderFormattedDate } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useTimer } from "@/hooks/store/use-timer";
import { revalidateTimeTracking } from "@/hooks/time-tracking/keys";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { getTimeTrackingErrorMessage, getWorkItemKey, toTimeInputValue } from "../helpers";
import { DeleteTimeEntryModal } from "../modals/delete-time-entry-modal";
import { ElapsedTime } from "../timer/elapsed-time";

export type TEntriesGroupBy = "none" | "day" | "person" | "project" | "work_item";

type Props = {
  workspaceSlug: string;
  entries: TTimeEntry[];
  groupBy: TEntriesGroupBy;
  /** not everything is loaded: subtotals only cover loaded rows */
  isPartial: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
};

const UserCell = observer(function UserCell({ userId }: { userId: string | null }) {
  const { getUserDetails } = useMember();
  const user = userId ? getUserDetails(userId) : undefined;
  if (!user) return <span className="text-placeholder">–</span>;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <Avatar name={user.display_name} src={getFileURL(user.avatar_url ?? "")} size="sm" />
      <span className="truncate">{user.display_name}</span>
    </span>
  );
});

export const TimeEntriesTable = observer(function TimeEntriesTable(props: Props) {
  const { workspaceSlug, entries, groupBy, isPartial, selectedIds, onSelectionChange } = props;
  const { t } = useTranslation();
  const { clockOffsetMs, openLogTimeModal } = useTimer();
  const { setPeekIssue } = useIssueDetail();
  const { getUserDetails } = useMember();
  const [entryToDelete, setEntryToDelete] = useState<TTimeEntry | null>(null);

  const selectable = useMemo(() => entries.filter((entry) => entry.can_edit), [entries]);
  const allSelected = selectable.length > 0 && selectable.every((entry) => selectedIds.has(entry.id));

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const setBillable = async (entry: TTimeEntry, isBillable: boolean) => {
    try {
      await timeTrackingService.updateEntry(workspaceSlug, entry.id, { is_billable: isBillable });
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: getTimeTrackingErrorMessage(t, error) });
    } finally {
      void revalidateTimeTracking(workspaceSlug);
    }
  };

  const columns = useMemo<ColumnDef<TTimeEntry>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            aria-label={t("time-tracking.entries.selected", { count: selectable.length })}
            checked={allSelected}
            disabled={selectable.length === 0}
            onChange={() => onSelectionChange(allSelected ? new Set() : new Set(selectable.map((entry) => entry.id)))}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={row.original.id}
            disabled={!row.original.can_edit}
            checked={selectedIds.has(row.original.id)}
            onClick={(event) => event.stopPropagation()}
            onChange={() => toggle(row.original.id)}
          />
        ),
      },
      {
        id: "date",
        header: t("time-tracking.entries.columns.date"),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{renderFormattedDate(row.original.spent_on, "EEE, MMM d")}</span>
        ),
      },
      {
        id: "person",
        header: t("time-tracking.entries.columns.person"),
        cell: ({ row }) => <UserCell userId={row.original.user_id} />,
      },
      {
        id: "project",
        header: t("time-tracking.entries.columns.project"),
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate">{row.original.project_detail.name}</span>
            {row.original.project_detail.is_archived && (
              <span className="rounded-sm bg-layer-3 px-1 text-11 text-tertiary">{t("time-tracking.archived")}</span>
            )}
          </span>
        ),
      },
      {
        id: "work_item",
        header: t("time-tracking.entries.columns.work_item"),
        cell: ({ row }) => {
          const detail = row.original.issue_detail;
          if (!detail) return <span className="text-placeholder italic">{t("time-tracking.no_work_item")}</span>;
          return (
            <button
              type="button"
              className="flex max-w-64 min-w-0 items-center gap-1.5 text-left hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                setPeekIssue({ workspaceSlug, projectId: row.original.project_id, issueId: detail.id });
              }}
            >
              <span className="flex-shrink-0 text-tertiary">{getWorkItemKey(detail)}</span>
              <span className="truncate">{detail.name}</span>
            </button>
          );
        },
      },
      {
        id: "description",
        header: t("time-tracking.entries.columns.description"),
        cell: ({ row }) => <span className="block max-w-72 truncate text-secondary">{row.original.description}</span>,
      },
      {
        id: "time",
        header: t("time-tracking.entries.columns.time"),
        cell: ({ row }) =>
          row.original.started_at ? (
            <span className="whitespace-nowrap text-tertiary tabular-nums">
              {toTimeInputValue(row.original.started_at)}–
              {row.original.ended_at ? toTimeInputValue(row.original.ended_at) : ""}
            </span>
          ) : null,
      },
      {
        id: "duration",
        header: t("time-tracking.entries.columns.duration"),
        cell: ({ row }) => {
          const entry = row.original;
          if (entry.is_running && entry.started_at)
            return (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="rounded-sm bg-accent-subtle px-1 text-11 text-accent-primary">
                  {t("time-tracking.running")}
                </span>
                <ElapsedTime startedAt={entry.started_at} clockOffsetMs={clockOffsetMs} />
              </span>
            );
          return (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-medium tabular-nums">{formatTimeDuration(entry.duration_seconds)}</span>
              {entry.auto_stopped && (
                <span className="rounded-sm bg-warning-subtle px-1 text-11 text-warning-primary">
                  {t("time-tracking.needs_review")}
                </span>
              )}
            </span>
          );
        },
      },
      {
        id: "billable",
        header: t("time-tracking.entries.columns.billable"),
        cell: ({ row }) => (
          <span onClick={(event) => event.stopPropagation()} role="presentation">
            <ToggleSwitch
              value={row.original.is_billable}
              disabled={!row.original.can_edit || row.original.is_running}
              onChange={(value) => void setBillable(row.original, value)}
            />
          </span>
        ),
      },
      {
        id: "source",
        header: t("time-tracking.entries.columns.source"),
        cell: ({ row }) =>
          row.original.source === "timer" ? (
            <Timer className="size-3.5 text-tertiary" aria-label={t("time-tracking.source.timer")} />
          ) : (
            <Pencil className="size-3.5 text-tertiary" aria-label={t("time-tracking.source.manual")} />
          ),
      },
      {
        id: "logged_by",
        header: t("time-tracking.entries.columns.logged_by"),
        cell: ({ row }) =>
          row.original.created_by_id && row.original.created_by_id !== row.original.user_id ? (
            <UserCell userId={row.original.created_by_id} />
          ) : null,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.original.can_edit ? (
            <span onClick={(event) => event.stopPropagation()} role="presentation">
              <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
                <CustomMenu.MenuItem onClick={() => openLogTimeModal({ entry: row.original })}>
                  {t("edit")}
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => setEntryToDelete(row.original)}>{t("delete")}</CustomMenu.MenuItem>
              </CustomMenu>
            </span>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, selectedIds, allSelected, selectable, clockOffsetMs, workspaceSlug]
  );

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });
  const rows = table.getRowModel().rows;

  // client-side grouping over the loaded rows
  const groups = useMemo(() => {
    if (groupBy === "none") return [{ key: "all", label: "", rows }];
    const byKey = new Map<string, { key: string; label: string; rows: typeof rows }>();
    for (const row of rows) {
      const entry = row.original;
      const [key, label] =
        groupBy === "day"
          ? [entry.spent_on, renderFormattedDate(entry.spent_on, "EEEE, MMM d, yyyy") ?? entry.spent_on]
          : groupBy === "person"
            ? [entry.user_id, getUserDetails(entry.user_id)?.display_name ?? ""]
            : groupBy === "project"
              ? [entry.project_id, entry.project_detail.name]
              : entry.issue_detail
                ? [entry.issue_detail.id, `${getWorkItemKey(entry.issue_detail)} ${entry.issue_detail.name}`]
                : ["none", t("time-tracking.no_work_item")];
      if (!byKey.has(key)) byKey.set(key, { key, label, rows: [] });
      byKey.get(key)!.rows.push(row);
    }
    return Array.from(byKey.values());
  }, [groupBy, rows, getUserDetails, t]);

  return (
    <>
      <Table className="w-full text-13">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="h-9 px-2 whitespace-nowrap text-tertiary">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <Fragment key={group.key}>
              {groupBy !== "none" && (
                <TableRow className="bg-layer-1">
                  <TableCell colSpan={columns.length} className="px-2 py-1.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium text-primary">{group.label}</span>
                      <span
                        className="text-secondary tabular-nums"
                        title={isPartial ? t("time-tracking.entries.loaded_subtotals") : undefined}
                      >
                        {formatTimeDuration(
                          group.rows.reduce((sum, row) => sum + (row.original.duration_seconds ?? 0), 0)
                        )}
                        {isPartial && "*"}
                      </span>
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {group.rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => openLogTimeModal({ entry: row.original })}
                  className={cn("cursor-pointer hover:bg-layer-1-hover", {
                    "bg-accent-subtle/40": row.original.is_running,
                  })}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-10 px-2 py-1">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
      <DeleteTimeEntryModal
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onConfirm={async () => {
          if (!entryToDelete) return;
          try {
            await timeTrackingService.deleteEntry(workspaceSlug, entryToDelete.id);
            setToast({ type: TOAST_TYPE.SUCCESS, title: t("time-tracking.toasts.entry_deleted") });
          } catch (error) {
            setToast({ type: TOAST_TYPE.ERROR, title: getTimeTrackingErrorMessage(t, error) });
          } finally {
            void revalidateTimeTracking(workspaceSlug);
          }
        }}
      />
    </>
  );
});
