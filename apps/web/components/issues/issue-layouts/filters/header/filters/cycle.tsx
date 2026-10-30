/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import React, { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CycleGroupIcon } from "@plane/blocks/icons";
import type { TCycleGroups } from "@plane/types";
// components
import { Loader } from "@plane/blocks/skeleton";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
import { useCycle } from "@/hooks/store/use-cycle";
// ui
// types

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterCycle = observer(function FilterCycle(props: Props) {
  const { t } = useTranslation();

  const { appliedFilters, handleUpdate, searchQuery } = props;

  // hooks
  const { projectId } = useParams();
  const { getCycleById, getProjectCycleIds } = useCycle();

  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const cycleIds = projectId ? getProjectCycleIds(projectId.toString()) : undefined;
  const cycles = cycleIds?.map((nextProjectId) => getCycleById(nextProjectId)!) ?? null;
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (cycles || []).filter((cycle) =>
      cycle.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return sortBy(filteredOptions, [
      (cycle) => !appliedFilters?.includes(cycle.id),
      (cycle) => cycle.name.toLowerCase(),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleViewToggle = () => {
    if (!sortedOptions) return;

    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  const cycleStatus = (status: TCycleGroups | undefined) =>
    (status ? status.toLocaleLowerCase() : "draft") as TCycleGroups;

  return (
    <>
      <FilterHeader
        title={t("web_ui.dynamic_cycle_value0", { value0: appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : "" })}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions ? (
            sortedOptions.length > 0 ? (
              <>
                {sortedOptions.slice(0, itemsToRender).map((cycle) => (
                  <FilterOption
                    key={cycle.id}
                    isChecked={Boolean(appliedFilters?.includes(cycle.id))}
                    onClick={() => handleUpdate(cycle.id)}
                    icon={
                      <CycleGroupIcon cycleGroup={cycleStatus(cycle?.status)} className="h-3.5 w-3.5 flex-shrink-0" />
                    }
                    title={cycle.name}
                    activePulse={Boolean(cycleStatus(cycle?.status) === "current")}
                  />
                ))}
                {sortedOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-11 font-medium text-accent-primary"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? t("web_ui.view_less") : t("web_ui.view_all")}
                  </button>
                )}
              </>
            ) : (
              <p className="text-11 text-placeholder italic">{t("common.search.no_matches_found")}</p>
            )
          ) : (
            <Loader className="space-y-2">
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
            </Loader>
          )}
        </div>
      )}
    </>
  );
});
