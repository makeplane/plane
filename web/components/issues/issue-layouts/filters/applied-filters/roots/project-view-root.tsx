import { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { AppliedFiltersList } from "components/issues";
// ui
import { PrimaryButton } from "components/ui";
// helpers
import { areFiltersDifferent } from "helpers/filter.helper";
// types
import { IIssueFilterOptions } from "types";

export const ProjectViewAppliedFiltersRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const {
    project: projectStore,
    projectViews: projectViewsStore,
    projectViewFilters: projectViewFiltersStore,
  } = useMobxStore();

  const viewDetails = viewId ? projectViewsStore.viewDetails[viewId.toString()] : undefined;
  const storedFilters = viewId ? projectViewFiltersStore.storedFilters[viewId.toString()] : undefined;

  // filters whose value not null or empty array
  const appliedFilters: IIssueFilterOptions = {};
  Object.entries(storedFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;

    if (Array.isArray(value) && value.length === 0) return;

    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!viewId) return;

    // remove all values of the key if value is null
    if (!value) {
      projectViewFiltersStore.updateStoredFilters(viewId.toString(), {
        [key]: null,
      });
      return;
    }

    // remove the passed value from the key
    let newValues = storedFilters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    projectViewFiltersStore.updateStoredFilters(viewId.toString(), {
      [key]: newValues,
    });
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId || !viewId) return;

    const newFilters: IIssueFilterOptions = {};
    Object.keys(storedFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = null;
    });

    projectViewFiltersStore.updateStoredFilters(viewId.toString(), {
      ...newFilters,
    });
  };

  const handleUpdateView = () => {
    if (!workspaceSlug || !projectId || !viewId || !viewDetails) return;

    projectViewsStore.updateView(workspaceSlug.toString(), projectId.toString(), viewId.toString(), {
      query_data: {
        ...viewDetails.query_data,
        ...(storedFilters ?? {}),
      },
    });
  };

  // update stored filters when view details are fetched
  useEffect(() => {
    if (!viewId || !viewDetails) return;

    if (!projectViewFiltersStore.storedFilters[viewId.toString()])
      projectViewFiltersStore.updateStoredFilters(viewId.toString(), viewDetails?.query_data ?? {});
  }, [projectViewFiltersStore, viewDetails, viewId]);

  // return if no filters are applied
  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <AppliedFiltersList
        appliedFilters={appliedFilters}
        handleClearAllFilters={handleClearAllFilters}
        handleRemoveFilter={handleRemoveFilter}
        labels={projectStore.labels?.[projectId?.toString() ?? ""] ?? []}
        members={projectStore.members?.[projectId?.toString() ?? ""]?.map((m) => m.member)}
        states={projectStore.states?.[projectId?.toString() ?? ""]}
      />
      {storedFilters && viewDetails && areFiltersDifferent(storedFilters, viewDetails.query_data ?? {}) && (
        <PrimaryButton className="whitespace-nowrap" onClick={handleUpdateView}>
          Update view
        </PrimaryButton>
      )}
    </div>
  );
});
