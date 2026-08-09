/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TTimeLog } from "@plane/types";
import { Input, ModalCore } from "@plane/ui";
import { renderFormattedPayloadDate } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { splitDuration } from "./helper";

type TLogWorkModal = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  /** when present the modal edits that entry instead of creating a new one */
  timeLogId?: string;
};

type TLogWorkFormValues = {
  hours: number;
  minutes: number;
  logged_date: string;
  description: string;
  logged_by: string | null;
};

const getDefaultValues = (currentUserId: string | undefined): TLogWorkFormValues => ({
  hours: 0,
  minutes: 0,
  logged_date: renderFormattedPayloadDate(new Date()) ?? "",
  description: "",
  logged_by: currentUserId ?? null,
});

export const LogWorkModal = observer(function LogWorkModal(props: TLogWorkModal) {
  const { isOpen, onClose, workspaceSlug, projectId, issueId, timeLogId } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    timeLog: { getTimeLogById, createTimeLog, updateTimeLog },
  } = useIssueDetail();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const timeLog: TTimeLog | undefined = timeLogId ? getTimeLogById(timeLogId) : undefined;
  // only project admins are allowed to log time for someone other than themselves
  const isProjectAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<TLogWorkFormValues>({ defaultValues: getDefaultValues(currentUser?.id) });

  useEffect(() => {
    if (!isOpen) return;
    if (timeLog) {
      const { hours, minutes } = splitDuration(timeLog.duration_minutes);
      reset({
        hours,
        minutes,
        logged_date: timeLog.logged_date,
        description: timeLog.description ?? "",
        logged_by: timeLog.logged_by,
      });
    } else {
      reset(getDefaultValues(currentUser?.id));
    }
  }, [isOpen, timeLog, reset, currentUser?.id]);

  const handleFormSubmit = async (formData: TLogWorkFormValues) => {
    const durationMinutes = Number(formData.hours || 0) * 60 + Number(formData.minutes || 0);
    if (durationMinutes <= 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Enter a duration greater than zero.",
      });
      return;
    }

    const payload: Partial<TTimeLog> = {
      duration_minutes: durationMinutes,
      logged_date: formData.logged_date,
      description: formData.description,
    };
    // who the time is attributed to is fixed at creation — the backend rejects changing it afterwards
    if (!timeLogId && formData.logged_by) payload.logged_by = formData.logged_by;

    try {
      if (timeLogId) await updateTimeLog(workspaceSlug, projectId, issueId, timeLogId, payload);
      else await createTimeLog(workspaceSlug, projectId, issueId, payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: timeLogId ? "Time log updated." : "Time logged.",
      });
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: timeLogId ? "Couldn't update the time log." : "Couldn't log the time.",
      });
    }
  };

  const totalMinutes = Number(watch("hours") || 0) * 60 + Number(watch("minutes") || 0);

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-h4-medium text-secondary">{timeLogId ? "Edit time log" : "Log work"}</h3>
          <div className="mt-2 space-y-3">
            {/* admins can log time on behalf of another project member; this can't be changed once created */}
            {!timeLogId && isProjectAdmin && (
              <div>
                <p className="mb-2 text-secondary">Logging for</p>
                <Controller
                  control={control}
                  name="logged_by"
                  render={({ field: { value, onChange } }) => (
                    <MemberDropdown
                      value={value}
                      onChange={onChange}
                      projectId={projectId}
                      multiple={false}
                      buttonVariant="border-with-text"
                      className="w-full"
                      buttonContainerClassName="w-full"
                    />
                  )}
                />
              </div>
            )}
            <div>
              <label htmlFor="logged_date" className="mb-2 text-secondary">
                Date
              </label>
              <Controller
                control={control}
                name="logged_date"
                rules={{ required: true }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input id="logged_date" type="date" value={value} onChange={onChange} ref={ref} className="w-full" />
                )}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="hours" className="mb-2 text-secondary">
                  Hours
                </label>
                <Controller
                  control={control}
                  name="hours"
                  render={({ field: { value, onChange, ref } }) => (
                    <Input
                      id="hours"
                      type="number"
                      min={0}
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      placeholder="0"
                      className="w-full"
                    />
                  )}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="minutes" className="mb-2 text-secondary">
                  Minutes
                </label>
                <Controller
                  control={control}
                  name="minutes"
                  render={({ field: { value, onChange, ref } }) => (
                    <Input
                      id="minutes"
                      type="number"
                      min={0}
                      max={59}
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      placeholder="0"
                      className="w-full"
                    />
                  )}
                />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="mb-2 text-secondary">
                Description
                <span className="block text-caption-xs-regular">{t("common.optional")}</span>
              </label>
              <Controller
                control={control}
                name="description"
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="description"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    placeholder="What did you work on?"
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 py-4">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting} disabled={totalMinutes <= 0}>
            {timeLogId ? t("common.update") : "Log work"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
