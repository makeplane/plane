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
import { Loader } from "@plane/ui";
import { FiltersRow } from "@/components/rich-filters/filters-row";
import { useInitiativesFilterContext } from "./context";

const InitiativesFiltersRow = observer(function InitiativesFiltersRow() {
  const { filterInstance, isReady } = useInitiativesFilterContext();

  if (!isReady || !filterInstance) {
    return (
      <div className="px-page-x @container flex flex-wrap justify-between py-2 border-b border-subtle-1 gap-2 bg-surface-1 z-[12]">
        <Loader.Item height="24px" width="100%" />
      </div>
    );
  }

  return (
    <FiltersRow
      filter={filterInstance}
      buttonConfig={{
        variant: "secondary",
        label: "Filters",
        defaultOpen: false,
        className: "bg-surface-1",
      }}
    />
  );
});

export default InitiativesFiltersRow;
