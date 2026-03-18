/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { parseDisplayToMinutes } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkLog } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useWorklog } from "@/hooks/store/use-worklog";
import { extractApiError } from "./utils/extract-api-error";
import { getMinAllowedDate } from "./utils/worklog-date-utils";

type TWorklogModal = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  existingWorklog?: IWorkLog;
};

const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const WorklogModal = observer(function WorklogModal(props: TWorklogModal) {
  const { isOpen, onClose, workspaceSlug, projectId, issueId, existingWorklog } = props;
  const { t } = useTranslation();
  const store = useWorklog();

  // form state
  const [loggedAt, setLoggedAt] = useState(todayDate());
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // populate form when editing an existing worklog
  useEffect(() => {
    if (existingWorklog) {
      setLoggedAt(existingWorklog.logged_at ?? todayDate());
      setHours(Math.floor(existingWorklog.duration_minutes / 60));
      setMinutes(existingWorklog.duration_minutes % 60);
      setDescription(existingWorklog.description ?? "");
      setReason("");
    } else {
      setLoggedAt(todayDate());
      setHours(0);
      setMinutes(0);
      setDescription("");
      setReason("");
    }
  }, [existingWorklog, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const duration_minutes = parseDisplayToMinutes(hours, minutes);
    if (duration_minutes <= 0) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("worklog.error"), message: t("worklog.duration_required") });
      return;
    }
    if (existingWorklog && !reason.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("worklog.error"), message: t("worklog.reason_required") });
      return;
    }
    setIsSubmitting(true);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        if (existingWorklog) {
          await store.updateWorklog(workspaceSlug, projectId, issueId, existingWorklog.id, {
            duration_minutes,
            logged_at: loggedAt,
            description: description || undefined,
            reason: reason.trim(),
          });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("worklog.updated"),
            message: t("worklog.updated_successfully"),
          });
        } else {
          await store.createWorklog(workspaceSlug, projectId, issueId, {
            duration_minutes,
            logged_at: loggedAt,
            description: description || undefined,
          });
          setToast({ type: TOAST_TYPE.SUCCESS, title: t("worklog.logged"), message: t("worklog.logged_successfully") });
        }
        onClose();
      } catch (err: unknown) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("worklog.error"),
          message: extractApiError(err) || t("worklog.save_failed"),
        });
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4" data-prevent-outside-click>
        <h2 className="text-16 font-semibold text-primary">
          {existingWorklog ? t("worklog.edit_log") : t("worklog.log_time")}
        </h2>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label htmlFor="worklog-date" className="text-11 font-medium text-tertiary">
            {t("worklog.date")}
          </label>
          <input
            id="worklog-date"
            type="date"
            value={loggedAt}
            min={getMinAllowedDate()}
            max={todayDate()}
            onChange={(e) => setLoggedAt(e.target.value)}
            className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-3 py-2 text-13 text-primary focus:outline-none"
            required
          />
        </div>

        {/* Duration: hours + minutes side by side */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="worklog-hours" className="text-11 font-medium text-tertiary">
              {t("worklog.hours")}
            </label>
            <input
              id="worklog-hours"
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(Math.max(0, Math.min(23, Number(e.target.value))))}
              className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-3 py-2 text-13 text-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="worklog-minutes" className="text-11 font-medium text-tertiary">
              {t("worklog.minutes")}
            </label>
            <input
              id="worklog-minutes"
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
              className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-3 py-2 text-13 text-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Description (optional) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="worklog-description" className="text-11 font-medium text-tertiary">
            {t("worklog.description_optional")}
          </label>
          <textarea
            id="worklog-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t("worklog.description_placeholder")}
            className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-3 py-2 text-13 text-primary placeholder-tertiary focus:outline-none resize-none"
          />
        </div>

        {/* Reason for change (edit mode only) */}
        {existingWorklog && (
          <div className="flex flex-col gap-1">
            <label htmlFor="worklog-reason" className="text-11 font-medium text-tertiary">
              {t("worklog.reason_label")} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="worklog-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={t("worklog.reason_placeholder")}
              className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-3 py-2 text-13 text-primary placeholder-tertiary focus:outline-none resize-none"
              required
            />
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="tertiary" size="sm" onClick={onClose} type="button" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {existingWorklog ? t("worklog.update") : t("worklog.log_time")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
