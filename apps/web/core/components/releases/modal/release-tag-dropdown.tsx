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

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader } from "lucide-react";
import { Button } from "@plane/propel/button";
import type { TButtonSize } from "@plane/propel/button";
import { CheckIcon, PlusIcon, TagIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { Combobox } from "@plane/propel/combobox";
import type { ReleaseTag } from "@plane/types";
import { cn } from "@plane/utils";
import releaseService from "@/services/release.service";
import { useReleasePermissions } from "@/hooks/permissions/use-release-permissions";

type Props = {
  workspaceSlug: string;
  value: string | null;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  buttonClassName?: string;
  className?: string;
  placeholder?: string;
  size?: TButtonSize;
};

export const ReleaseTagDropdown = observer(function ReleaseTagDropdown(props: Props) {
  const {
    workspaceSlug,
    value,
    onChange,
    disabled = false,
    buttonClassName = "",
    className = "",
    placeholder = "Tag",
    size = "base",
  } = props;

  const { t } = useTranslation();
  const releaseTagPermissions = useReleasePermissions(workspaceSlug).getTagPermissions();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: tags = [], mutate } = useSWR<ReleaseTag[]>(
    workspaceSlug ? `RELEASE_TAGS_${workspaceSlug}` : null,
    workspaceSlug ? () => releaseService.listTags(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const sizeConfig: Record<TButtonSize, { icon: string; dropdown: string; optionPadding: string }> = {
    sm: { icon: "h-3 w-3", dropdown: "w-40 text-11", optionPadding: "px-1 py-1" },
    base: { icon: "h-4 w-4", dropdown: "w-48 text-11", optionPadding: "px-1 py-1.5" },
    lg: { icon: "h-4 w-4", dropdown: "w-56 text-13", optionPadding: "px-2 py-2" },
    xl: { icon: "h-5 w-5", dropdown: "w-64 text-13", optionPadding: "px-2 py-2.5" },
  };
  const currentSize = sizeConfig[size];

  const tagOptions = tags.map((tag) => ({
    value: tag.id,
    query: tag.version,
    content: (
      <div className="flex items-center gap-2">
        <TagIcon className="h-3 w-3 shrink-0" />
        <span className="grow truncate text-left text-11">{tag.version}</span>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? tagOptions : tagOptions.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const selectedTag = tags.find((t) => t.id === value);

  const handleValueChange = (newValue: string | string[]) => {
    if (typeof newValue !== "string") return;
    // toggle off if same tag selected
    onChange?.(newValue === value ? null : newValue);
  };

  const handleAddTag = async (version: string) => {
    if (!workspaceSlug || !version.length) return;
    setSubmitting(true);
    try {
      const newTag = await releaseService.createTag(workspaceSlug.toString(), { version: version.trim() });
      await mutate([...tags, newTag], false);
      onChange?.(newTag.id);
      setQuery("");
    } catch (error) {
      console.error("Error in creating tag:", error);
      setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTag = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (query.length) {
      void handleAddTag(query);
    }
  };

  return (
    <div className={cn("contain-layout", className)}>
      <Combobox
        value={value ?? ""}
        onValueChange={(v) => handleValueChange(v ?? "")}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
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
              {selectedTag ? (
                <SelectedTagDisplay tag={selectedTag} />
              ) : (
                <PlaceholderDisplay placeholder={placeholder} />
              )}
            </div>
          </Button>
        </Combobox.Button>
        <Combobox.Options
          showSearch
          searchPlaceholder={t("common.search.placeholder")}
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
              releaseTagPermissions.canCreate
            ) {
              handleCreateTag(e);
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
                  {option.value === value && <CheckIcon className={cn(currentSize.icon, "shrink-0")} />}
                </Combobox.Option>
              ))
            ) : releaseTagPermissions.canCreate && query ? (
              <button
                onClick={handleCreateTag}
                className={`text-left text-secondary flex items-center gap-2 px-1 py-1.5 rounded hover:bg-layer-1-hover w-full whitespace-nowrap overflow-auto ${
                  query.length ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <PlusIcon className={cn(currentSize.icon, "shrink-0")} />
                {query.length ? (
                  <>
                    Add <span className="text-primary">&quot;{query}&quot;</span> as tag
                  </>
                ) : (
                  "Create new tag"
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

function SelectedTagDisplay({ tag }: { tag: ReleaseTag }) {
  return (
    <div className="flex items-center gap-1">
      <TagIcon className="h-3 w-3 shrink-0 text-secondary" />
      <span className="text-11">{tag.version}</span>
    </div>
  );
}

function PlaceholderDisplay({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2">
      <TagIcon className="h-3.5 w-3.5 text-placeholder" />
      {placeholder}
    </div>
  );
}
