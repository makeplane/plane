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

import { useMemo } from "react";
import { capitalize } from "lodash-es";
import { CheckIcon, ChevronDownIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TEstimateSystemKeys } from "@plane/types";
import { Dropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { isEstimateSystemEnabled } from "@/components/estimates/helper";
import { UpgradeBadge } from "@/components/workspace/upgrade-badge";
import { ESTIMATE_SYSTEMS } from "@/constants/estimates";

type TProps = {
  estimateType?: TEstimateSystemKeys;
  onChange?: (estimateType: TEstimateSystemKeys) => void;
  currentEstimateType?: TEstimateSystemKeys;
};

export function EstimateSwitchDropdown(props: TProps) {
  const { t } = useTranslation();
  const { estimateType, onChange, currentEstimateType } = props;
  const options = useMemo(
    () =>
      Object.keys(ESTIMATE_SYSTEMS)
        .filter((system) => system !== currentEstimateType)
        .map((system) => ({
          value: system,
          data: system,
          disabled: !isEstimateSystemEnabled(system as TEstimateSystemKeys),
        })),
    [currentEstimateType]
  );

  return (
    <Dropdown
      buttonContainerClassName="text-left w-full border border-subtle-1 rounded-sm px-3 py-2 bg-surface-1"
      buttonContent={(isOpen, value) => (
        <span className="flex-grow truncate flex justify-between items-center">
          {value ? (
            capitalize(value as string)
          ) : (
            <span className="text-placeholder">{t("project_settings.estimates.select")}</span>
          )}
          {<ChevronDownIcon className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform", isOpen && "rotate-180")} />}
        </span>
      )}
      options={options}
      renderItem={(option) => (
        <>
          <span className="flex-grow capitalize truncate">{option.value}</span>
          {option.disabled && <UpgradeBadge />}
          {option.selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
        </>
      )}
      inputPlaceholder={t("project_settings.estimates.select")}
      disableSearch
      value={estimateType || ""}
      onChange={(value) => onChange && onChange(value as TEstimateSystemKeys)}
      keyExtractor={(option) => option.value}
    />
  );
}
