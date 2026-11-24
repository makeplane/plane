/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: adds or changes an activity log entry (what was done, from when to when). Times are
// entered on the viewer's clock, like the heatmap shows them.

import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { projectActivityService } from "./activity.service";
import type { TSelectedBucket } from "./activity-root";
import { SLOTS_PER_DAY, slotTime } from "./grid";
import type { TActivityEvent } from "./types";
import { refreshProjectActivity } from "./use-activity";

type Props = {
  workspaceSlug: string;
  projectId: string;
  // The entry to change; a new one starts in the selected quarter, or ends now
  entry?: TActivityEvent;
  bucket?: TSelectedBucket | null;
  onSaved?: () => void;
  onClose: () => void;
};

const pad = (value: number) => value.toString().padStart(2, "0");
const localDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const localTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

function initialForm(entry?: TActivityEvent, bucket?: TSelectedBucket | null) {
  if (entry) {
    const start = new Date(entry.occurred_at);
    return {
      date: localDate(start),
      from: localTime(start),
      to: entry.ended_at ? localTime(new Date(entry.ended_at)) : "",
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
  const start = new Date(now.getTime() - 15 * 60_000);
  return { date: localDate(start), from: localTime(start), to: localTime(now), text: "", issue: "" };
}

export function ActivityLogModal(props: Props) {
  const { workspaceSlug, projectId, entry, bucket, onSaved, onClose } = props;
  const { t } = useTranslation();
  const [form, setForm] = useState(() => initialForm(entry, bucket));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const set = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.text.trim() || !form.date || !form.from) return;
    const start = new Date(`${form.date}T${form.from}`);
    let end = form.to ? new Date(`${form.date}T${form.to}`) : null;
    // An end before the start is on the next day (work past midnight)
    if (end && end <= start) end = new Date(end.getTime() + 24 * 60 * 60_000);
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
    <ModalCore isOpen handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4 p-5">
        <h3 className="text-16 font-medium text-primary">
          {entry ? t("liviere.activity.log.edit_title") : t("liviere.activity.log.add_title")}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-12 text-tertiary">
            {t("liviere.activity.log.date")}
            <Input type="date" value={form.date} onChange={set("date")} required className="w-full" />
          </label>
          <label className="flex flex-col gap-1 text-12 text-tertiary">
            {t("liviere.activity.log.from")}
            <Input type="time" value={form.from} onChange={set("from")} required className="w-full" />
          </label>
          <label className="flex flex-col gap-1 text-12 text-tertiary">
            {t("liviere.activity.log.to")}
            <Input type="time" value={form.to} onChange={set("to")} className="w-full" />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-12 text-tertiary">
          {t("liviere.activity.log.text")}
          <TextArea
            value={form.text}
            onChange={set("text")}
            placeholder={t("liviere.activity.log.text_placeholder")}
            maxLength={4000}
            required
            className="min-h-28 w-full resize-y text-14"
          />
        </label>
        <label className="flex flex-col gap-1 text-12 text-tertiary">
          {t("liviere.activity.log.issue")}
          <Input value={form.issue} onChange={set("issue")} placeholder="ORD-12" className="w-40" />
        </label>
        {error && <p className="text-13 text-danger-primary">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting} disabled={!form.text.trim()}>
            {t("save")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
