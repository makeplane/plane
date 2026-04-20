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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { PROJECT_AUTOMATION_MONTHS } from "@plane/constants";
import { CustomSelect } from "@plane/ui";
// types
import type { DefaultAutomationContentProps } from "./types";
// local imports
import { AutomationMonthModal } from "./automation-month-modal";
import { useProjectSettingsAccess } from "@/hooks/permissions/use-project-settings-access";

function CloseAutomation(props: DefaultAutomationContentProps) {
  const { workspaceSlug, projectId, value, handleChange } = props;
  // states
  const [modal, setModal] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { canAccessProjectSetting } = useProjectSettingsAccess();
  // derived values
  const canAccessAutomationSettings = canAccessProjectSetting(workspaceSlug, projectId, "automations");

  return (
    <div>
      <AutomationMonthModal
        type="auto-close"
        initialValues={{ close_in: value }}
        isOpen={modal}
        handleClose={() => setModal(false)}
        handleChange={handleChange}
      />
      <CustomSelect
        value={value}
        label={`${value} ${value === 1 ? "month" : "months"}`}
        onChange={(val: number) => handleChange?.({ close_in: val })}
        input
        disabled={!canAccessAutomationSettings}
      >
        <>
          {PROJECT_AUTOMATION_MONTHS.map((month) => (
            <CustomSelect.Option key={month.value} value={month.value}>
              {t(month.i18n_label, { months: month.value })}
            </CustomSelect.Option>
          ))}
          <button
            type="button"
            className="flex w-full select-none items-center rounded-sm px-1 py-1.5 text-secondary hover:bg-layer-1"
            onClick={() => setModal(true)}
          >
            {t("common.customize_time_range")}
          </button>
        </>
      </CustomSelect>
    </div>
  );
}

export const DefaultCloseAutomation = observer(CloseAutomation);
