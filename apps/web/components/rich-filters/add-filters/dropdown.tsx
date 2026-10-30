/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
// plane imports
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSearch,
} from "@makeplane/propel/components/combobox";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty, TSupportedOperators } from "@plane/types";
import { cn, getOperatorForPayload } from "@plane/utils";
import { getFilterPropertyLabel } from "../property-label";

export type TAddFilterDropdownProps<P extends TFilterProperty, E extends TExternalFilter> = {
  customButton: React.ReactNode;
  /** Names the trigger when `customButton` has no visible text (the icon-only add-filter button). */
  triggerAriaLabel?: string;
  buttonConfig?: {
    className?: string;
    defaultOpen?: boolean;
    isDisabled?: boolean;
  };
  filter: IFilterInstance<P, E>;
  handleFilterSelect: (property: P, operator: TSupportedOperators, isNegation: boolean) => void;
};

export const AddFilterDropdown = observer(function AddFilterDropdown<
  P extends TFilterProperty,
  E extends TExternalFilter,
>(props: TAddFilterDropdownProps<P, E>) {
  const { filter, customButton, triggerAriaLabel, buttonConfig } = props;
  const { className, defaultOpen = false, isDisabled = false } = buttonConfig || {};
  // states
  const [searchQuery, setSearchQuery] = useState("");
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const availableConfigs = filter.configManager.allAvailableConfigs;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleConfigs = normalizedQuery
    ? availableConfigs.filter((config) =>
        getFilterPropertyLabel(config.id, config.label, t).toLowerCase().includes(normalizedQuery)
      )
    : availableConfigs;
  // Every filter already applied reads differently from a search that matched nothing.
  const emptyLabel = availableConfigs.length === 0 ? "All filters applied" : t("common.search.no_matching_results");

  const handleFilterSelect = (property: P) => {
    const config = filter.configManager.getConfigByProperty(property);
    if (config?.firstOperator) {
      const { operator, isNegation } = getOperatorForPayload(config.firstOperator);
      props.handleFilterSelect(property, operator, isNegation);
    } else {
      setToast({
        title: t("web_ui.filter_configuration_error"),
        message: t("web_ui.this_filter_is_not_properly_configured_and_cannot_be_applied"),
        type: "error",
      });
    }
  };

  return (
    <div className="relative flex-shrink-0 text-left transition-all duration-200 ease-in-out">
      <Combobox
        value=""
        onValueChange={(value) => {
          if (typeof value === "string" && value) handleFilterSelect(value as P);
        }}
        defaultOpen={defaultOpen}
        disabled={isDisabled}
        onOpenChange={(open) => {
          if (!open) setSearchQuery("");
        }}
      >
        {/* The caller's button is content, not a button: the trigger stays the one interactive element. */}
        <BaseCombobox.Trigger
          aria-label={triggerAriaLabel}
          className={cn(
            "flex w-full items-center justify-between gap-1 text-11 outline-none",
            isDisabled ? "cursor-not-allowed text-secondary" : "cursor-pointer hover:bg-layer-transparent-hover",
            className
          )}
        >
          {customButton}
        </BaseCombobox.Trigger>
        <ComboboxContent
          sizing="auto"
          aria-label={t("common.filters")}
          search={
            <ComboboxSearch
              placeholder={t("search")}
              aria-label={t("search")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          }
        >
          <ComboboxList aria-label={t("common.filters")}>
            {visibleConfigs.map((config) => (
              <ComboboxItem
                key={config.id}
                value={config.id}
                label={getFilterPropertyLabel(config.id, config.label, t)}
                icon={config.icon ? <config.icon className="size-4 text-tertiary" /> : undefined}
                trailing={config.rightContent ? <>{config.rightContent}</> : undefined}
              />
            ))}
            {/* Stays mounted, children conditional: a polite live region announces unreliably when swapped in and out. */}
            <ComboboxEmpty>{visibleConfigs.length === 0 ? emptyLabel : null}</ComboboxEmpty>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
});
