/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: adds or changes an activity log entry (what was done, from when to when). Times are
// entered in the page's time zone (the project's), like the heatmap shows them.

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { useTranslation } from "@plane/i18n";
import { projectActivityService } from "./activity.service";
import type { TSelectedBucket } from "./activity-root";
import { SLOTS_PER_DAY, shiftDate, slotTime, zonedDateTime, zonedMoment } from "./grid";
import type { TActivityEvent } from "./types";
import { refreshProjectActivity } from "./use-activity";

type Props = {
  workspaceSlug: string;
  projectId: string;
  // The entry to change; a new one starts in the selected quarter, or ends now
  entry?: TActivityEvent;
  bucket?: TSelectedBucket | null;
  // IANA name; the date and times of the form are read in it
  timeZone: string;
  onSaved?: () => void;
  onClose: () => void;
};

function initialForm(timeZone: string, entry?: TActivityEvent, bucket?: TSelectedBucket | null) {
  if (entry) {
    const start = zonedDateTime(new Date(entry.occurred_at), timeZone);
    return {
      date: start.date,
      from: start.time,
      to: entry.ended_at ? zonedDateTime(new Date(entry.ended_at), timeZone).time : "",
      text: entry.note ?? "",
      issue: entry.issue?.identifier ?? "",
    };
  }
  if (bucket) {
    return {
      date: bucket.date,
      from: slotTime(bucket.slot),
      to: slotTime((bucket.slot + 1) % SLOTS_PER_DAY),
      text: "",
      issue: "",
    };
  }
  const now = new Date();
  const start = zonedDateTime(new Date(now.getTime() - 15 * 60_000), timeZone);
  return { date: start.date, from: start.time, to: zonedDateTime(now, timeZone).time, text: "", issue: "" };
}

export function ActivityLogModal(props: Props) {
  const { workspaceSlug, projectId, entry, bucket, timeZone, onSaved, onClose } = props;
  const { t } = useTranslation();
  const [form, setForm] = useState(() => initialForm(timeZone, entry, bucket));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const set = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.text.trim() || !form.date || !form.from) return;
    const start = zonedMoment(form.date, form.from, timeZone);
    let end = form.to ? zonedMoment(form.date, form.to, timeZone) : null;
    // An end before the start is on the next day (work past midnight)
    if (end && end <= start) end = zonedMoment(shiftDate(form.date, 1), form.to, timeZone);
    const data = {
      text: form.text,
      started_at: start.toISOString(),
      ended_at: end ? end.toISOString() : null,
      issue: form.issue.trim() || null,
    };
    setIsSubmitting(true);
    setError(null);
    try {
      if (entry) await projectActivityService.updateLog(workspaceSlug, projectId, entry.id, data);
      else await projectActivityService.createLog(workspaceSlug, projectId, data);
      await refreshProjectActivity(projectId);
      onSaved?.();
      onClose();
    } catch (e) {
      setError((e as { error?: string } | undefined)?.error ?? t("liviere.activity.log.save_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md">
        <form onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>
                  {entry ? t("liviere.activity.log.edit_title") : t("liviere.activity.log.add_title")}
                </DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                  <InputField
                    size="md"
                    orientation="vertical"
                    name="date"
                    label={t("liviere.activity.log.date")}
                    type="date"
                    value={form.date}
                    onChange={set("date")}
                    required
                  />
                  <InputField
                    size="md"
                    orientation="vertical"
                    name="from"
                    label={t("liviere.activity.log.from")}
                    type="time"
                    value={form.from}
                    onChange={set("from")}
                    required
                  />
                  <InputField
                    size="md"
                    orientation="vertical"
                    name="to"
                    label={t("liviere.activity.log.to")}
                    type="time"
                    value={form.to}
                    onChange={set("to")}
                  />
                </div>
                <TextAreaField
                  size="lg"
                  name="text"
                  label={t("liviere.activity.log.text")}
                  value={form.text}
                  onChange={set("text")}
                  placeholder={t("liviere.activity.log.text_placeholder")}
                  maxLength={4000}
                  required
                  resize="vertical"
                  rows={5}
                />
                <div className="w-56">
                  <InputField
                    size="md"
                    orientation="vertical"
                    name="issue"
                    label={t("liviere.activity.log.issue")}
                    value={form.issue}
                    onChange={set("issue")}
                    placeholder="ORD-12"
                  />
                </div>
                {error && <p className="text-13 text-danger-primary">{error}</p>}
              </div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <Button variant="secondary" size="md" stretch="auto" type="button" onClick={onClose} label={t("cancel")} />
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              type="submit"
              loading={isSubmitting}
              disabled={!form.text.trim()}
              label={t("save")}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
