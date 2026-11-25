/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the "Summaries" view of the Activity page (?view=summaries). Day summaries of the chosen
// period, newest day first: one per day and author, written here or by AI agents (API, plane-log). Saving
// your summary of a day that already has one replaces it, as the API does.

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
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { AddOutline } from "@makeplane/propel/icons";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { Loader } from "@plane/blocks/skeleton";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import { projectActivityService } from "./activity.service";
import type { TActivityQuery, TDaySummary } from "./types";
import { refreshDaySummaries, useDaySummaries } from "./use-activity";

const MAX_TEXT_LENGTH = 8000;

type Props = {
  workspaceSlug: string;
  projectId: string;
  query: TActivityQuery;
  locale: string;
  // Today in the project time zone, YYYY-MM-DD: the default day and the latest one allowed
  today: string;
  currentUserId: string | undefined;
  isAdmin: boolean;
};

export function ActivitySummaries(props: Props) {
  const { workspaceSlug, projectId, query, locale, today, currentUserId, isAdmin } = props;
  const { t } = useTranslation();
  const { data: summaries, error, isLoading } = useDaySummaries(workspaceSlug, projectId, query);
  // null closed, {} new summary, {summary} change
  const [dialog, setDialog] = useState<{ summary?: TDaySummary } | null>(null);
  const [deleting, setDeleting] = useState<TDaySummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dayTitle = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" });
  const canChange = (summary: TDaySummary) => isAdmin || (!!currentUserId && summary.author?.id === currentUserId);
  // Your own summary of a day, if it is among the loaded ones
  const mine = (date: string) =>
    summaries?.find((summary) => summary.date === date && !!currentUserId && summary.author?.id === currentUserId);

  const days: { date: string; summaries: TDaySummary[] }[] = [];
  for (const summary of summaries ?? []) {
    const last = days[days.length - 1];
    if (last?.date === summary.date) last.summaries.push(summary);
    else days.push({ date: summary.date, summaries: [summary] });
  }

  const deleteSummary = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await projectActivityService.deleteSummary(workspaceSlug, projectId, deleting.id);
      await refreshDaySummaries(projectId);
      setDeleting(null);
    } catch {
      setToast({ type: "error", title: t("error"), message: t("liviere.activity.summaries.delete_error") });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-13 text-tertiary">{t("liviere.activity.summaries.description")}</p>
        <Button
          variant="secondary"
          size="md"
          stretch="auto"
          icon={<Icon icon={AddOutline} />}
          label={t("liviere.activity.summaries.add")}
          onClick={() => setDialog({})}
        />
      </div>

      {error ? (
        <p className="text-13 text-danger-primary">{t("liviere.activity.load_error")}</p>
      ) : isLoading && !summaries ? (
        <Loader className="flex flex-col gap-2">
          <Loader.Item height="80px" width="100%" />
          <Loader.Item height="80px" width="100%" />
        </Loader>
      ) : days.length === 0 ? (
        <EmptyStateCompact
          assetKey="worklog"
          title={t("liviere.activity.summaries.empty_title")}
          description={t("liviere.activity.summaries.empty_description")}
          actions={[{ label: t("liviere.activity.summaries.add"), onClick: () => setDialog({}) }]}
          rootClassName="py-16"
        />
      ) : (
        days.map((day) => (
          <section key={day.date}>
            <h3 className="border-b border-subtle py-2 text-13 font-medium text-primary">
              {dayTitle.format(new Date(`${day.date}T00:00:00Z`))}
            </h3>
            <ul>
              {day.summaries.map((summary) => (
                <li key={summary.id} className="group flex gap-3 border-b border-subtle px-1 py-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-12 font-medium text-secondary">
                      {summary.author?.display_name ?? t("liviere.activity.report.unknown_person")}
                    </span>
                    <p className="text-13 whitespace-pre-wrap text-primary">{summary.text}</p>
                  </div>
                  {canChange(summary) && (
                    <div className="flex shrink-0 items-start gap-3 text-12 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        className="text-secondary hover:text-primary hover:underline"
                        onClick={() => setDialog({ summary })}
                      >
                        {t("edit")}
                      </button>
                      <button
                        type="button"
                        className="text-danger-primary hover:underline"
                        onClick={() => setDeleting(summary)}
                      >
                        {t("delete")}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {dialog && (
        <SummaryModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          summary={dialog.summary}
          today={today}
          mine={mine}
          onClose={() => setDialog(null)}
        />
      )}
      <ConfirmDialog
        isOpen={!!deleting}
        handleClose={() => setDeleting(null)}
        handleSubmit={() => void deleteSummary()}
        isSubmitting={isDeleting}
        title={t("liviere.activity.summaries.delete_title")}
        content={t("liviere.activity.summaries.delete_confirm")}
        primaryButtonText={{ loading: t("deleting"), default: t("delete") }}
        secondaryButtonText={t("cancel")}
      />
    </div>
  );
}

type ModalProps = {
  workspaceSlug: string;
  projectId: string;
  // The summary to change (its day stays); without it, your summary of the chosen day
  summary?: TDaySummary;
  today: string;
  mine: (date: string) => TDaySummary | undefined;
  onClose: () => void;
};

function SummaryModal(props: ModalProps) {
  const { workspaceSlug, projectId, summary, today, mine, onClose } = props;
  const { t } = useTranslation();
  const [date, setDate] = useState(summary?.date ?? today);
  const [text, setText] = useState(summary?.text ?? mine(today)?.text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const replaces = !summary && !!mine(date);

  const changeDate = (value: string) => {
    setDate(value);
    // Your summary of that day opens for editing, as saving would replace it anyway
    const existing = mine(value);
    if (existing) setText(existing.text);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() || !date) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (summary) await projectActivityService.updateSummary(workspaceSlug, projectId, summary.id, text);
      else await projectActivityService.saveSummary(workspaceSlug, projectId, { date, text });
      await refreshDaySummaries(projectId);
      onClose();
    } catch (e) {
      setError((e as { error?: string } | undefined)?.error ?? t("liviere.activity.summaries.save_error"));
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
                  {summary ? t("liviere.activity.summaries.edit_title") : t("liviere.activity.summaries.add_title")}
                </DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-4">
                <div className="w-48">
                  <InputField
                    size="md"
                    orientation="vertical"
                    name="date"
                    label={t("liviere.activity.log.date")}
                    type="date"
                    value={date}
                    max={today}
                    disabled={!!summary}
                    onChange={(event) => changeDate(event.target.value)}
                    required
                  />
                </div>
                <TextAreaField
                  size="lg"
                  name="text"
                  label={t("liviere.activity.summaries.text")}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={t("liviere.activity.summaries.text_placeholder")}
                  maxLength={MAX_TEXT_LENGTH}
                  required
                  resize="vertical"
                  rows={8}
                />
                {replaces && <p className="text-12 text-tertiary">{t("liviere.activity.summaries.replaces")}</p>}
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
              disabled={!text.trim() || !date}
              label={t("save")}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
