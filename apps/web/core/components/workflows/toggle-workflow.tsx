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
import { Switch } from "@plane/propel/switch";
import { observer } from "mobx-react";

type Props = {
  isEnabled: boolean;
  disabled?: boolean;
  onToggle: (isEnabled: boolean) => void;
};

export const ToggleWorkflow = observer(function ToggleWorkflow(props: Props) {
  const { isEnabled, disabled = false, onToggle } = props;
  // hooks
  const { t } = useTranslation();

  return (
    <div className="border border-subtle flex justify-between items-center p-4 rounded-md">
      <div className="flex flex-col gap-1.5">
        <p className="text-body-md-medium">{t("project_settings.workflows.toggle.title")}</p>
        <p className="text-caption-md-regular text-tertiary">{t("project_settings.workflows.toggle.description")}</p>
      </div>
      <Switch value={isEnabled} onChange={onToggle} disabled={disabled} />
    </div>
  );
});
