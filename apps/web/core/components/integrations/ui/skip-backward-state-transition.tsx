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
import { Checkbox } from "@plane/ui";

type TSkipBackwardStateTransition = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function SkipBackwardStateTransition({ value, onChange }: TSkipBackwardStateTransition) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-row items-center gap-2 mb-4">
      <div className="text-body-xs-regular text-secondary">{t("integrations.skip_backward_state_movement")}</div>
      <Checkbox
        containerClassName="size-3.5"
        iconClassName="size-3.5"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}
