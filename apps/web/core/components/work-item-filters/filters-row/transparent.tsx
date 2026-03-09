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
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty } from "@plane/types";
// local imports
import type { TAddFilterButtonProps } from "../../rich-filters/add-filters/button";
import { RichFiltersList } from "../../rich-filters/filters-list";

type Props<K extends TFilterProperty, E extends TExternalFilter> = {
  buttonConfig?: TAddFilterButtonProps<K, E>["buttonConfig"];
  disabledAllOperations?: boolean;
  filter: IFilterInstance<K, E>;
};

export const WorkItemFiltersTransparentRow = observer(function WorkItemFiltersTransparentRow<
  K extends TFilterProperty,
  E extends TExternalFilter,
>({ buttonConfig, disabledAllOperations: disabledAllOperationsProp = false, filter }: Props<K, E>) {
  // derived values
  const disabledAllOperations = disabledAllOperationsProp || !filter.configManager.areConfigsReady;

  return (
    <div className="w-full flex flex-wrap items-center gap-2">
      <RichFiltersList disabledAllOperations={disabledAllOperations} filter={filter} buttonConfig={buttonConfig} />
    </div>
  );
});
