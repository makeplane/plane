/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Popover } from "@plane/propel/popover";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TTimesheetCell, TTimesheetRow } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { cn, formatTimeDuration } from "@plane/utils";
// hooks
import { useTimer } from "@/hooks/store/use-timer";
import { revalidateTimeTracking } from "@/hooks/time-tracking/keys";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { getTimeTrackingErrorMessage, toWorkItemOption } from "../helpers";
import { DurationInput } from "../inputs/duration-input";
import { ElapsedTime } from "../timer/elapsed-time";
import { TimesheetCellEntriesPopover } from "./cell-entries-popover";

type Props = {
  workspaceSlug: string;
  userId: string;
  isCurrentUser: boolean;
  row: Pick<TTimesheetRow, "project_id" | "issue_id" | "issue_detail">;
  day: string;
  cell: TTimesheetCell | undefined;
  /** the viewer may create time for this person in this row's project */
  canCreate: boolean;
  isToday: boolean;
  isWeekend: boolean;
};

/** One day of one row (plan 9.5.2 "Cell editing"). */
export const TimesheetCell = observer(function TimesheetCell(props: Props) {
  const { workspaceSlug, userId, isCurrentUser, row, day, cell, canCreate, isToday, isWeekend } = props;
  const { t } = useTranslation();
  const { clockOffsetMs } = useTimer();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<number | null>(null);
  // a ref, not state: Enter and the blur that follows must not both save
  const savingRef = useRef(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const entries = cell?.entries ?? [];
  const running = entries.find((entry) => entry.is_running);
  const single = entries.length === 1 ? entries[0] : undefined;
  // inline editing only for an empty cell, or exactly one manual duration-only entry
  const inlineEditable =
    (entries.length === 0 && canCreate) ||
    (!!single && single.can_edit && single.source === "manual" && !single.has_times && !single.is_running);
  const hasPopover = entries.length > 0 && !inlineEditable;

  const startEditing = () => {
    setDraft(single?.duration_seconds ?? null);
    setIsEditing(true);
  };

  const save = async (seconds: number | null) => {
    if (savingRef.current) return;
    if (!seconds) {
      // clearing the only entry deletes it, after confirmation
      if (single) setConfirmDelete(true);
      setIsEditing(false);
      return;
    }
    if (single && seconds === single.duration_seconds) {
      setIsEditing(false);
      return;
    }
    savingRef.current = true;
    try {
      if (single) {
        await timeTrackingService.updateEntry(workspaceSlug, single.id, { duration_seconds: seconds });
      } else {
        await timeTrackingService.createEntry(workspaceSlug, {
          project_id: row.project_id,
          issue_id: row.issue_id,
          spent_on: day,
          duration_seconds: seconds,
          ...(isCurrentUser ? {} : { user_id: userId }),
        });
      }
      setIsEditing(false);
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: getTimeTrackingErrorMessage(t, error) });
    } finally {
      savingRef.current = false;
      void revalidateTimeTracking(workspaceSlug);
    }
  };

  // leaving the cell (Tab, click elsewhere) keeps a valid change; clearing only deletes on Enter
  const handleBlur = () => {
    if (draft && draft !== (single?.duration_seconds ?? null)) void save(draft);
    else setIsEditing(false);
  };

  const remove = async () => {
    if (!single) return;
    try {
      await timeTrackingService.deleteEntry(workspaceSlug, single.id);
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: getTimeTrackingErrorMessage(t, error) });
    } finally {
      setConfirmDelete(false);
      void revalidateTimeTracking(workspaceSlug);
    }
  };

  const content = (
    <span className="flex items-center justify-end gap-1.5 tabular-nums">
      {running?.started_at && (
        <>
          <span className="size-1.5 animate-pulse rounded-full bg-accent-primary" aria-hidden="true" />
          <ElapsedTime startedAt={running.started_at} clockOffsetMs={clockOffsetMs} className="text-accent-primary" />
        </>
      )}
      {cell && cell.total_seconds > 0 && !running && formatTimeDuration(cell.total_seconds, "clock")}
      {cell && cell.total_seconds > 0 && running && (
        <span className="text-tertiary">+{formatTimeDuration(cell.total_seconds, "clock")}</span>
      )}
    </span>
  );

  const cellClass = cn("h-10 w-24 border-l border-subtle px-1 text-right text-13", {
    "bg-accent-subtle/30": isToday,
    "text-tertiary": isWeekend && !isToday,
  });

  if (isEditing) {
    return (
      <td className={cellClass}>
        <DurationInput
          compact
          // oxlint-disable-next-line jsx_a11y/no-autofocus
          autoFocus
          allowEmpty={!!single}
          value={draft}
          onChange={setDraft}
          onSubmit={(seconds) => void save(seconds)}
          onCancel={() => setIsEditing(false)}
          onBlur={handleBlur}
          className="text-right"
        />
      </td>
    );
  }

  return (
    <td className={cellClass}>
      {hasPopover ? (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <Popover.Button className="h-8 w-full rounded-sm px-1 hover:bg-layer-transparent-hover">
            {content}
          </Popover.Button>
          <Popover.Panel
            positionerClassName="z-[60]"
            side="bottom"
            align="end"
            className="z-30 rounded-md border-[0.5px] border-strong bg-surface-1 p-2 shadow-raised-200"
          >
            <TimesheetCellEntriesPopover
              entries={entries}
              canCreate={canCreate}
              defaults={{
                projectId: row.project_id,
                issueId: row.issue_id,
                issueOption: toWorkItemOption(row.issue_detail),
                userId,
                date: day,
              }}
              onSelect={() => setIsPopoverOpen(false)}
            />
          </Popover.Panel>
        </Popover>
      ) : inlineEditable ? (
        <button
          type="button"
          onClick={startEditing}
          className="h-8 w-full rounded-sm px-1 hover:bg-layer-transparent-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong"
        >
          {content}
        </button>
      ) : (
        <span className="block px-1">{content}</span>
      )}
      <AlertModalCore
        isOpen={confirmDelete}
        handleClose={() => setConfirmDelete(false)}
        handleSubmit={() => void remove()}
        isSubmitting={false}
        title={t("time-tracking.delete.title")}
        content={t("time-tracking.timesheet.delete_cell_confirm")}
        primaryButtonText={{ loading: t("deleting"), default: t("delete") }}
        secondaryButtonText={t("cancel")}
      />
    </td>
  );
});
