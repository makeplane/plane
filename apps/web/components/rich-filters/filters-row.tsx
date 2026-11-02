/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { AddFilterOutline, ArrowCollapseOutline } from "@makeplane/propel/icons";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { useTranslation } from "@plane/i18n";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty } from "@plane/types";
import { EHeaderVariant, Header } from "@plane/blocks/layout";
import { Loader } from "@plane/blocks/skeleton";
import { cn } from "@plane/utils";
// local imports
import type { TAddFilterButtonProps } from "./add-filters/button";
import { AddFilterButton } from "./add-filters/button";
import { FilterItem } from "./filter-item/root";
import { ElementTransition, RowTransition } from "./transition-components";
import { RichFiltersViewControls } from "./view-controls";

export type TFiltersRowProps<K extends TFilterProperty, E extends TExternalFilter> = {
  buttonConfig?: TAddFilterButtonProps<K, E>["buttonConfig"];
  disabledAllOperations?: boolean;
  filter: IFilterInstance<K, E>;
  variant?: "modal" | "header";
};

export const FiltersRow = observer(function FiltersRow<K extends TFilterProperty, E extends TExternalFilter>(
  props: TFiltersRowProps<K, E>
) {
  const { buttonConfig, disabledAllOperations: disabledAllOperationsProp = false, filter, variant = "header" } = props;
  // states
  const [isUpdating, setIsUpdating] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const disabledAllOperations = disabledAllOperationsProp || !filter.configManager.areConfigsReady;
  const hasAnyConditions = filter.allConditionsForDisplay.length > 0;
  const showMinimize = !disabledAllOperations && variant === "header";
  const hasAvailableOperations =
    !disabledAllOperations && (filter.canClearFilters || filter.canSaveView || filter.canUpdateView || showMinimize);

  const headerButtonConfig: Partial<TAddFilterButtonProps<K, E>["buttonConfig"]> = {
    label: null,
  };

  const modalButtonConfig: Partial<TAddFilterButtonProps<K, E>["buttonConfig"]> = {
    label: !hasAnyConditions ? "Filters" : null,
  };

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      await filter.updateView();
    } finally {
      setTimeout(() => setIsUpdating(false), 240); // To avoid flickering
    }
  }, [filter]);

  const leftContent = (
    <>
      {filter.allConditionsForDisplay.map((condition) => (
        <FilterItem key={condition.id} filter={filter} condition={condition} isDisabled={disabledAllOperations} />
      ))}
      <AddFilterButton
        filter={filter}
        buttonConfig={{
          label: null,
          ...(variant === "modal" ? modalButtonConfig : headerButtonConfig),
          size: "md",
          iconConfig: {
            shouldShowIcon: true,
            iconComponent: AddFilterOutline,
          },
          ...buttonConfig,
          isDisabled: disabledAllOperations,
        }}
      />
    </>
  );

  const rightContent = !disabledAllOperations && (
    <>
      <ElementTransition show={filter.canClearFilters}>
        <Button
          variant="ghost"
          size="md"
          stretch="auto"
          label={filter.clearFilterOptions?.label ?? "Clear all"}
          onClick={filter.clearFilters}
        />
      </ElementTransition>
      <RichFiltersViewControls
        save={{ enabled: filter.canSaveView, label: filter.saveViewOptions?.label, onClick: filter.saveView }}
        update={{
          enabled: filter.canUpdateView,
          isUpdating,
          label: filter.updateViewOptions?.label,
          onClick: handleUpdate,
        }}
      />
      {showMinimize && (
        <IconButton
          variant="ghost"
          size="md"
          icon={<Icon icon={ArrowCollapseOutline} />}
          onClick={() => filter.toggleVisibility(false)}
          aria-label={t("rich_filters.view_controls.hide_filters")}
        />
      )}
    </>
  );

  const mainContent = (
    <div className="flex w-full items-start gap-2 rounded-lg bg-layer-1 px-4 py-2">
      <div className="flex w-full flex-wrap items-center gap-2">{leftContent}</div>
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
    <div className="flex min-h-11 w-full flex-wrap items-center gap-2 rounded-lg bg-layer-1">{mainContent}</div>
  );

  const HeaderVariant = (
    <Header variant={EHeaderVariant.TERNARY} className="min-h-11 bg-surface-1 !px-3">
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
