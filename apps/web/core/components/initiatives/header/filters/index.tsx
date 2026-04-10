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

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TInitiativeDisplayFilters } from "@plane/types";
// plane web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import { DisplayFiltersSelection, FiltersDropdown } from "./header";

export * from "./header";

type Props = {
  workspaceSlug: string;
  isArchived?: boolean;
};

export const HeaderFilters = observer(function HeaderFilters(props: Props) {
  const { workspaceSlug, isArchived = false } = props;
  const {
    initiativeFilters: { currentInitiativeDisplayFilters, updateDisplayFilters },
  } = useInitiatives();

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<TInitiativeDisplayFilters>) => {
      if (!workspaceSlug) return;
      updateDisplayFilters(workspaceSlug, updatedDisplayFilter, isArchived);
    },
    [workspaceSlug, updateDisplayFilters, isArchived]
  );

  return (
    <FiltersDropdown title="Display" placement="bottom-end">
      <DisplayFiltersSelection
        displayFilters={currentInitiativeDisplayFilters ?? {}}
        handleDisplayFiltersUpdate={handleDisplayFilters}
      />
    </FiltersDropdown>
  );
});
