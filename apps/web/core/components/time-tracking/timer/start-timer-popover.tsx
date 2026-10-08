/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Popover } from "@plane/propel/popover";
import { Input, ToggleSwitch } from "@plane/ui";
// components
import { ProjectDropdownBase } from "@/components/dropdowns/project/base";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useTimer } from "@/hooks/store/use-timer";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useLoggableProjects } from "@/hooks/time-tracking/use-loggable-projects";
import { useProjectTimeSettings } from "@/hooks/time-tracking/use-project-time-settings";
import { useTimeTrackingRouteContext } from "@/hooks/time-tracking/use-route-context";
import { useTimerActions } from "@/hooks/time-tracking/use-timer-actions";
// local imports
import type { TWorkItemSelectOption } from "../inputs/work-item-select";
import { WorkItemSelect } from "../inputs/work-item-select";
import { RecentTimers } from "./recent-timers";

type Props = { workspaceSlug: string };

/** The idle timer button and its "Start timer" popover (plan 9.4.1). */
export const StartTimerPopover = observer(function StartTimerPopover({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const router = useAppRouter();
  const { data: currentUser } = useUser();
  const { getProjectById } = useProject();
  const { needsReviewCount, openLogTimeModal, isStartPopoverOpen: isOpen, setStartPopoverOpen: setIsOpen } = useTimer();
  const { ownProjectIds, canLogOwn } = useLoggableProjects(workspaceSlug);
  const routeContext = useTimeTrackingRouteContext();
  const { start } = useTimerActions(workspaceSlug);
  // state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [issueId, setIssueId] = useState<string | null>(null);
  const [issueOption, setIssueOption] = useState<TWorkItemSelectOption | null>(null);
  const [description, setDescription] = useState("");
  const [isBillable, setIsBillable] = useState(false);
  const [billableTouched, setBillableTouched] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const { settings } = useProjectTimeSettings(workspaceSlug, isOpen ? projectId : null);

  // pre-fill from the page the user is on, each time the popover opens
  useEffect(() => {
    if (!isOpen) return;
    const routeProjectId = routeContext.projectId && canLogOwn(routeContext.projectId) ? routeContext.projectId : null;
    setProjectId(routeProjectId);
    setIssueId(routeProjectId ? routeContext.issueId : null);
    setIssueOption(null);
    setDescription("");
    setBillableTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // billable follows the project default until the user flips it
  useEffect(() => {
    if (!billableTouched) setIsBillable(!!settings?.default_billable);
  }, [settings, billableTouched]);

  const handleStart = async () => {
    if (!projectId || isStarting) return;
    setIsStarting(true);
    const response = await start({
      project_id: projectId,
      issue_id: issueId,
      description,
      is_billable: billableTouched ? isBillable : null,
    });
    setIsStarting(false);
    if (response) setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Button
        className="relative flex size-8 items-center justify-center rounded-md text-secondary hover:bg-layer-1-hover"
        aria-label={t("time-tracking.timer.start")}
        title={t("time-tracking.timer.start")}
      >
        <Timer className="size-5" />
        {needsReviewCount > 0 && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-warning-primary" aria-hidden="true" />
        )}
      </Popover.Button>
      <Popover.Panel
        positionerClassName="z-[60]"
        side="bottom"
        align="end"
        className="z-30 flex w-80 flex-col gap-3 rounded-md border-[0.5px] border-strong bg-surface-1 p-3 shadow-raised-200"
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleStart();
          }}
        >
          <ProjectDropdownBase
            value={projectId}
            multiple={false}
            onChange={(next) => {
              setProjectId(next);
              setIssueId(null);
              setIssueOption(null);
              setBillableTouched(false);
            }}
            projectIds={ownProjectIds}
            getProjectById={getProjectById}
            buttonVariant="border-with-text"
            buttonContainerClassName="w-full text-left"
            buttonClassName="h-8 w-full justify-start"
            placeholder={t("time-tracking.log_time.project")}
            dropdownArrow
          />
          <WorkItemSelect
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            value={issueId}
            initialOption={issueOption}
            onChange={(next, option) => {
              setIssueId(next);
              setIssueOption(option);
            }}
          />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("time-tracking.timer.description_placeholder")}
            className="w-full"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-13 text-secondary">
              <ToggleSwitch
                value={isBillable}
                onChange={(value) => {
                  setBillableTouched(true);
                  setIsBillable(value);
                }}
              />
              {t("time-tracking.billable")}
            </label>
            <Button variant="primary" size="lg" type="submit" disabled={!projectId} loading={isStarting}>
              {t("time-tracking.timer.start_short")}
            </Button>
          </div>
        </form>

        {currentUser && (
          <RecentTimers
            workspaceSlug={workspaceSlug}
            userId={currentUser.id}
            canLog={canLogOwn}
            onSelect={(entry) => {
              setIsOpen(false);
              void start({
                project_id: entry.project_id,
                issue_id: entry.issue_id,
                description: entry.description,
                is_billable: entry.is_billable,
              });
            }}
          />
        )}

        <div className="flex flex-col items-start gap-1 border-t border-subtle pt-2 text-13">
          <button
            type="button"
            className="text-accent-primary hover:underline"
            onClick={() => {
              setIsOpen(false);
              openLogTimeModal({
                defaults: { projectId, issueId, issueOption },
              });
            }}
          >
            {t("time-tracking.timer.log_manually")}
          </button>
          {needsReviewCount > 0 && currentUser && (
            <button
              type="button"
              className="text-warning-primary hover:underline"
              onClick={() => {
                setIsOpen(false);
                router.push(
                  `/${workspaceSlug}/time-tracking/entries/?needs_review=true&user_ids=${currentUser.id}&date_preset=all_time`
                );
              }}
            >
              {t("time-tracking.timer.review_auto_stopped", { count: needsReviewCount })}
            </button>
          )}
        </div>
      </Popover.Panel>
    </Popover>
  );
});
