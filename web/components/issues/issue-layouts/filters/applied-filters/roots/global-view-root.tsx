import { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { AppliedFiltersList } from "components/issues";
// ui
import { Button } from "@plane/ui";
// helpers
import { areFiltersDifferent } from "helpers/filter.helper";
// types
import { IIssueFilterOptions } from "types";

export const GlobalViewsAppliedFiltersRoot = observer(() => {
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const {
    globalViews: globalViewsStore,
    globalViewFilters: globalViewFiltersStore,
    project: projectStore,
    workspace: workspaceStore,
  } = useMobxStore();

  const viewDetails = globalViewId ? globalViewsStore.globalViewDetails[globalViewId.toString()] : undefined;
  const storedFilters = globalViewId ? globalViewFiltersStore.storedFilters[globalViewId.toString()] : undefined;

  // filters whose value not null or empty array
  const appliedFilters: IIssueFilterOptions = {};
  Object.entries(storedFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;

    if (Array.isArray(value) && value.length === 0) return;

    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!globalViewId) return;

    // remove all values of the key if value is null
    if (!value) {
      globalViewFiltersStore.updateStoredFilters(globalViewId.toString(), {
        [key]: null,
      });
      return;
    }

    // remove the passed value from the key
    let newValues = globalViewFiltersStore.storedFilters?.[globalViewId.toString()]?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    globalViewFiltersStore.updateStoredFilters(globalViewId.toString(), {
      [key]: newValues,
    });
  };

  const handleClearAllFilters = () => {
    if (!globalViewId || !storedFilters) return;

    const newFilters: IIssueFilterOptions = {};
    Object.keys(storedFilters).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = null;
    });

    globalViewFiltersStore.updateStoredFilters(globalViewId.toString(), {
      ...newFilters,
    });
  };

  const handleUpdateView = () => {
    if (!workspaceSlug || !globalViewId || !viewDetails) return;

    globalViewsStore.updateGlobalView(workspaceSlug.toString(), globalViewId.toString(), {
      query_data: {
        ...viewDetails.query_data,
        filters: {
          ...(storedFilters ?? {}),
        },
      },
    });
  };

  // update stored filters when view details are fetched
  useEffect(() => {
    if (!globalViewId || !viewDetails) return;

    if (!globalViewFiltersStore.storedFilters[globalViewId.toString()])
      globalViewFiltersStore.updateStoredFilters(globalViewId.toString(), viewDetails?.query_data?.filters ?? {});
  }, [globalViewId, globalViewFiltersStore, viewDetails]);

  // return if no filters are applied
  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <AppliedFiltersList
        appliedFilters={storedFilters ?? {}}
        handleClearAllFilters={handleClearAllFilters}
        handleRemoveFilter={handleRemoveFilter}
        labels={workspaceStore.workspaceLabels ?? undefined}
        members={workspaceStore.workspaceMembers?.map((m) => m.member)}
        projects={workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined}
      />
      {storedFilters && viewDetails && areFiltersDifferent(storedFilters, viewDetails.query_data.filters ?? {}) && (
        <Button variant="primary" onClick={handleUpdateView}>
          Update view
        </Button>
      )}
    </div>
  );
});
