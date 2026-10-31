/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { AddOutline, ChevronLeftOutline, ChevronRightOutline } from "@makeplane/propel/icons";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { getWeekRange, shiftWeeks } from "@plane/services";
import { useTranslation } from "@plane/i18n";
import type { TTimeEntry, TTimeEntryPayload, TTimerStartPayload } from "@plane/types";
// hooks
import { useTimeTracking } from "@/hooks/team-ops/use-time-tracking";
import { useUser, useUserProfile } from "@/hooks/store/user";
// local imports
import { TimeEntriesList } from "./time-entries-list";
import { TimeEntryForm } from "./time-entry-form";
import { TimerCard } from "./timer-card";
import { WeekSummary } from "./week-summary";

type Props = {
  workspaceSlug: string;
};

const errorMessage = (error: unknown): string => {
  if (error instanceof Object) {
    return Object.values(error as Record<string, unknown>)
      .flat()
      .filter((value): value is string => typeof value === "string")
      .join(" ");
  }
  return "";
};

export const TimeTrackingRoot = observer(function TimeTrackingRoot({ workspaceSlug }: Props) {
  // states
  const [weekReference, setWeekReference] = useState(() => new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TTimeEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<TTimeEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // hooks
  const { t, currentLocale } = useTranslation();
  const { data: currentUser } = useUser();
  const { data: userProfile } = useUserProfile();
  // `start_of_the_week` follows the profile setting (0 = Sunday ... 6 = Saturday), Monday when unset.
  const week = useMemo(
    () => getWeekRange(weekReference, userProfile?.start_of_the_week ?? 1),
    [weekReference, userProfile?.start_of_the_week]
  );
  const { timer, entries, isEntriesLoading, summary, startTimer, stopTimer, createEntry, updateEntry, deleteEntry } =
    useTimeTracking({ workspaceSlug, userId: currentUser?.id, from: week.from, to: week.to });

  const showError = (error: unknown) =>
    setToast({ type: "error", title: t("team_ops.toasts.error_title"), message: errorMessage(error) });

  const handleStart = async (payload: TTimerStartPayload) => {
    try {
      await startTimer(payload);
    } catch (error) {
      showError(error);
    }
  };

  const handleStop = async () => {
    try {
      const { capped } = await stopTimer();
      if (capped) {
        setToast({ type: "warning", title: t("team_ops.timer.stop"), message: t("team_ops.timer.capped") });
      }
    } catch (error) {
      showError(error);
    }
  };

  const openForm = (entry: TTimeEntry | null) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleSubmit = async (payload: TTimeEntryPayload) => {
    if (editingEntry) await updateEntry(editingEntry.id, payload);
    else await createEntry(payload);
    setToast({ type: "success", title: t("team_ops.toasts.saved"), message: "" });
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEntry(entryToDelete.id);
      setToast({ type: "success", title: t("team_ops.toasts.deleted"), message: "" });
    } catch (error) {
      showError(error);
    } finally {
      setIsDeleting(false);
      setEntryToDelete(null);
    }
  };

  const weekLabel = new Intl.DateTimeFormat(currentLocale, { day: "numeric", month: "short" });
  const [fromYear, fromMonth, fromDay] = week.from.split("-").map(Number);
  const [toYear, toMonth, toDay] = week.to.split("-").map(Number);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <TimerCard workspaceSlug={workspaceSlug} timer={timer} onStart={handleStart} onStop={handleStop} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconButton
            icon={<Icon icon={ChevronLeftOutline} />}
            variant="ghost"
            size="sm"
            aria-label={t("team_ops.summary.previous_week")}
            onClick={() => setWeekReference((current) => shiftWeeks(current, -1))}
          />
          <span className="min-w-36 text-center text-body-sm-medium text-primary">
            {weekLabel.format(new Date(fromYear, fromMonth - 1, fromDay))} –{" "}
            {weekLabel.format(new Date(toYear, toMonth - 1, toDay))}
          </span>
          <IconButton
            icon={<Icon icon={ChevronRightOutline} />}
            variant="ghost"
            size="sm"
            aria-label={t("team_ops.summary.next_week")}
            onClick={() => setWeekReference((current) => shiftWeeks(current, 1))}
          />
          <Button
            variant="ghost"
            size="sm"
            stretch="auto"
            label={t("team_ops.summary.this_week")}
            onClick={() => setWeekReference(new Date())}
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          icon={<Icon icon={AddOutline} />}
          label={t("team_ops.entries.add")}
          onClick={() => openForm(null)}
        />
      </div>

      <WeekSummary from={week.from} summary={summary} />

      <section className="flex flex-col gap-3">
        <h2 className="text-h5-medium text-primary">{t("team_ops.entries.title")}</h2>
        {isEntriesLoading ? null : (
          <TimeEntriesList
            workspaceSlug={workspaceSlug}
            entries={entries}
            onEdit={openForm}
            onDelete={setEntryToDelete}
          />
        )}
      </section>

      <Dialog open={isFormOpen} disablePointerDismissal onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent size="md">
          {/* Remounted per entry so the form always starts from that entry's values. */}
          <TimeEntryForm
            key={editingEntry?.id ?? "new"}
            workspaceSlug={workspaceSlug}
            entry={editingEntry}
            onSubmit={handleSubmit}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!entryToDelete}
        handleClose={() => setEntryToDelete(null)}
        handleSubmit={handleDelete}
        isSubmitting={isDeleting}
        title={t("team_ops.entries.delete_title")}
        content={t("team_ops.entries.delete_confirmation")}
      />
    </div>
  );
});
