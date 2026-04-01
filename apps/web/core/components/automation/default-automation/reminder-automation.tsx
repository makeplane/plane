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

import { observer } from "mobx-react";

// plane imports
import { PROJECT_AUTOMATION_DAYS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomSelect } from "@plane/ui";

import type { DefaultAutomationContentProps } from "./types";

function ReminderAutomation(props: DefaultAutomationContentProps) {
  const { value, handleChange } = props;

  const { t } = useTranslation();

  return (
    <CustomSelect
      value={value}
      label={`${value} ${value === 1 ? "day" : "days"}`}
      onChange={(val: number) => handleChange?.({ auto_reminder_days: val })}
      input
    >
      <>
        {PROJECT_AUTOMATION_DAYS.map((day) => (
          <CustomSelect.Option key={day.value} value={day.value}>
            <span className="text-13">{t(day.i18n_label, { days: day.value })}</span>
          </CustomSelect.Option>
        ))}
      </>
    </CustomSelect>
  );
}

export const DefaultReminderAutomation = observer(ReminderAutomation);
