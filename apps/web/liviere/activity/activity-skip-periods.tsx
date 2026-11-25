/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the "Skipped periods" section of the Activity settings (project admins). Single ranges
// from-to with a description, e.g. a night of automated tests: the time report leaves them out, the grid
// hatches them. Times are entered in the project time zone.

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
import { Icon } from "@makeplane/propel/components/icon";
import { InputField } from "@makeplane/propel/components/input-field";
import { AddOutline } from "@makeplane/propel/icons";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import { projectActivityService } from "./activity.service";
import type { TSkipPeriod } from "./types";
import { refreshSkipPeriods, useSkipPeriods } from "./use-activity";

const MAX_DESCRIPTION_LENGTH = 500;

type Props = {
  workspaceSlug: string;
  projectId: string;
  // IANA name of the project time zone
  timeZone: string;
  locale: string;
};

/** "2026-11-16T22:00:00+01:00" -> "2026-11-16T22:00", the value of a datetime-local field. */
const localValue = (iso: string) => iso.slice(0, 16);

export function ActivitySkipPeriods(props: Props) {
  const { workspaceSlug, projectId, timeZone, locale } = props;
  const { t } = useTranslation();
  const { data: periods } = useSkipPeriods(workspaceSlug, projectId);
  const [dialog, setDialog] = useState<{ period?: TSkipPeriod } | null>(null);
  const [deleting, setDeleting] = useState<TSkipPeriod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone });

  const deletePeriod = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await projectActivityService.deleteSkipPeriod(workspaceSlug, projectId, deleting.id);
      await refreshSkipPeriods(projectId);
      setDeleting(null);
    } catch {
      setToast({ type: "error", title: t("error"), message: t("liviere.activity.skipped.delete_error") });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-body-sm-medium text-primary">{t("liviere.activity.skipped.title")}</h3>
          <p className="text-caption-md-regular text-tertiary">
            {t("liviere.activity.skipped.description", { timezone: timeZone })}
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          stretch="auto"
          icon={<Icon icon={AddOutline} />}
          label={t("liviere.activity.skipped.add")}
          onClick={() => setDialog({})}
        />
      </div>
      {periods && periods.length === 0 && (
        <p className="text-13 text-tertiary">{t("liviere.activity.skipped.empty")}</p>
      )}
      <ul className="divide-y divide-subtle">
        {/* Newest first; the API lists them from the oldest */}
        {/* oxlint-disable-next-line unicorn/no-array-reverse -- reverses a fresh copy */}
        {[...(periods ?? [])].reverse().map((period) => (
          <li key={period.id} className="flex items-center gap-3 py-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-13 text-primary">
                {format.format(new Date(period.starts_at))} – {format.format(new Date(period.ends_at))}
              </span>
              {period.description && <span className="text-12 text-tertiary">{period.description}</span>}
            </div>
            <button
              type="button"
              className="text-12 text-secondary hover:text-primary hover:underline"
              onClick={() => setDialog({ period })}
            >
              {t("edit")}
            </button>
            <button
              type="button"
              className="text-12 text-danger-primary hover:underline"
              onClick={() => setDeleting(period)}
            >
              {t("delete")}
            </button>
          </li>
        ))}
      </ul>
      {dialog && (
        <SkipPeriodModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          period={dialog.period}
          onClose={() => setDialog(null)}
        />
      )}
      <ConfirmDialog
        isOpen={!!deleting}
        handleClose={() => setDeleting(null)}
        handleSubmit={() => void deletePeriod()}
        isSubmitting={isDeleting}
        title={t("liviere.activity.skipped.delete_title")}
        content={t("liviere.activity.skipped.delete_confirm")}
        primaryButtonText={{ loading: t("deleting"), default: t("delete") }}
        secondaryButtonText={t("cancel")}
      />
    </div>
  );
}

type ModalProps = {
  workspaceSlug: string;
  projectId: string;
  period?: TSkipPeriod;
  onClose: () => void;
};

function SkipPeriodModal(props: ModalProps) {
  const { workspaceSlug, projectId, period, onClose } = props;
  const { t } = useTranslation();
  const [form, setForm] = useState({
    starts_at: period ? localValue(period.starts_at) : "",
    ends_at: period ? localValue(period.ends_at) : "",
    description: period?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const set = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.starts_at || !form.ends_at) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Times without an offset: the API reads them in the project time zone
      if (period) await projectActivityService.updateSkipPeriod(workspaceSlug, projectId, period.id, form);
      else await projectActivityService.createSkipPeriod(workspaceSlug, projectId, form);
      await refreshSkipPeriods(projectId);
      onClose();
    } catch (e) {
      setError((e as { error?: string } | undefined)?.error ?? t("liviere.activity.skipped.save_error"));
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
                  {period ? t("liviere.activity.skipped.edit_title") : t("liviere.activity.skipped.add_title")}
                </DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    size="md"
                    orientation="vertical"
                    name="starts_at"
                    label={t("liviere.activity.skipped.from")}
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={set("starts_at")}
                    required
                  />
                  <InputField
                    size="md"
                    orientation="vertical"
                    name="ends_at"
                    label={t("liviere.activity.skipped.to")}
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={set("ends_at")}
                    required
                  />
                </div>
                <InputField
                  size="md"
                  orientation="vertical"
                  name="description"
                  label={t("liviere.activity.skipped.description_label")}
                  value={form.description}
                  onChange={set("description")}
                  placeholder={t("liviere.activity.skipped.description_placeholder")}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
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
              disabled={!form.starts_at || !form.ends_at}
              label={t("save")}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
