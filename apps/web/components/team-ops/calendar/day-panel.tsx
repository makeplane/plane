/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import {
  PLAN_NOTICE,
  parseDateKey,
  planFromDay,
  summarizeAuditChange,
  toDayPayload,
  validatePlanTimes,
} from "@plane/services";
import type { TPlanValues } from "@plane/services";
import type { TCalendarAudit, TCalendarDay, TCalendarDayPayload } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useDayHistory } from "@/hooks/team-ops/use-work-calendar";
// local imports
import { PlanFields } from "./plan-fields";
import { getErrorMessage } from "./error-message";

type Props = {
  workspaceSlug: string;
  /** Whose calendar this is. */
  userId: string;
  day: TCalendarDay;
  /** Why the day cannot be changed, or `null` when it can. */
  lockedReason: string | null;
  onSave: (date: string, payload: TCalendarDayPayload) => Promise<unknown>;
  onReset: (date: string) => Promise<unknown>;
  onClose: () => void;
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const SOURCE_TEXT: Record<TCalendarDay["source"], string> = {
  MANUAL: "Set by hand",
  TEMPLATE: "From the weekly plan",
  HOLIDAY: "Holiday",
  NONE: "Nothing planned yet",
};

const HistoryItem = observer(function HistoryItem({ audit }: { audit: TCalendarAudit }) {
  const { getUserDetails } = useMember();
  const author = audit.changed_by ? (getUserDetails(audit.changed_by)?.display_name ?? "Someone") : "System";
  return (
    <li className="py-2">
      <p className="text-body-xs-regular text-primary">{summarizeAuditChange(audit)}</p>
      <p className="text-caption-sm-regular text-tertiary">
        {author} · {timeFormat.format(new Date(audit.created_at))}
      </p>
    </li>
  );
});

/** Side panel for one day: its plan, the form to change it and the history of changes. */
export const DayPanel = observer(function DayPanel(props: Props) {
  const { workspaceSlug, userId, day, lockedReason, onSave, onReset, onClose } = props;
  // states
  const [values, setValues] = useState<TPlanValues>(() => planFromDay(day));
  const [isSaving, setIsSaving] = useState(false);
  // hooks
  const { history, refresh: refreshHistory } = useDayHistory(workspaceSlug, userId, day.date);

  const isLocked = lockedReason !== null;
  const timesError = validatePlanTimes(values.mode, values.start, values.end);

  const run = async (action: () => Promise<unknown>, successTitle: string) => {
    setIsSaving(true);
    try {
      await action();
      setToast({ type: "success", title: successTitle, message: "" });
      await refreshHistory();
    } catch (error) {
      setToast({ type: "error", title: "Could not save", message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (timesError) return;
    return run(() => onSave(day.date, toDayPayload(values)), "Day saved");
  };

  return (
    <section aria-label="Selected day" className="flex flex-col gap-4 rounded-lg border border-subtle bg-surface-1 p-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-h6-medium text-primary">{dateFormat.format(parseDateKey(day.date))}</h2>
          <p className="text-caption-sm-regular text-tertiary">
            {SOURCE_TEXT[day.source]}
            {day.holiday && day.source !== "HOLIDAY" ? ` · Holiday: ${day.holiday}` : ""}
            {day.source === "HOLIDAY" && day.holiday ? `: ${day.holiday}` : ""}
          </p>
        </div>
        <IconButton
          icon={<Icon icon={CloseOutline} />}
          variant="ghost"
          size="sm"
          aria-label="Close"
          onClick={onClose}
        />
      </header>

      {isLocked ? (
        <p className="rounded-sm bg-layer-1 p-2 text-caption-sm-regular text-secondary">{lockedReason}</p>
      ) : null}

      <PlanFields
        values={values}
        onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
        disabled={isLocked || isSaving}
        timesError={timesError}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label="Save day"
          loading={isSaving}
          disabled={isLocked || !!timesError}
          onClick={handleSave}
        />
        {day.source === "MANUAL" ? (
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            label="Reset day"
            disabled={isLocked || isSaving}
            onClick={() => run(() => onReset(day.date), "Day reset")}
          />
        ) : null}
      </div>

      <p className="text-caption-sm-regular text-tertiary">{PLAN_NOTICE}</p>

      {history.length > 0 ? (
        <div>
          <h3 className="text-body-xs-medium text-secondary">History</h3>
          <ul className="divide-y divide-subtle">
            {history.map((audit) => (
              <HistoryItem key={audit.id} audit={audit} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
});
