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
import { Input } from "@plane/ui";
// local imports
import { TimezoneSelect } from "@/components/common/timezone-select";
import type { TCronScheduleConfig } from "./cron-config";
import { getCronHumanReadable, getCronValidationError } from "./cron-config";

type Props = {
  value: TCronScheduleConfig;
  onChange: (value: TCronScheduleConfig) => void;
};

export const AutomationDetailsSidebarTriggerCronSchedule = (props: Props) => {
  const { value, onChange } = props;
  const { t } = useTranslation();

  const validationError = getCronValidationError(value.cronExpression);
  const humanReadable = getCronHumanReadable(value.cronExpression);

  return (
    <div className="space-y-4 px-4">
      <div className="space-y-2">
        <p className="text-body-xs-medium text-primary">{t("automations.trigger.schedule.cron_expression_label")}</p>
        <Input
          type="text"
          value={value.cronExpression}
          onChange={(e) => onChange({ ...value, cronExpression: e.target.value })}
          placeholder={t("automations.trigger.schedule.cron_expression_placeholder")}
          className="text-caption-sm-regular w-full h-7 rounded-md border-[0.5px] border-subtle-1 px-3"
        />
        {validationError ? (
          <p className="text-caption-sm-regular text-danger-primary">
            {t("automations.trigger.schedule.cron_invalid")}
          </p>
        ) : humanReadable ? (
          <p className="text-caption-sm-regular text-tertiary rounded-md bg-layer-1 px-3 py-2">
            {t("automations.trigger.schedule.cron_preview", { description: humanReadable })}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-body-xs-medium text-primary">{t("automations.trigger.schedule.timezone")}</p>
        <TimezoneSelect
          value={value.timezone}
          onChange={(timezone) => onChange({ ...value, timezone })}
          label={t("automations.trigger.schedule.timezone_placeholder")}
          buttonClassName="text-caption-sm-regular w-full h-7 px-4 rounded-md"
          className="w-full"
        />
      </div>
    </div>
  );
};
