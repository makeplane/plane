/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { ModuleOutline } from "@makeplane/propel/icons";
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
import { useModule } from "@/hooks/store/use-module";
// ui

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterModule = observer(function FilterModule(props: Props) {
  const { t } = useTranslation();
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // hooks
  const { projectId } = useParams();
  const { getModuleById, getProjectModuleIds } = useModule();
  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const moduleIds = projectId ? getProjectModuleIds(projectId.toString()) : undefined;
  const modules = moduleIds?.map((moduleId) => getModuleById(moduleId)!) ?? null;
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (modules || []).filter((module) =>
      module.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return sortBy(filteredOptions, [
      (module) => !appliedFilters?.includes(module.id),
      (module) => module.name.toLowerCase(),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleViewToggle = () => {
    if (!sortedOptions) return;

    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  return (
    <>
      <FilterHeader
        title={`Module ${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
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
                    isChecked={appliedFilters?.includes(cycle.id) ? true : false}
                    onClick={() => handleUpdate(cycle.id)}
                    icon={<ModuleOutline className="h-3 w-3 flex-shrink-0" />}
                    title={cycle.name}
                  />
                ))}
                {sortedOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-11 font-medium text-accent-primary"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? "View less" : "View all"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-11 text-placeholder italic">No matches found</p>
            )
          ) : (
            <Skeleton aria-label={t("aria_labels.loading.modules")}>
              <div className="space-y-2">
                <SkeletonItem blockSize="20px" />
                <SkeletonItem blockSize="20px" />
                <SkeletonItem blockSize="20px" />
              </div>
            </Skeleton>
          )}
        </div>
      )}
    </>
  );
});
