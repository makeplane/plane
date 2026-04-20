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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader } from "lucide-react";
import { CheckIcon, PlusIcon, LabelPropertyIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import type { TButtonSize } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { Combobox } from "@plane/propel/combobox";
import type { ReleaseLabel } from "@plane/types";
import { cn } from "@plane/utils";
import releaseService from "@/services/release.service";
import { useReleasePermissions } from "@/hooks/permissions/use-release-permissions";

type Props = {
  workspaceSlug: string;
  value: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  buttonClassName?: string;
  className?: string;
  placeholder?: string;
  size?: TButtonSize;
};

export const ReleaseLabelDropdown = observer(function ReleaseLabelDropdown(props: Props) {
  const {
    workspaceSlug,
    value,
    onChange,
    disabled = false,
    buttonClassName = "",
    className = "",
    placeholder = "Label",
    size = "base",
  } = props;

  const { t } = useTranslation();
  const releaseLabelPermissions = useReleasePermissions(workspaceSlug).getLabelPermissions();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: labelsData = [], mutate } = useSWR<ReleaseLabel[]>(
    workspaceSlug ? `RELEASE_LABELS_${workspaceSlug}` : null,
    workspaceSlug ? () => releaseService.listLabels(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const sizeConfig: Record<TButtonSize, { icon: string; dropdown: string; optionPadding: string }> = {
    sm: { icon: "h-3 w-3", dropdown: "w-40 text-11", optionPadding: "px-1 py-1" },
    base: { icon: "h-4 w-4", dropdown: "w-48 text-11", optionPadding: "px-1 py-1.5" },
    lg: { icon: "h-4 w-4", dropdown: "w-56 text-13", optionPadding: "px-2 py-2" },
    xl: { icon: "h-5 w-5", dropdown: "w-64 text-13", optionPadding: "px-2 py-2.5" },
  };
  const currentSize = sizeConfig[size];

  const labelOptions = useMemo(
    () =>
      labelsData.map((label) => ({
        value: label.id,
        query: label.name,
        color: label.color,
        content: (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
            <span className="grow truncate text-left text-11">{label.name}</span>
          </div>
        ),
      })),
    [labelsData]
  );

  const filteredOptions =
    query === "" ? labelOptions : labelOptions.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const selectedLabels = labelOptions.filter((o) => value.includes(o.value));

  const handleValueChange = (newValue: string | string[]) => {
    if (Array.isArray(newValue)) {
      onChange?.(newValue);
    } else {
      onChange?.([newValue]);
    }
  };

  const handleAddLabel = async (labelName: string) => {
    if (!workspaceSlug || !labelName.length) return;
    setSubmitting(true);
    try {
      const newLabel = await releaseService.createLabel(workspaceSlug.toString(), {
        name: labelName.trim(),
        color: `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0")}`,
      });
      await mutate([...labelsData, newLabel], false);
      onChange?.([...value, newLabel.id]);
      setQuery("");
    } catch (error) {
      console.error("Error in creating label:", error);
      setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLabel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (query.length) {
      void handleAddLabel(query);
    }
  };

  return (
    <div className={cn("contain-layout", className)}>
      <Combobox
        value={value || []}
        onValueChange={(v) => handleValueChange(v ?? [])}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
        multiSelect
      >
        <Combobox.Button className="w-full" disabled={disabled}>
          <Button
            variant="secondary"
            size={size}
            className={cn(
              "w-full justify-between bg-layer-transparent hover:bg-layer-transparent-hover",
              buttonClassName
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              {selectedLabels.length > 0 ? (
                <SelectedLabelsDisplay selectedLabels={selectedLabels} />
              ) : (
                <PlaceholderDisplay placeholder={placeholder} />
              )}
            </div>
          </Button>
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
            if (
              filteredOptions.length === 0 &&
              e.key === "Enter" &&
              query.length &&
              !submitting &&
              releaseLabelPermissions.canCreate
            ) {
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
                  <span className="grow truncate">{option.content}</span>
                  {value.includes(option.value) && <CheckIcon className={cn(currentSize.icon, "shrink-0")} />}
                </Combobox.Option>
              ))
            ) : releaseLabelPermissions.canCreate && query ? (
              <button
                onClick={handleCreateLabel}
                className={`text-left text-secondary flex items-center gap-2 px-1 py-1.5 rounded hover:bg-layer-1-hover w-full whitespace-nowrap overflow-auto ${
                  query.length ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <PlusIcon className={cn(currentSize.icon, "shrink-0")} />
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
}: {
  selectedLabels: Array<{ value: string; query: string; color: string }>;
}) {
  if (selectedLabels.length === 1) {
    return (
      <div className="flex items-center gap-1">
        <ColorDot color={selectedLabels[0].color} />
        <span className="text-11">{selectedLabels[0].query}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <ColorDot color={selectedLabels[0].color} />
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
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color ?? "#000" }} />;
}
