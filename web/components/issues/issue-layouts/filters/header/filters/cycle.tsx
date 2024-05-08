import React, { useMemo, useState } from "react";
import sortBy from "lodash/sortBy";
import { observer } from "mobx-react";
import { TCycleGroups } from "@plane/types";
// components
import { Loader, CycleGroupIcon } from "@plane/ui";
import { FilterHeader, FilterOption } from "@/components/issues";
import { useAppRouter, useCycle } from "@/hooks/store";
// ui
// types

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterCycle: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;

  // hooks
  const { projectId } = useAppRouter();
  const { getCycleById, getProjectCycleIds } = useCycle();

  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const cycleIds = projectId ? getProjectCycleIds(projectId) : undefined;
  const cycles = cycleIds?.map((projectId) => getCycleById(projectId)!) ?? null;
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
        title={`Cycle ${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
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
                    icon={
                      <CycleGroupIcon cycleGroup={cycleStatus(cycle?.status)} className="h-3.5 w-3.5 flex-shrink-0" />
                    }
                    title={cycle.name}
                    activePulse={cycleStatus(cycle?.status) === "current" ? true : false}
                  />
                ))}
                {sortedOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-xs font-medium text-custom-primary-100"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? "View less" : "View all"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs italic text-custom-text-400">No matches found</p>
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
