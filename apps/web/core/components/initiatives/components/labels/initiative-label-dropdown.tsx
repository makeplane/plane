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
import { useState } from "react";
import { observer } from "mobx-react";
import { Loader } from "lucide-react";
import { CheckIcon, PlusIcon, LabelPropertyIcon } from "@plane/propel/icons";

// plane imports
import { useTranslation } from "@plane/i18n";
import { Combobox } from "@plane/propel/combobox";
import type { TInitiativeLabel } from "@plane/types";
import { cn } from "@plane/utils";

// types
import type { TInitiativeDetailPermissions } from "@/store/initiatives/permissions/root";

export type TInitiativeLabelDropdownProps = {
  value: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  buttonClassName?: string;
  className?: string;
  tabIndex?: number;
  showTooltip?: boolean;
  placeholder?: string;
  readonly?: boolean;
  labels?: Map<string, TInitiativeLabel>;
  onAddLabel?: (labelName: string) => Promise<TInitiativeLabel>;
  workspaceSlug?: string;
  size?: "xs" | "sm" | "md" | "lg";
  labelPermissions?: TInitiativeDetailPermissions["labels"];
};

export const InitiativeLabelDropdown = observer(function InitiativeLabelDropdown(props: TInitiativeLabelDropdownProps) {
  const {
    value,
    onChange,
    disabled = false,
    buttonClassName = "",
    className = "",
    placeholder = "Select label",
    readonly = false,
    labels = new Map(),
    onAddLabel,
    workspaceSlug,
    size = "sm",
    labelPermissions,
  } = props;
  // plane hooks
  const { t } = useTranslation();

  // states
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // derived values
  const labelOptions = Array.from(labels.values()).map((label) => ({
    value: label.id,
    query: label.name,
    content: (
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label.color,
          }}
        />
        <span className="flex-grow truncate text-left text-11">{label.name}</span>
      </div>
    ),
  }));

  const sizeConfig = {
    xs: {
      button: "h-6 px-1.5 py-0.5 text-11 gap-1",
      icon: "h-3 w-3",
      dropdown: "w-40 text-11",
      optionPadding: "px-1 py-1",
    },
    sm: {
      button: "h-7 px-2 py-1 text-11 gap-1",
      icon: "h-4 w-4",
      dropdown: "w-48 text-11",
      optionPadding: "px-1 py-1.5",
    },
    md: {
      button: "h-8 px-2.5 py-1.5 text-13 gap-2",
      icon: "h-4 w-4",
      dropdown: "w-56 text-13",
      optionPadding: "px-2 py-2",
    },
    lg: {
      button: "h-10 px-3 py-2 text-13 gap-2",
      icon: "h-5 w-5",
      dropdown: "w-64 text-13",
      optionPadding: "px-2 py-2.5",
    },
  };

  const currentSize = sizeConfig[size];

  const canCreateLabel = labelPermissions?.canCreate ?? false;

  const filteredOptions =
    query === ""
      ? labelOptions
      : labelOptions?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const selectedLabels = labelOptions.filter((option) => value.includes(option.value));

  const handleValueChange = (newValue: string | string[]) => {
    if (Array.isArray(newValue)) {
      onChange?.(newValue);
    } else {
      onChange?.([newValue]);
    }
  };

  const handleAddLabel = async (labelName: string) => {
    if (!labelName.length || !onAddLabel) return;
    setSubmitting(true);
    try {
      const newLabel = await onAddLabel(labelName);
      onChange?.([...value, newLabel.id]);
      setQuery("");
    } catch (error) {
      console.error("Error creating label:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLabel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (query.length) {
      handleAddLabel(query);
    }
  };

  return (
    <div className={cn("contain-layout", className)}>
      <Combobox
        value={value || []}
        onValueChange={(value) => handleValueChange(value ?? [])}
        disabled={disabled || readonly}
        open={isOpen}
        onOpenChange={setIsOpen}
        multiSelect
      >
        <Combobox.Button
          className={cn(
            "flex h-full w-full items-center justify-between gap-1 border border-subtle-1 rounded px-2 py-1 text-11 hover:bg-layer-1-hover",
            currentSize.button,
            buttonClassName
          )}
          disabled={disabled || readonly}
        >
          <div className="flex items-center gap-2">
            {selectedLabels.length > 0 ? (
              <SelectedLabelsDisplay selectedLabels={selectedLabels} allLabels={labels} />
            ) : (
              <PlaceholderDisplay placeholder={placeholder} />
            )}
          </div>
        </Combobox.Button>
        <Combobox.Options
          showSearch
          searchPlaceholder={t("common.search.label")}
          emptyMessage=""
          maxHeight="md"
          className={cn(
            "rounded border-[0.5px] border-subtle-1 bg-surface-1 px-2 py-2.5 shadow-raised-200",
            currentSize.dropdown
          )}
          positionerClassName="z-50"
          searchQuery={query}
          onSearchQueryChange={setQuery}
          onSearchQueryKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (filteredOptions.length === 0 && e.key === "Enter" && query.length && !submitting) {
              handleCreateLabel(e);
            }
          }}
          dataPreventOutsideClick
        >
          <div className="vertical-scrollbar scrollbar-sm max-h-48 space-y-1 overflow-y-scroll">
            {submitting ? (
              <div className="flex items-center justify-center py-2">
                <Loader className="h-3.5 w-3.5 animate-spin" />
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Combobox.Option
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "w-full truncate flex items-center justify-between gap-2 rounded cursor-pointer select-none hover:bg-layer-1-hover text-secondary",
                    currentSize.optionPadding
                  )}
                >
                  <span className="flex-grow truncate">{option.content}</span>
                  {value.includes(option.value) && <CheckIcon className={cn(currentSize.icon, "flex-shrink-0")} />}
                </Combobox.Option>
              ))
            ) : canCreateLabel && query ? (
              <button
                onClick={handleCreateLabel}
                className={`text-left text-secondary flex items-center gap-2 px-1 py-1.5 rounded hover:bg-layer-1-hover w-full whitespace-nowrap overflow-auto ${
                  query.length ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <PlusIcon className={cn(currentSize.icon, "flex-shrink-0")} />
                {query.length ? (
                  <>
                    Add <span className="text-primary">&quot;{query}&quot;</span> to labels
                  </>
                ) : (
                  "Create new label"
                )}
              </button>
            ) : (
              <p className="text-left text-secondary px-1 py-1.5">{t("common.search.no_matching_results")}</p>
            )}
          </div>
        </Combobox.Options>
      </Combobox>
    </div>
  );
});

function SelectedLabelsDisplay({
  selectedLabels,
  allLabels,
}: {
  selectedLabels: Array<{ value: string; query: string }>;
  allLabels: Map<string, TInitiativeLabel>;
}) {
  const isSingleSelection = selectedLabels.length === 1;

  if (isSingleSelection) {
    const selectedLabel = allLabels.get(selectedLabels[0].value);
    return (
      <div className="flex items-center gap-1">
        <ColorDot color={selectedLabel?.color} />
        <span className="text-11">{selectedLabels[0].query}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <ColorDot color={allLabels.get(selectedLabels[0].value)?.color} />
      <span className="text-11">{selectedLabels.length} Labels</span>
    </div>
  );
}

function PlaceholderDisplay({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2">
      <LabelPropertyIcon height={14} width={14} />
      {placeholder}
    </div>
  );
}

function ColorDot({ color }: { color?: string }) {
  return <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color || "#000" }} />;
}
