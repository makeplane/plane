/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { TIME_ENTRY_DESCRIPTION_MAX_LENGTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TTimeEntryCreatePayload, TTimeEntryUpdatePayload } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, TextArea, ToggleSwitch } from "@plane/ui";
import { cn, formatTimeDuration, getDateFromISODate, getISODate, getTodayISODate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProjectDropdownBase } from "@/components/dropdowns/project/base";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useTimer } from "@/hooks/store/use-timer";
import { useUser } from "@/hooks/store/user";
import { revalidateTimeTracking } from "@/hooks/time-tracking/keys";
import { useLoggableProjects } from "@/hooks/time-tracking/use-loggable-projects";
import { useProjectTimeSettings } from "@/hooks/time-tracking/use-project-time-settings";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// store
import type { TLogTimeModalState } from "@/store/time-tracking/timer.store";
// local imports
import {
  combineDateAndTime,
  getTimeTrackingErrorCode,
  getTimeTrackingErrorMessage,
  toTimeInputValue,
  toWorkItemOption,
} from "../helpers";
import { DurationInput } from "../inputs/duration-input";
import type { TWorkItemSelectOption } from "../inputs/work-item-select";
import { WorkItemSelect } from "../inputs/work-item-select";
import { DeleteTimeEntryModal } from "./delete-time-entry-modal";

type TMode = "duration" | "start_end";
type TFieldKey = "person" | "project" | "issue" | "date" | "duration" | "times" | "description";

type TFormState = {
  userId: string;
  projectId: string | null;
  issueId: string | null;
  issueOption: TWorkItemSelectOption | null;
  date: string;
  mode: TMode;
  durationSeconds: number | null;
  startTime: string;
  endTime: string;
  description: string;
  isBillable: boolean;
};

// server error field → form field
const FIELD_BY_API_FIELD: Record<string, TFieldKey> = {
  user_id: "person",
  project_id: "project",
  issue_id: "issue",
  spent_on: "date",
  duration_seconds: "duration",
  started_at: "times",
  ended_at: "times",
  description: "description",
};
// errors without a field → the form field they're about
const FIELD_BY_CODE: Record<string, TFieldKey> = {
  PROJECT_NOT_LOGGABLE: "project",
  TARGET_USER_NOT_PROJECT_MEMBER: "person",
  ISSUE_NOT_IN_PROJECT: "issue",
  ISSUE_NOT_LOGGABLE: "issue",
  AMBIGUOUS_ENTRY_MODE: "duration",
  DURATION_OUT_OF_RANGE: "duration",
  INVALID_TIME_RANGE: "times",
  SPENT_ON_DERIVED: "date",
  DESCRIPTION_TOO_LONG: "description",
};

type Props = {
  workspaceSlug: string;
  state: TLogTimeModalState | null;
  onClose: () => void;
};

const initialState = (
  state: TLogTimeModalState | null,
  currentUserId: string,
  today: string,
  previous?: TFormState
): TFormState => {
  const entry = state?.entry;
  if (entry) {
    const hasTimes = !!entry.started_at && !!entry.ended_at;
    return {
      userId: entry.user_id,
      projectId: entry.project_id,
      issueId: entry.issue_id,
      issueOption: toWorkItemOption(entry.issue_detail),
      date: hasTimes ? getISODate(new Date(entry.started_at as string)) : entry.spent_on,
      mode: hasTimes ? "start_end" : "duration",
      durationSeconds: entry.duration_seconds,
      startTime: toTimeInputValue(entry.started_at),
      endTime: toTimeInputValue(entry.ended_at),
      description: entry.description,
      isBillable: entry.is_billable,
    };
  }
  const defaults = state?.defaults ?? {};
  return {
    userId: previous?.userId ?? defaults.userId ?? currentUserId,
    projectId: previous?.projectId ?? defaults.projectId ?? null,
    issueId: previous ? null : (defaults.issueId ?? null),
    issueOption: previous ? null : (defaults.issueOption ?? null),
    date: previous?.date ?? defaults.date ?? today,
    mode: previous?.mode ?? "duration",
    durationSeconds: null,
    startTime: "",
    endTime: "",
    description: "",
    isBillable: previous?.isBillable ?? false,
  };
};

