/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Pencil, Plus, Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TTimesheetCellEntry } from "@plane/types";
import { formatTimeDuration } from "@plane/utils";
// hooks
import { useTimer } from "@/hooks/store/use-timer";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// store
import type { TLogTimeModalState } from "@/store/time-tracking/timer.store";
// local imports
import { toTimeInputValue } from "../helpers";
import { ElapsedTime } from "../timer/elapsed-time";

type Props = {
  entries: TTimesheetCellEntry[];
  canCreate: boolean;
  defaults: NonNullable<TLogTimeModalState["defaults"]>;
  onSelect: () => void;
};

/** The entries of a timesheet cell that can't be edited inline: several, timer or start/end entries. */
export const TimesheetCellEntriesPopover = observer(function TimesheetCellEntriesPopover(props: Props) {
  const { entries, canCreate, defaults, onSelect } = props;
  const { t } = useTranslation();
  const { clockOffsetMs, openLogTimeModal, workspaceSlug } = useTimer();

  const openEntry = async (entryId: string) => {
    onSelect();
    if (!workspaceSlug) return;
    // the cell only carries a summary; the modal needs the full entry
    const entry = await timeTrackingService.getEntry(workspaceSlug, entryId).catch(() => null);
    if (entry) openLogTimeModal({ entry });
  };

  return (
    <div className="flex w-72 flex-col gap-1 text-13">
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => void openEntry(entry.id)}
          className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left hover:bg-layer-transparent-hover"
        >
          {entry.source === "timer" ? (
            <Timer className="size-3.5 flex-shrink-0 text-tertiary" />
          ) : (
            <Pencil className="size-3.5 flex-shrink-0 text-tertiary" />
          )}
          <span className="min-w-0 flex-1 truncate text-secondary">
            {entry.started_at && (
              <span className="text-tertiary">
                {toTimeInputValue(entry.started_at)}
                {entry.ended_at ? `–${toTimeInputValue(entry.ended_at)}` : ""}{" "}
              </span>
            )}
            {entry.description}
          </span>
          {entry.is_running && entry.started_at ? (
            <ElapsedTime startedAt={entry.started_at} clockOffsetMs={clockOffsetMs} className="text-accent-primary" />
          ) : (
            <span className="tabular-nums">{formatTimeDuration(entry.duration_seconds)}</span>
          )}
        </button>
      ))}
      {canCreate && (
        <button
          type="button"
          onClick={() => {
            onSelect();
            openLogTimeModal({ defaults });
          }}
          className="mt-1 flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-accent-primary hover:bg-layer-transparent-hover"
        >
          <Plus className="size-3.5" />
          {t("time-tracking.timesheet.add_entry")}
        </button>
      )}
    </div>
  );
});
