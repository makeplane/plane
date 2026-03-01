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

import type { FC } from "react";
import { observer } from "mobx-react";
import type { AsanaEnumOption } from "@plane/etl/asana";
import { useTranslation } from "@plane/i18n";
import { PriorityIcon } from "@plane/propel/icons";
// plane web components
import { Dropdown } from "@/components/importers/ui";
// plane web types
import type { TPlanePriorityData } from "@/types/importers";

type TMapPrioritiesSelection = {
  value: string | undefined;
  handleValue: (value: string | undefined) => void;
  asanaPriorityOption: AsanaEnumOption;
  planePriorities: TPlanePriorityData[];
};

export const MapPrioritiesSelection = observer(function MapPrioritiesSelection(props: TMapPrioritiesSelection) {
  const { value, handleValue, asanaPriorityOption, planePriorities } = props;
  const { t } = useTranslation();

  return (
    <div className="relative grid grid-cols-2 items-center p-3 text-13">
      <div className="text-secondary">{asanaPriorityOption?.name}</div>
      <div>
        <Dropdown
          dropdownOptions={(planePriorities || [])?.map((state) => ({
            key: state.key,
            label: state.label,
            value: state.key,
            data: state,
          }))}
          value={value}
          placeHolder={t("importers.select_priority")}
          onChange={(value: string | undefined) => handleValue(value)}
          iconExtractor={(option) => (
            <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
              <PriorityIcon priority={option?.key || "none"} />
            </div>
          )}
          queryExtractor={(option) => option.label}
        />
      </div>
    </div>
  );
});
