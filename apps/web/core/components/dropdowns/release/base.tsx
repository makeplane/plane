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
import { CheckIcon, ChevronDownIcon, ReleaseIcon } from "@plane/propel/icons";
import { Combobox } from "@plane/propel/combobox";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { TReleaseDropdownBaseProps } from "./types";

export const ReleaseDropdownBase = observer(function ReleaseDropdownBase(props: TReleaseDropdownBaseProps) {
  const { releases, value, onChange, disabled = false, className = "", buttonClassName = "", emptyLabel } = props;
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredReleases = useMemo(
    () =>
      query === "" ? releases : releases.filter((release) => release.name.toLowerCase().includes(query.toLowerCase())),
    [query, releases]
  );

  const displayLabel = useMemo(() => {
    if (value.length === 0) return emptyLabel ?? t("releases.no_release");
    if (value.length === 1) {
      return releases.find((release) => release.id === value[0])?.name ?? t("releases.release");
    }
    return t("releases.count_releases", { count: value.length });
  }, [emptyLabel, releases, t, value]);

  return (
    <div className={cn("flex h-full w-full items-center gap-1", className)}>
      <Combobox
        value={value}
        onValueChange={(nextValue) => {
          const ids = Array.isArray(nextValue) ? nextValue : nextValue ? [nextValue] : [];
          onChange(ids);
        }}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
        multiSelect
      >
        <Combobox.Button
          className={cn(
            "group flex h-7.5 w-full items-center gap-1.5 rounded-sm px-2 py-1 text-body-xs-medium hover:bg-layer-1-hover",
            value.length === 0 ? "text-placeholder" : "",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
            buttonClassName
          )}
          disabled={disabled}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDownIcon className="ml-auto h-3.5 w-3.5 shrink-0 hidden group-hover:inline" aria-hidden />
        </Combobox.Button>
        <Combobox.Options
          showSearch
          searchPlaceholder={t("search")}
          emptyMessage=""
          maxHeight="md"
          className="w-56 rounded-sm border-[0.5px] border-subtle-1 bg-surface-1 px-2 py-2.5 shadow-raised-200 text-11"
          positionerClassName="z-50"
          searchQuery={query}
          onSearchQueryChange={setQuery}
          dataPreventOutsideClick
        >
          <div className="vertical-scrollbar scrollbar-sm max-h-48 space-y-1 overflow-y-scroll">
            {filteredReleases.length > 0 ? (
              filteredReleases.map((release) => (
                <Combobox.Option
                  key={release.id}
                  value={release.id}
                  className="w-full flex items-center justify-between gap-2 rounded-sm cursor-pointer select-none hover:bg-layer-1-hover text-secondary px-1 py-1"
                >
                  <div className="flex items-center gap-2 truncate">
                    <ReleaseIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-11">{release.name}</span>
                  </div>
                  {value.includes(release.id) && <CheckIcon className="h-3 w-3 shrink-0" />}
                </Combobox.Option>
              ))
            ) : (
              <p className="px-1.5 py-1 italic text-placeholder">{t("no_matching_results")}</p>
            )}
          </div>
        </Combobox.Options>
      </Combobox>
    </div>
  );
});
