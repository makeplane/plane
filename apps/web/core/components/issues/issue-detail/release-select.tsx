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
import { CheckIcon, ChevronDownIcon, ReleaseIcon } from "@plane/propel/icons";
import { Combobox } from "@plane/propel/combobox";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import type { Release } from "@plane/types";
import { cn } from "@plane/utils";
import { RELEASES } from "@/constants/fetch-keys";
import releaseService from "@/services/release.service";
import type { TIssueOperations } from "./root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  releaseIds?: string[];
  disabled?: boolean;
  className?: string;
};

export const ReleaseSelect = observer(function ReleaseSelect(props: Props) {
  const {
    workspaceSlug,
    projectId,
    issueId,
    issueOperations,
    releaseIds: releaseIdsProp,
    disabled = false,
    className = "",
  } = props;
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: releases = [] } = useSWR<Release[]>(
    workspaceSlug ? RELEASES(workspaceSlug) : null,
    workspaceSlug ? () => releaseService.list(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const derivedFromReleases = releases.filter((r) => r.work_item_ids?.includes(issueId)).map((r) => r.id);
  const effectiveReleaseIds = releaseIdsProp ?? derivedFromReleases;

  const filteredReleases =
    query === "" ? releases : releases.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  const handleChange = async (newIds: string | string[]) => {
    const ids = Array.isArray(newIds) ? newIds : [newIds];
    try {
      await issueOperations.update(workspaceSlug, projectId, issueId, { release_ids: ids });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
    }
  };

  const displayLabel =
    effectiveReleaseIds.length === 0
      ? t("releases.no_release")
      : effectiveReleaseIds.length === 1
        ? (releases.find((r) => r.id === effectiveReleaseIds[0])?.name ?? t("releases.release"))
        : t("releases.count_releases", { count: effectiveReleaseIds.length });

  return (
    <div className={cn("flex h-full w-full items-center gap-1", className)}>
      <Combobox
        value={effectiveReleaseIds}
        onValueChange={(v) => handleChange(v ?? [])}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
        multiSelect
      >
        <Combobox.Button
          className={cn(
            "group flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-body-xs-medium h-7.5 hover:bg-layer-1-hover",
            effectiveReleaseIds.length === 0 ? "text-placeholder" : "",
            disabled ? "cursor-not-allowed" : "cursor-pointer"
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
                  {effectiveReleaseIds.includes(release.id) && <CheckIcon className="h-3 w-3 shrink-0" />}
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
