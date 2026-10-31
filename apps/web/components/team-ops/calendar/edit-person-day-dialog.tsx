/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
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
import type { TCalendarDayPayload, TTeamDayRow } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useDayHistory } from "@/hooks/team-ops/use-work-calendar";
// local imports
import { getErrorMessage } from "./error-message";
import { PlanFields } from "./plan-fields";

type Props = {
  workspaceSlug: string;
  /** The day being changed, `YYYY-MM-DD`. */
  date: string;
  /** The person's day as the team table shows it. */
  row: TTeamDayRow;
  onSave: (payload: TCalendarDayPayload) => Promise<unknown>;
  onClose: () => void;
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** A manager changes one day of someone else's plan. The change is audited with both names. */
export const EditPersonDayDialog = observer(function EditPersonDayDialog(props: Props) {
  const { workspaceSlug, date, row, onSave, onClose } = props;
  // states
  const [values, setValues] = useState<TPlanValues>(() => planFromDay(row));
  const [isSaving, setIsSaving] = useState(false);
  // hooks
  const { getUserDetails } = useMember();
  const { history } = useDayHistory(workspaceSlug, row.user, date);

  const name = getUserDetails(row.user)?.display_name ?? "this person";
  const timesError = validatePlanTimes(values.mode, values.start, values.end);

  const handleSave = async () => {
    if (timesError) return;
    setIsSaving(true);
    try {
      await onSave(toDayPayload(values));
      setToast({ type: "success", title: `${name}'s day saved`, message: "" });
      onClose();
    } catch (error) {
      setToast({ type: "error", title: "Could not save", message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DialogMain>
        <DialogHeader>
          <DialogHeading>
            <DialogTitle>
              {name} · {dateFormat.format(parseDateKey(date))}
            </DialogTitle>
          </DialogHeading>
        </DialogHeader>
        <DialogBody tabIndex={0}>
          <div className="space-y-4">
            <PlanFields
              values={values}
              onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
              disabled={isSaving}
              timesError={timesError}
            />
            <p className="text-caption-sm-regular text-tertiary">
              You are changing someone else&rsquo;s plan; the change is recorded with your name. {PLAN_NOTICE}
            </p>
            {history.length > 0 ? (
              <div>
                <h3 className="text-body-xs-medium text-secondary">History</h3>
                <ul className="divide-y divide-subtle">
                  {history.slice(0, 5).map((audit) => (
                    <li key={audit.id} className="py-1.5 text-body-xs-regular text-primary">
                      {summarizeAuditChange(audit)}
                      <span className="text-tertiary">
                        {" "}
                        · {audit.changed_by ? (getUserDetails(audit.changed_by)?.display_name ?? "Someone") : "System"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <Button variant="secondary" size="sm" stretch="auto" label="Cancel" onClick={onClose} />
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label="Save day"
          loading={isSaving}
          disabled={!!timesError}
          onClick={handleSave}
        />
      </DialogActions>
    </div>
  );
});
