/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PLAN_NOTICE } from "@plane/services";
// hooks
import { useCalendarSettings, useWeeklyPlan } from "@/hooks/team-ops/use-work-calendar";
// local imports
import { HolidaysSection } from "./holidays-section";
import { PolicyForm } from "./policy-form";
import { TeamsSection } from "./teams-section";
import { WeeklyPlanEditor } from "./weekly-plan-editor";

type Props = {
  workspaceSlug: string;
};

export const CalendarSettingsRoot = observer(function CalendarSettingsRoot({ workspaceSlug }: Props) {
  // hooks
  const { settings, permissions, updateSettings } = useCalendarSettings(workspaceSlug);
  const { plan, isLoading, error, savePlan } = useWeeklyPlan(workspaceSlug);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <p className="text-caption-sm-regular text-tertiary">{PLAN_NOTICE}</p>

      {error ? (
        <p role="alert" className="text-body-sm-medium text-danger-primary">
          Your weekly plan could not be loaded. Reload the page to try again.
        </p>
      ) : null}

      {isLoading || !settings ? null : (
        <WeeklyPlanEditor plan={plan} horizonWeeks={settings.template_horizon_weeks} onSave={savePlan} />
      )}

      {permissions?.can_manage && settings ? (
        <>
          <PolicyForm settings={settings} onSave={updateSettings} />
          <TeamsSection workspaceSlug={workspaceSlug} />
          <HolidaysSection workspaceSlug={workspaceSlug} />
        </>
      ) : null}
    </div>
  );
});
