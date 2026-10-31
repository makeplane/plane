/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import { InputField } from "@makeplane/propel/components/input-field";
import { SelectField } from "@makeplane/propel/components/select-field";
import { setToast } from "@plane/blocks/toast";
import { ISO_WEEKDAYS, WEEKDAY_NAMES } from "@plane/services";
import type { TCalendarSettings, TCalendarSettingsResponse, TEditOthersAccess, TTeamViewAccess } from "@plane/types";
// local imports
import { getErrorMessage } from "./error-message";

type Props = {
  settings: TCalendarSettings;
  onSave: (payload: Partial<TCalendarSettings>) => Promise<TCalendarSettingsResponse>;
};

const TEAM_VIEW_OPTIONS: { value: TTeamViewAccess; label: string }[] = [
  { value: "ADMINS", label: "Workspace admins only" },
  { value: "ADMINS_AND_LEADS", label: "Admins and team leads" },
  { value: "ALL_MEMBERS", label: "All members" },
];

const EDIT_OTHERS_OPTIONS: { value: TEditOthersAccess; label: string }[] = [
  { value: "NONE", label: "Nobody" },
  { value: "ADMINS", label: "Workspace admins only" },
  { value: "ADMINS_AND_LEADS", label: "Admins and team leads" },
];

const inRange = (value: string, min: number, max: number) => {
  const number = Number(value);
  return value !== "" && Number.isInteger(number) && number >= min && number <= max;
};

/** The workspace policy: who sees the team, who may change other people's plans, and the working week. */
export function PolicyForm({ settings, onSave }: Props) {
  // states
  const [teamView, setTeamView] = useState<TTeamViewAccess>(settings.team_view_access);
  const [editOthers, setEditOthers] = useState<TEditOthersAccess>(settings.edit_others_access);
  const [pastDays, setPastDays] = useState(String(settings.member_edit_past_days));
  const [horizon, setHorizon] = useState(String(settings.template_horizon_weeks));
  const [weekdays, setWeekdays] = useState<number[]>(settings.working_weekdays);
  const [isSaving, setIsSaving] = useState(false);

  const pastDaysValid = inRange(pastDays, 0, 366);
  const horizonValid = inRange(horizon, 1, 26);
  const canSave = pastDaysValid && horizonValid && weekdays.length > 0;

  const toggleWeekday = (weekday: number) =>
    setWeekdays((current) =>
      ISO_WEEKDAYS.filter((day) => (day === weekday ? !current.includes(day) : current.includes(day)))
    );

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSave({
        team_view_access: teamView,
        edit_others_access: editOthers,
        member_edit_past_days: Number(pastDays),
        template_horizon_weeks: Number(horizon),
        working_weekdays: weekdays,
      });
      setToast({ type: "success", title: "Calendar policy saved", message: "" });
    } catch (error) {
      setToast({ type: "error", title: "Could not save", message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-subtle bg-surface-1 p-4">
      <div>
        <h2 className="text-h6-medium text-primary">Policy</h2>
        <p className="text-caption-sm-regular text-tertiary">
          Workspace admins always see the whole team. Team leads are the leads set in Teams below.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          size="lg"
          label="Who sees the team calendar"
          options={TEAM_VIEW_OPTIONS}
          value={teamView}
          onValueChange={(value) => value && setTeamView(value as TTeamViewAccess)}
        />
        <SelectField
          size="lg"
          label="Who edits other people's plans"
          options={EDIT_OTHERS_OPTIONS}
          value={editOthers}
          onValueChange={(value) => value && setEditOthers(value as TEditOthersAccess)}
        />
        <InputField
          type="number"
          min={0}
          max={366}
          size="lg"
          orientation="vertical"
          label="Past days members can edit"
          hint="0 means today and the future only. Admins can change any day."
          value={pastDays}
          onChange={(event) => setPastDays(event.target.value)}
          error={pastDaysValid ? undefined : "Enter a whole number from 0 to 366."}
        />
        <InputField
          type="number"
          min={1}
          max={26}
          size="lg"
          orientation="vertical"
          label="Weeks to plan ahead"
          hint="Plans are extended every day."
          value={horizon}
          onChange={(event) => setHorizon(event.target.value)}
          error={horizonValid ? undefined : "Enter a whole number from 1 to 26."}
        />
      </div>

      <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
        <legend className="mb-1 text-body-xs-medium text-secondary">
          Working days (a working day with no plan shows as Not planned)
        </legend>
        {ISO_WEEKDAYS.map((weekday) => (
          <CheckboxField
            key={weekday}
            size="lg"
            label={WEEKDAY_NAMES[weekday]}
            checked={weekdays.includes(weekday)}
            onCheckedChange={() => toggleWeekday(weekday)}
          />
        ))}
      </fieldset>

      <div>
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label="Save policy"
          loading={isSaving}
          disabled={!canSave}
          onClick={handleSave}
        />
      </div>
    </section>
  );
}
