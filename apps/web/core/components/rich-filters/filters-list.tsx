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
import { ListFilterPlus } from "lucide-react";
// plane imports
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty } from "@plane/types";
// local imports
import type { TAddFilterButtonProps } from "./add-filters/button";
import { AddFilterButton } from "./add-filters/button";
import { FilterItem } from "./filter-item/root";

type Props<K extends TFilterProperty, E extends TExternalFilter> = {
  buttonConfig?: TAddFilterButtonProps<K, E>["buttonConfig"];
  disabledAllOperations?: boolean;
  filter: IFilterInstance<K, E>;
  variant?: "modal" | "header" | "transparent";
};

export const RichFiltersList = observer(function RichFiltersList<K extends TFilterProperty, E extends TExternalFilter>({
  buttonConfig,
  disabledAllOperations: disabledAllOperationsProp = false,
  filter,
  variant = "header",
}: Props<K, E>) {
  // derived values
  const disabledAllOperations = disabledAllOperationsProp || !filter.configManager.areConfigsReady;
  const hasAnyConditions = filter.allConditionsForDisplay.length > 0;

  const headerButtonConfig: Partial<TAddFilterButtonProps<K, E>["buttonConfig"]> = {
    label: null,
  };

  const modalButtonConfig: Partial<TAddFilterButtonProps<K, E>["buttonConfig"]> = {
    label: !hasAnyConditions ? "Filters" : null,
  };

  return (
    <>
      {filter.allConditionsForDisplay.map((condition) => (
        <FilterItem key={condition.id} filter={filter} condition={condition} isDisabled={disabledAllOperations} />
      ))}
      <AddFilterButton
        filter={filter}
        buttonConfig={{
          label: null,
          ...(variant === "modal" ? modalButtonConfig : headerButtonConfig),
          size: "lg",
          iconConfig: {
            shouldShowIcon: true,
            iconComponent: ListFilterPlus,
          },
          ...buttonConfig,
          isDisabled: disabledAllOperations,
        }}
      />
    </>
  );
});
