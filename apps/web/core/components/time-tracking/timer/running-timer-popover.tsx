/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { TIMER_AUTO_STOP_SECONDS, TIMER_WARNING_SECONDS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Popover } from "@plane/propel/popover";
import type { TTimeEntry, TUpdateTimerPayload } from "@plane/types";
import { AlertModalCore, Input, ToggleSwitch } from "@plane/ui";
import { cn, getElapsedSeconds } from "@plane/utils";
// components
import { ProjectDropdownBase } from "@/components/dropdowns/project/base";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useTimer } from "@/hooks/store/use-timer";
import { useLoggableProjects } from "@/hooks/time-tracking/use-loggable-projects";
import { useTimerActions } from "@/hooks/time-tracking/use-timer-actions";
// local imports
import { getEntryTitle, getWorkItemKey, toTimeInputValue, toWorkItemOption } from "../helpers";
import { WorkItemSelect } from "../inputs/work-item-select";
import { ElapsedTime, useNow } from "./elapsed-time";

type Props = { workspaceSlug: string; timer: TTimeEntry };

/** "HH:MM" today, or yesterday when that time hasn't happened yet today (for "I forgot to start it"). */
const startTimeToIso = (time: string, nowMs: number): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const candidate = new Date(nowMs);
  candidate.setHours(hours, minutes, 0, 0);
  if (candidate.getTime() > nowMs) candidate.setDate(candidate.getDate() - 1);
  return candidate.toISOString();
};

/** The running timer pill and its edit popover (plan 9.4.1). */
export const RunningTimerPopover = observer(function RunningTimerPopover({ workspaceSlug, timer }: Props) {
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const { clockOffsetMs, updateTimer } = useTimer();
  const { ownProjectIds } = useLoggableProjects(workspaceSlug);
  const { stop, discard, showError } = useTimerActions(workspaceSlug);
  // a coarse clock for the 10 h warning; the visible time ticks in ElapsedTime
  const minuteNow = useNow(60_000);
  const elapsed = getElapsedSeconds(timer.started_at as string, minuteNow, clockOffsetMs);
  const isLong = elapsed >= TIMER_WARNING_SECONDS;
  // state
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState(timer.description);
  const [startTime, setStartTime] = useState(toTimeInputValue(timer.started_at));
  const [isStopping, setIsStopping] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  useEffect(() => {
    setDescription(timer.description);
    setStartTime(toTimeInputValue(timer.started_at));
  }, [timer.id, timer.description, timer.started_at]);

  const save = async (payload: TUpdateTimerPayload) => {
    try {
      await updateTimer(workspaceSlug, payload);
    } catch (error) {
      showError(error);
    }
  };

  const saveDescription = () => {
    if (description !== timer.description) void save({ description });
  };

  const handleStop = async () => {
    setIsStopping(true);
    await stop(description !== timer.description ? description : undefined);
    setIsStopping(false);
    setIsOpen(false);
  };

  const label = timer.issue_detail ? getEntryTitle(timer) : timer.project_detail.name;
  const workItemHref = timer.issue_detail
    ? `/${workspaceSlug}/browse/${getWorkItemKey(timer.issue_detail)}/`
    : undefined;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Button
          className={cn(
            "flex h-7 max-w-64 items-center gap-2 rounded-full border-[0.5px] px-2.5 text-13 font-medium",
            isLong
              ? "border-warning-strong bg-warning-subtle text-warning-primary"
              : "border-accent-strong bg-accent-subtle text-accent-primary"
          )}
          title={
            isLong ? t("time-tracking.timer.will_auto_stop") : t("time-tracking.timer.running_on", { name: label })
          }
        >
          <span className="relative flex size-2 flex-shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-current" />
          </span>
          <ElapsedTime startedAt={timer.started_at as string} clockOffsetMs={clockOffsetMs} />
          <span className="font-normal hidden max-w-40 truncate md:inline">{label}</span>
        </Popover.Button>
        <Popover.Panel
          positionerClassName="z-[60]"
          side="bottom"
          align="end"
          className="z-30 flex w-80 flex-col gap-3 rounded-md border-[0.5px] border-strong bg-surface-1 p-3 shadow-raised-200"
        >
          <div className="flex items-center justify-between">
            <ElapsedTime
              startedAt={timer.started_at as string}
              clockOffsetMs={clockOffsetMs}
              className="text-20 font-semibold text-primary"
            />
            {workItemHref && (
              <Link
                href={workItemHref}
                className="text-13 text-accent-primary hover:underline"
                onClick={() => setIsOpen(false)}
              >
                {t("time-tracking.timer.open_work_item")}
              </Link>
            )}
          </div>
          {isLong && <p className="text-11 text-warning-primary">{t("time-tracking.timer.will_auto_stop")}</p>}

          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={saveDescription}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveDescription();
              }
            }}
            placeholder={t("time-tracking.timer.description_placeholder")}
            className="w-full"
          />
          <ProjectDropdownBase
            value={timer.project_id}
            multiple={false}
            onChange={(projectId) => void save({ project_id: projectId, issue_id: null })}
            projectIds={ownProjectIds}
            getProjectById={getProjectById}
            buttonVariant="border-with-text"
            buttonContainerClassName="w-full text-left"
            buttonClassName="h-8 w-full justify-start"
            dropdownArrow
          />
          <WorkItemSelect
            workspaceSlug={workspaceSlug}
            projectId={timer.project_id}
            value={timer.issue_id}
            initialOption={toWorkItemOption(timer.issue_detail)}
            onChange={(issueId) => void save({ issue_id: issueId })}
          />
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-13 text-secondary">
              <ToggleSwitch
                value={timer.is_billable}
                onChange={(isBillable) => void save({ is_billable: isBillable })}
              />
              {t("time-tracking.billable")}
            </label>
            <label
              className="flex items-center gap-2 text-13 text-secondary"
              title={t("time-tracking.timer.start_time_hint")}
            >
              {t("time-tracking.timer.start_time")}
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                onBlur={() => {
                  if (!startTime || startTime === toTimeInputValue(timer.started_at)) return;
                  const startedAt = startTimeToIso(startTime, Date.now() + clockOffsetMs);
                  const tooOld = Date.now() + clockOffsetMs - Date.parse(startedAt) > TIMER_AUTO_STOP_SECONDS * 1000;
                  if (tooOld) setStartTime(toTimeInputValue(timer.started_at));
                  else void save({ started_at: startedAt });
                }}
                className="h-7 rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-1.5 text-13 text-primary"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-subtle pt-3">
            <Button variant="ghost" size="lg" type="button" onClick={() => setIsDiscardOpen(true)}>
              {t("time-tracking.timer.discard")}
            </Button>
            <Button variant="primary" size="lg" type="button" loading={isStopping} onClick={() => void handleStop()}>
              {t("time-tracking.timer.stop_short")}
            </Button>
          </div>
        </Popover.Panel>
      </Popover>
      <AlertModalCore
        isOpen={isDiscardOpen}
        handleClose={() => setIsDiscardOpen(false)}
        handleSubmit={() => {
          setIsDiscardOpen(false);
          setIsOpen(false);
          void discard();
        }}
        isSubmitting={false}
        title={t("time-tracking.timer.discard_confirm_title")}
        content={t("time-tracking.timer.discard_confirm_description")}
        primaryButtonText={{ loading: t("time-tracking.timer.discard"), default: t("time-tracking.timer.discard") }}
        secondaryButtonText={t("cancel")}
      />
    </>
  );
});
