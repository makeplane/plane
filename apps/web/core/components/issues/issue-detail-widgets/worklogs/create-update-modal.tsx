/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TIssueWorklog } from "@plane/types";
import { Input, ModalCore, TextArea } from "@plane/ui";
import { parseWorklogDurationInput, formatWorklogDuration } from "@plane/utils";

type FormValues = {
  duration_input: string;
  description: string;
  logged_date: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  worklog?: TIssueWorklog | null;
  onSubmit: (payload: { duration: number; description?: string; logged_at?: string }) => Promise<void>;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

export const IssueWorklogCreateUpdateModal = observer(function IssueWorklogCreateUpdateModal(props: Props) {
  const { isOpen, onClose, worklog, onSubmit } = props;
  const { t } = useTranslation();
  const [durationError, setDurationError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      duration_input: "",
      description: "",
      logged_date: todayInputValue(),
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      duration_input: worklog ? formatWorklogDuration(worklog.duration) : "",
      description: worklog?.description ?? "",
      logged_date: worklog?.logged_at ? worklog.logged_at.slice(0, 10) : todayInputValue(),
    });
    setDurationError(null);
  }, [isOpen, reset, worklog]);

  const submitForm = async (values: FormValues) => {
    const duration = parseWorklogDurationInput(values.duration_input);
    if (duration == null) {
      setDurationError(t("worklog.duration_invalid"));
      return;
    }
    setDurationError(null);
    const loggedAt = values.logged_date ? `${values.logged_date}T12:00:00.000Z` : undefined;
    await onSubmit({
      duration,
      description: values.description.trim() || undefined,
      logged_at: loggedAt,
    });
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <form onSubmit={handleSubmit(submitForm)}>
        <div className="space-y-5 p-5">
          <h3 className="text-16 font-medium">{worklog ? t("common.actions.edit") : t("worklog.log_time")}</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-13 text-secondary">{t("common.duration")}</label>
              <Controller
                control={control}
                name="duration_input"
                render={({ field }) => (
                  <Input {...field} placeholder={t("worklog.duration_placeholder")} hasError={Boolean(durationError)} />
                )}
              />
              {durationError && <p className="mt-1 text-12 text-danger-primary">{durationError}</p>}
            </div>
            <div>
              <label className="mb-1 block text-13 text-secondary">{t("worklog.logged_date")}</label>
              <Controller
                control={control}
                name="logged_date"
                render={({ field }) => <Input {...field} type="date" />}
              />
            </div>
            <div>
              <label className="mb-1 block text-13 text-secondary">{t("description")}</label>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <TextArea {...field} placeholder={t("worklog.description_placeholder")} className="min-h-20" />
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-subtle px-5 py-4">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {worklog ? t("common.save_changes") : t("worklog.log_time")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
