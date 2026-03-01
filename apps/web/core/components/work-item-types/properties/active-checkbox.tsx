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
import { Tooltip } from "@plane/propel/tooltip";
import { Checkbox } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";

type TPropertyActiveCheckboxProps = {
  value: boolean;
  onEnableDisable: (value: boolean) => void;
};

export const PropertyActiveCheckbox = observer(function PropertyActiveCheckbox(props: TPropertyActiveCheckboxProps) {
  const { value, onEnableDisable } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <Tooltip
      className="shadow"
      tooltipContent={
        value
          ? t("work_item_types.settings.properties.enable_disable.tooltip.disabled")
          : t("work_item_types.settings.properties.enable_disable.tooltip.enabled")
      }
      position="bottom"
    >
      <span
        className="flex items-center gap-1.5 text-tertiary text-caption-md-medium cursor-pointer select-none"
        onClick={() => onEnableDisable(!value)}
      >
        <Checkbox
          checked={value}
          className={cn("size-3.5", {
            "bg-surface-1": !value,
          })}
          iconClassName="size-3.5"
        />
        {t("work_item_types.settings.properties.enable_disable.label")}
      </span>
    </Tooltip>
  );
});
