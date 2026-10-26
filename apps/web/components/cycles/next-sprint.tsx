/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { AddOutline } from "@makeplane/propel/icons";
// plane imports
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import { getIsoWeekday, parseDateKey, resolveWorkingDays, toDateKey } from "@plane/utils";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useProject } from "@/hooks/store/use-project";
// services
import { CycleService } from "@/services/cycle.service";

const cycleService = new CycleService();
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
/** Monday of the week `date` falls in */
const startOfIsoWeek = (date: Date) => addDays(date, 1 - getIsoWeekday(date));

/** "Oct 26 - 30" inside one month, "Oct 30 - Nov 3" across months (same style as the existing sprints) */
export const formatSprintName = (start: Date, end: Date) =>
  start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    ? `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}`
    : `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}`;

/**
 * d2m-plane: dates of the sprint that follows `previousEnd` — one week, Monday → last working day.
 * If that week is already in the past, the current week is used instead.
 */
export const getNextSprintDates = (previousEnd: Date, workingDays?: number[] | null) => {
  const followingWeek = addDays(startOfIsoWeek(previousEnd), 7);
  const currentWeek = startOfIsoWeek(new Date());
  const weekStart = followingWeek < currentWeek ? currentWeek : followingWeek;
  const days = resolveWorkingDays(workingDays);
  // first / last working day of that week (falls back to Monday / Sunday)
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const working = weekDays.filter((day) => days.includes(getIsoWeekday(day)));
  const start = working[0] ?? weekStart;
  const end = working[working.length - 1] ?? addDays(weekStart, 6);
  return { start, end };
};

type Props = {
  cycleId: string;
};

/**
 * d2m-plane: on a completed sprint, offers to create the next week's sprint when the project has no sprint
 * after this one yet. Once it exists, "Transfer work items" moves the unfinished items into it.
 */
export const CreateNextSprintButton = observer(function CreateNextSprintButton(props: Props) {
  const { cycleId } = props;
  const { workspaceSlug, projectId } = useParams();
  const { t } = useTranslation();
  const { getCycleById, getProjectCycleIds, createCycle } = useCycle();
  const { getProjectById } = useProject();
  const [isCreating, setIsCreating] = useState(false);

  const cycle = getCycleById(cycleId);
  const previousEnd = parseDateKey(cycle?.end_date);
  if (!workspaceSlug || !projectId || !cycle || !previousEnd) return null;

  // hide the button once any sprint starts after this one ends
  const hasLaterSprint = (getProjectCycleIds(projectId.toString()) ?? []).some((id) => {
    const start = parseDateKey(getCycleById(id)?.start_date);
    return id !== cycleId && !!start && start > previousEnd;
  });
  if (hasLaterSprint) return null;

  const { start, end } = getNextSprintDates(previousEnd, getProjectById(projectId.toString())?.working_days);
  const name = formatSprintName(start, end);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const payload = { start_date: toDateKey(start), end_date: toDateKey(end) };
      const dateCheck = await cycleService.cycleDateCheck(workspaceSlug.toString(), projectId.toString(), payload);
      if (!dateCheck?.status) throw new Error("overlap");
      await createCycle(workspaceSlug.toString(), projectId.toString(), {
        name,
        ...payload,
        project_id: projectId.toString(),
      });
      setToast({
        type: "success",
        title: t("toast.success"),
        message: t("d2m_quick_actions.next_sprint_created", { name }),
      });
    } catch {
      setToast({ type: "error", title: t("toast.error"), message: t("d2m_quick_actions.next_sprint_failed", { name }) });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="md"
      stretch="auto"
      icon={<Icon icon={AddOutline} />}
      iconPosition="start"
      onClick={() => void handleCreate()}
      disabled={isCreating}
      label={t("d2m_quick_actions.create_next_sprint", { name })}
    />
  );
});
