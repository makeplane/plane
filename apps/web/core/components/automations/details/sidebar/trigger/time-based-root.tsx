/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useTranslation } from "@plane/i18n";
import { Tabs } from "@plane/propel/tabs";
import type { TFixedScheduleConfig } from "./schedule-config";
import { getFixedScheduleValidationErrorKey } from "./schedule-config";
import type { TCronScheduleConfig } from "./cron-config";
import { AutomationDetailsSidebarTriggerSchedule } from "./schedule";
import { AutomationDetailsSidebarTriggerCronSchedule } from "./cron-schedule";

type Props = {
  scheduleMethod: "fixed" | "cron";
  onScheduleMethodChange: (method: "fixed" | "cron") => void;
  fixedScheduleConfig: TFixedScheduleConfig;
  onFixedScheduleChange: (config: TFixedScheduleConfig) => void;
  cronScheduleConfig: TCronScheduleConfig;
  onCronScheduleChange: (config: TCronScheduleConfig) => void;
};

export const AutomationDetailsSidebarTriggerTimeBasedRoot = (props: Props) => {
  const {
    scheduleMethod,
    onScheduleMethodChange,
    fixedScheduleConfig,
    onFixedScheduleChange,
    cronScheduleConfig,
    onCronScheduleChange,
  } = props;
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2 px-4">
        <p className="text-body-xs-medium text-primary">{t("automations.trigger.schedule.schedule_mode")}</p>
        <Tabs value={scheduleMethod} onValueChange={(value) => onScheduleMethodChange(value as "fixed" | "cron")}>
          <Tabs.List className="h-7">
            <Tabs.Trigger value="fixed" size="sm">
              {t("automations.trigger.schedule.schedule_mode_fixed")}
            </Tabs.Trigger>
            <Tabs.Trigger value="cron" size="sm">
              {t("automations.trigger.schedule.schedule_mode_cron")}
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>
      {scheduleMethod === "cron" ? (
        <AutomationDetailsSidebarTriggerCronSchedule value={cronScheduleConfig} onChange={onCronScheduleChange} />
      ) : (
        <AutomationDetailsSidebarTriggerSchedule
          value={fixedScheduleConfig}
          onChange={onFixedScheduleChange}
          validationErrorKey={getFixedScheduleValidationErrorKey(fixedScheduleConfig)}
        />
      )}
    </div>
  );
};
