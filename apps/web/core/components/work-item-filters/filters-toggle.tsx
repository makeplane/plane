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
import { useParams } from "react-router";
// plane imports
import { IconButton } from "@plane/propel/icon-button";
import { FilterIcon } from "@plane/propel/icons";
import type { WorkItemFiltersEntity } from "@plane/constants";
// components
import { FiltersToggle } from "@/components/rich-filters/filters-toggle";
// hooks
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

type TWorkItemFiltersToggleProps = {
  enablePQL?: boolean;
  entityType: WorkItemFiltersEntity;
  entityId: string;
};

export const WorkItemFiltersToggle = observer(function WorkItemFiltersToggle(props: TWorkItemFiltersToggleProps) {
  const { enablePQL = false, entityType, entityId } = props;
  // params
  const { workspaceSlug } = useParams();
  // feature flag
  const isPQLFlagEnabled = useFlag(workspaceSlug, "PQL");
  // store hooks
  const { getFilter } = useWorkItemFilters();
  // derived values
  const filter = getFilter(entityType, entityId);
  const isFiltersRowVisible = !!filter?.isFiltersRowVisible;

  return (
    <>
      {enablePQL && isPQLFlagEnabled ? (
        <IconButton
          size="lg"
          variant="secondary"
          icon={FilterIcon}
          onClick={() => filter?.toggleFiltersRowVisibility()}
          className={
            isFiltersRowVisible
              ? "bg-accent-subtle hover:bg-accent-subtle-hover active:bg-accent-subtle-hover focus:bg-accent-subtle-hover border-accent-strong text-accent-primary [&_path]:fill-current"
              : ""
          }
        />
      ) : (
        <FiltersToggle filter={filter?.richFiltersInstance} />
      )}
    </>
  );
});
