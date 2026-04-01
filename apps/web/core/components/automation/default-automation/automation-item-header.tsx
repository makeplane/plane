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
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";
import type { IProject } from "@plane/types";

import { FeatureFlagWrapper } from "./feature-flag";
import type { DefaultAutomation } from "./types";

type DefaultAutomationItemHeaderProps = {
  workspaceSlug: string;
  automation: DefaultAutomation;
  value: number;
  handleChange: (payload: Partial<IProject>) => void;
};

function AutomationItemHeader(props: DefaultAutomationItemHeaderProps) {
  const { workspaceSlug, automation, value, handleChange } = props;

  const { t } = useTranslation();

  return (
    <div className="relative flex items-center justify-between gap-6">
      <div className="space-y-1.5">
        <div className="text-14 font-medium line-clamp-1">{t(automation.i18n_name)}</div>
        <div className="text-12 text-subtle line-clamp-2">{t(automation.i18n_description)}</div>
      </div>
      <div>
        <FeatureFlagWrapper
          workspaceSlug={workspaceSlug}
          featureFlag={automation.feature_flag}
          showUpgradeButton={true}
        >
          <Switch value={value !== 0} onChange={(value) => handleChange({ [automation.type]: value ? 1 : 0 })} />
        </FeatureFlagWrapper>
      </div>
    </div>
  );
}

export const DefaultAutomationItemHeader = observer(AutomationItemHeader);
