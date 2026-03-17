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

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty } from "@plane/types";
import { cn, EHeaderVariant, Header, Loader } from "@plane/ui";
// local imports
import type { TAddFilterButtonProps } from "./add-filters/button";
import { RichFiltersList } from "./filters-list";
import { ElementTransition, RowTransition } from "./transition-components";
import { RichFiltersViewControls } from "./view-controls";

export type TFiltersRowProps<K extends TFilterProperty, E extends TExternalFilter> = {
  buttonConfig?: TAddFilterButtonProps<K, E>["buttonConfig"];
  disabledAllOperations?: boolean;
  filter: IFilterInstance<K, E>;
  variant?: "modal" | "header";
};

export const RichFiltersRow = observer(function FiltersRow<K extends TFilterProperty, E extends TExternalFilter>({
  buttonConfig,
  disabledAllOperations: disabledAllOperationsProp = false,
  filter,
  variant = "header",
}: TFiltersRowProps<K, E>) {
  // states
  const [isUpdating, setIsUpdating] = useState(false);
  // derived values
  const disabledAllOperations = disabledAllOperationsProp || !filter.configManager.areConfigsReady;
  const hasAnyConditions = filter.allConditionsForDisplay.length > 0;
  const hasAvailableOperations =
    !disabledAllOperations && (filter.canClearFilters || filter.canSaveView || filter.canUpdateView);

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      await filter.updateView();
    } finally {
      setTimeout(() => setIsUpdating(false), 240); // To avoid flickering
    }
  }, [filter]);

  const rightContent = !disabledAllOperations && (
    <div className="flex items-center gap-2">
      <ElementTransition show={filter.canClearFilters}>
        <Button
          variant="secondary"
          className={COMMON_OPERATION_BUTTON_CLASSNAME}
          onClick={() => void filter.clearFilters()}
        >
          {filter.clearFilterOptions?.label ?? "Clear all"}
        </Button>
      </ElementTransition>
      <RichFiltersViewControls
        save={{
          callback: filter.saveView,
          enabled: filter.canSaveView,
          label: filter.saveViewOptions?.label,
        }}
        update={{
          callback: handleUpdate,
          enabled: filter.canUpdateView,
          isUpdating,
          label: filter.updateViewOptions?.label,
        }}
      />
    </div>
  );

  const mainContent = (
    <div className="w-full flex items-start gap-2 bg-layer-1 px-4 py-2 rounded-lg">
      <div className="w-full flex flex-wrap items-center gap-2">
        <RichFiltersList
          disabledAllOperations={disabledAllOperations}
          filter={filter}
          variant={variant}
          buttonConfig={buttonConfig}
        />
      </div>
      <div
        className={cn("flex items-center gap-2 border-l border-subtle pl-4", {
          "border-l-transparent pl-0": !hasAvailableOperations,
        })}
      >
        {rightContent}
      </div>
    </div>
  );

  const ModalVariant = (
    <div className="w-full flex flex-wrap items-center gap-2 min-h-11 bg-layer-1 rounded-lg">{mainContent}</div>
  );

  const HeaderVariant = (
    <Header variant={EHeaderVariant.TERNARY} className="px-3! min-h-11 bg-surface-1">
      {mainContent}
    </Header>
  );

  if (!filter.configManager.areConfigsReady && !hasAnyConditions) {
    return (
      <RowTransition show={filter.isVisible}>
        <Loader>
          <Loader.Item height="44px" width="100%" className={cn({ "rounded-none": variant === "header" })} />
        </Loader>
      </RowTransition>
    );
  }

  return <RowTransition show={filter.isVisible}>{variant === "modal" ? ModalVariant : HeaderVariant}</RowTransition>;
});

const COMMON_OPERATION_BUTTON_CLASSNAME = "shrink-0 py-1";