/** Create, edit or view a time entry (plan 9.4.2). */
export const LogTimeModal = observer(function LogTimeModal(props: Props) {
  const { workspaceSlug, state, onClose } = props;
  const isOpen = !!state;
  const entry = state?.entry;
  const isEdit = !!entry;
  const isReadOnly = !!entry && (!entry.can_edit || entry.is_running);
  // hooks
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { getProjectById } = useProject();
  const { ownProjectIds, forOthersProjectIds, canLogForOthers } = useLoggableProjects(workspaceSlug);
  const currentUserId = currentUser?.id ?? "";
  const today = getTodayISODate(currentUser?.user_timezone);
  // state
  const [form, setForm] = useState<TFormState>(() => initialState(state, currentUserId, today));
  const [errors, setErrors] = useState<Partial<Record<TFieldKey, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [billableTouched, setBillableTouched] = useState(false);
  const { settings } = useProjectTimeSettings(workspaceSlug, isEdit ? null : form.projectId);

  // reset whenever the modal opens with something new
  useEffect(() => {
    if (!state) return;
    setForm(initialState(state, currentUserId, today));
    setErrors({});
    setBillableTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // new entries take the project's billable default, until the user flips the toggle
  useEffect(() => {
    if (isEdit || billableTouched || !settings) return;
    setForm((current) => ({ ...current, isBillable: settings.default_billable }));
  }, [isEdit, billableTouched, settings]);

  const isForSomeoneElse = form.userId !== currentUserId;
  const canChoosePerson = !!form.projectId && canLogForOthers(form.projectId);
  const projectIds = useMemo(() => {
    const ids = isForSomeoneElse || (isEdit && entry?.user_id !== currentUserId) ? forOthersProjectIds : ownProjectIds;
    // keep the current project selectable when editing (it may no longer be "loggable")
    return form.projectId && !ids.includes(form.projectId) ? [form.projectId, ...ids] : ids;
  }, [isForSomeoneElse, isEdit, entry, currentUserId, forOthersProjectIds, ownProjectIds, form.projectId]);

  const update = (patch: Partial<TFormState>, clear: TFieldKey[] = []) => {
    setForm((current) => ({ ...current, ...patch }));
    if (clear.length)
      setErrors((current) => {
        const next = { ...current };
        clear.forEach((field) => delete next[field]);
        return next;
      });
  };

  const startEndSeconds = useMemo(() => {
    if (!form.startTime || !form.endTime) return null;
    const seconds =
      (Date.parse(combineDateAndTime(form.date, form.endTime)) -
        Date.parse(combineDateAndTime(form.date, form.startTime))) /
      1000;
    return seconds > 0 ? seconds : null;
  }, [form.date, form.startTime, form.endTime]);

  const validate = (): boolean => {
    const next: Partial<Record<TFieldKey, string>> = {};
    if (!form.projectId) next.project = t("time-tracking.errors.PROJECT_NOT_LOGGABLE");
    if (form.mode === "duration" && !form.durationSeconds) next.duration = t("time-tracking.duration.invalid");
    if (form.mode === "start_end") {
      if (!form.startTime || !form.endTime) next.times = t("time-tracking.errors.AMBIGUOUS_ENTRY_MODE");
      else if (!startEndSeconds) next.times = t("time-tracking.errors.INVALID_TIME_RANGE");
    }
    if (form.description.length > TIME_ENTRY_DESCRIPTION_MAX_LENGTH)
      next.description = t("time-tracking.errors.DESCRIPTION_TOO_LONG");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const timeFields = () =>
    form.mode === "duration"
      ? { spent_on: form.date, duration_seconds: form.durationSeconds as number }
      : {
          started_at: combineDateAndTime(form.date, form.startTime),
          ended_at: combineDateAndTime(form.date, form.endTime),
        };

  const handleApiError = (error: unknown) => {
    const code = getTimeTrackingErrorCode(error) ?? "";
    const apiField = (error as { field?: string } | undefined)?.field;
    const field = (apiField && FIELD_BY_API_FIELD[apiField]) || FIELD_BY_CODE[code];
    const message = getTimeTrackingErrorMessage(t, error);
    if (field) setErrors((current) => ({ ...current, [field]: message }));
    else setToast({ type: TOAST_TYPE.ERROR, title: message });
  };

  const save = async (addAnother = false) => {
    if (isReadOnly || !validate() || !form.projectId) return;
    setIsSubmitting(true);
    try {
      if (entry) {
        const payload: TTimeEntryUpdatePayload = {
          project_id: form.projectId,
          issue_id: form.issueId,
          description: form.description,
          is_billable: form.isBillable,
          ...timeFields(),
        };
        // switching a start/end entry to duration mode clears its times
        if (form.mode === "duration" && entry.started_at) Object.assign(payload, { started_at: null, ended_at: null });
        if (form.userId !== entry.user_id) payload.user_id = form.userId;
        await timeTrackingService.updateEntry(workspaceSlug, entry.id, payload);
      } else {
        const payload = {
          project_id: form.projectId,
          issue_id: form.issueId,
          description: form.description,
          is_billable: form.isBillable,
          ...(isForSomeoneElse ? { user_id: form.userId } : {}),
          ...timeFields(),
        } as TTimeEntryCreatePayload;
        await timeTrackingService.createEntry(workspaceSlug, payload);
      }
      void revalidateTimeTracking(workspaceSlug);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("time-tracking.toasts.entry_saved") });
      if (addAnother) {
        setForm((current) => initialState(null, currentUserId, today, current));
        setErrors({});
      } else onClose();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirm = async () => {
    if (!entry) return;
    try {
      await timeTrackingService.updateEntry(workspaceSlug, entry.id, { confirm: true });
      void revalidateTimeTracking(workspaceSlug);
      onClose();
    } catch (error) {
      handleApiError(error);
    }
  };

  const remove = async () => {
    if (!entry) return;
    try {
      await timeTrackingService.deleteEntry(workspaceSlug, entry.id);
      void revalidateTimeTracking(workspaceSlug);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("time-tracking.toasts.entry_deleted") });
      onClose();
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: getTimeTrackingErrorMessage(t, error) });
    }
  };

  const fieldError = (field: TFieldKey) =>
    errors[field] ? <span className="text-11 text-danger-primary">{errors[field]}</span> : null;

  const title = isReadOnly
    ? t("time-tracking.log_time.title_view")
    : isEdit
      ? t("time-tracking.log_time.title_edit")
      : t("time-tracking.log_time.title_create");

  return (
    <>
      <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.TOP} width={EModalWidth.XL}>
        <form
          className="flex flex-col gap-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <h3 className="text-18 font-medium text-primary">{title}</h3>

          {entry?.auto_stopped && entry.can_edit && entry.user_id === currentUserId && (
            <div className="flex items-center justify-between gap-3 rounded-md bg-warning-subtle px-3 py-2 text-13 text-primary">
              <span>{t("time-tracking.log_time.auto_stopped_banner")}</span>
              <Button variant="secondary" size="base" type="button" onClick={() => void confirm()}>
                {t("time-tracking.log_time.looks_right")}
              </Button>
            </div>
          )}
          {isReadOnly && <p className="text-13 text-tertiary">{t("time-tracking.log_time.read_only")}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(canChoosePerson || isForSomeoneElse) && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-13 text-secondary">{t("time-tracking.log_time.person")}</span>
                <MemberDropdown
                  value={form.userId}
                  multiple={false}
                  projectId={form.projectId ?? undefined}
                  onChange={(userId) => userId && update({ userId }, ["person"])}
                  buttonVariant="border-with-text"
                  buttonContainerClassName="w-full text-left"
                  buttonClassName="h-8 w-full justify-start"
                  disabled={isReadOnly || !canChoosePerson}
                  showUserDetails
                />
                {fieldError("person")}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-13 text-secondary">{t("time-tracking.log_time.project")}</span>
              <ProjectDropdownBase
                value={form.projectId}
                multiple={false}
                onChange={(projectId) => {
                  // a work item from another project doesn't carry over
                  const keepIssue = form.issueId && projectId === form.projectId;
                  update(
                    {
                      projectId,
                      issueId: keepIssue ? form.issueId : null,
                      issueOption: keepIssue ? form.issueOption : null,
                    },
                    ["project", "issue"]
                  );
                  if (!isEdit) setBillableTouched(false);
                }}
                projectIds={projectIds}
                getProjectById={getProjectById}
                buttonVariant="border-with-text"
                buttonContainerClassName="w-full text-left"
                buttonClassName="h-8 w-full justify-start"
                placeholder={t("time-tracking.log_time.project")}
                disabled={isReadOnly}
                dropdownArrow
              />
              {fieldError("project")}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-13 text-secondary">{t("time-tracking.log_time.work_item")}</span>
              <WorkItemSelect
                workspaceSlug={workspaceSlug}
                projectId={form.projectId}
                value={form.issueId}
                initialOption={form.issueOption}
                onChange={(issueId, option) => update({ issueId, issueOption: option }, ["issue"])}
                disabled={isReadOnly}
              />
              {fieldError("issue")}
            </div>
          </div>

          {/* mode */}
          <div className="flex w-fit rounded-md border-[0.5px] border-subtle-1 p-0.5 text-13">
            {(["duration", "start_end"] as TMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={isReadOnly}
                onClick={() => update({ mode }, ["duration", "times", "date"])}
                className={cn("rounded px-3 py-1 text-secondary", {
                  "bg-layer-2 text-primary shadow-raised-100": form.mode === mode,
                })}
              >
                {mode === "duration"
                  ? t("time-tracking.log_time.mode_duration")
                  : t("time-tracking.log_time.mode_start_end")}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-13 text-secondary">{t("time-tracking.log_time.date")}</span>
              <DateDropdown
                value={getDateFromISODate(form.date)}
                onChange={(date) => date && update({ date: getISODate(date) }, ["date"])}
                maxDate={getDateFromISODate(today)}
                buttonVariant="border-with-text"
                buttonContainerClassName="w-full text-left"
                buttonClassName="h-8 w-full justify-start"
                disabled={isReadOnly}
              />
              {fieldError("date")}
            </div>

            {form.mode === "duration" ? (
              <div className="flex flex-col gap-1">
                <label htmlFor="time-entry-duration" className="text-13 text-secondary">
                  {t("time-tracking.log_time.duration")}
                </label>
                <DurationInput
                  id="time-entry-duration"
                  value={form.durationSeconds}
                  onChange={(durationSeconds) => update({ durationSeconds }, ["duration"])}
                  // oxlint-disable-next-line jsx_a11y/no-autofocus
                  autoFocus={!isEdit}
                  disabled={isReadOnly}
                  hasError={!!errors.duration}
                />
                {fieldError("duration")}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-13 text-secondary">
                  {t("time-tracking.log_time.start")} – {t("time-tracking.log_time.end")}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    aria-label={t("time-tracking.log_time.start")}
                    value={form.startTime}
                    disabled={isReadOnly}
                    onChange={(event) => update({ startTime: event.target.value }, ["times"])}
                    className="h-8 rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2 text-13 text-primary"
                  />
                  <span className="text-tertiary">–</span>
                  <input
                    type="time"
                    aria-label={t("time-tracking.log_time.end")}
                    value={form.endTime}
                    disabled={isReadOnly}
                    onChange={(event) => update({ endTime: event.target.value }, ["times"])}
                    className="h-8 rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2 text-13 text-primary"
                  />
                  {startEndSeconds !== null && (
                    <span className="text-13 whitespace-nowrap text-tertiary">
                      = {formatTimeDuration(startEndSeconds)}
                    </span>
                  )}
                </div>
                {fieldError("times")}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="time-entry-description" className="text-13 text-secondary">
              {t("time-tracking.log_time.description")}
            </label>
            <TextArea
              id="time-entry-description"
              value={form.description}
              onChange={(event) => update({ description: event.target.value }, ["description"])}
              placeholder={t("time-tracking.log_time.description_placeholder")}
              className="min-h-20 w-full resize-none"
              hasError={!!errors.description}
              disabled={isReadOnly}
            />
            <div className="flex items-center justify-between">
              {fieldError("description") ?? <span />}
              <span
                className={cn("text-11 text-tertiary", {
                  "text-danger-primary": form.description.length > TIME_ENTRY_DESCRIPTION_MAX_LENGTH,
                })}
              >
                {t("time-tracking.log_time.characters", {
                  count: form.description.length,
                  max: TIME_ENTRY_DESCRIPTION_MAX_LENGTH,
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-13 text-secondary">
            <ToggleSwitch
              value={form.isBillable}
              onChange={(isBillable) => {
                setBillableTouched(true);
                update({ isBillable });
              }}
              disabled={isReadOnly}
            />
            <span>{t("time-tracking.log_time.billable")}</span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-subtle pt-4">
            <div>
              {isEdit && !isReadOnly && (
                <Button variant="error-outline" size="lg" type="button" onClick={() => setIsDeleteOpen(true)}>
                  {t("delete")}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="lg" type="button" onClick={onClose}>
                {isReadOnly ? t("close") : t("cancel")}
              </Button>
              {!isEdit && (
                <Button
                  variant="secondary"
                  size="lg"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void save(true)}
                >
                  {t("time-tracking.log_time.save_and_add_another")}
                </Button>
              )}
              {!isReadOnly && (
                <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
                  {isSubmitting ? t("saving") : t("time-tracking.log_time.save")}
                </Button>
              )}
            </div>
          </div>
        </form>
      </ModalCore>
      <DeleteTimeEntryModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={remove} />
    </>
  );
});

/** The app-wide Log time modal, opened from anywhere through the timer store. Rendered once (next to the timer widget). */
export const LogTimeModalHost = observer(function LogTimeModalHost(props: { workspaceSlug: string }) {
  const { logTimeModal, closeLogTimeModal } = useTimer();
  return <LogTimeModal workspaceSlug={props.workspaceSlug} state={logTimeModal} onClose={closeLogTimeModal} />;
});
