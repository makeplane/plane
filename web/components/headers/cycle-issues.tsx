import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
import { ProjectAnalyticsModal } from "components/analytics";
// ui
import { Button } from "@plane/ui";
// icons
import { Plus } from "lucide-react";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";

export const CycleIssuesHeader: React.FC = observer(() => {
  const [analyticsModal, setAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const {
    issueFilter: issueFilterStore,
    cycle: cycleStore,
    cycleIssueFilter: cycleIssueFilterStore,
    project: projectStore,
  } = useMobxStore();

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          layout,
        },
      });
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId || !cycleId) return;

      const newValues = cycleIssueFilterStore.cycleFilters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      } else {
        if (cycleIssueFilterStore.cycleFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      cycleIssueFilterStore.updateCycleFilters(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), {
        [key]: newValues,
      });
    },
    [cycleId, cycleIssueFilterStore, projectId, workspaceSlug]
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          ...updatedDisplayFilter,
        },
      });
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const handleDisplayPropertiesUpdate = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateDisplayProperties(workspaceSlug.toString(), projectId.toString(), property);
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const cycleDetails = cycleId ? cycleStore.getCycleById(cycleId.toString()) : undefined;

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        cycleDetails={cycleDetails ?? undefined}
      />
      <div className="flex items-center gap-2">
        <LayoutSelection
          layouts={["list", "kanban", "calendar", "spreadsheet", "gantt_chart"]}
          onChange={(layout) => handleLayoutChange(layout)}
          selectedLayout={activeLayout}
        />
        <FiltersDropdown title="Filters">
          <FilterSelection
            filters={cycleIssueFilterStore.cycleFilters}
            handleFiltersUpdate={handleFiltersUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
            }
            labels={projectStore.labels?.[projectId?.toString() ?? ""] ?? undefined}
            members={projectStore.members?.[projectId?.toString() ?? ""]?.map((m) => m.member)}
            states={projectStore.states?.[projectId?.toString() ?? ""] ?? undefined}
          />
        </FiltersDropdown>
        <FiltersDropdown title="View">
          <DisplayFiltersSelection
            displayFilters={issueFilterStore.userDisplayFilters}
            displayProperties={issueFilterStore.userDisplayProperties}
            handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
            handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
            layoutDisplayFiltersOptions={
              activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
            }
          />
        </FiltersDropdown>
        <Button onClick={() => setAnalyticsModal(true)} variant="neutral-primary" size="sm">
          Analytics
        </Button>
        <Button
          onClick={() => {
            const e = new KeyboardEvent("keydown", {
              key: "c",
            });
            document.dispatchEvent(e);
          }}
          size="sm"
          prependIcon={<Plus />}
        >
          Add Issue
        </Button>
      </div>
    </>
  );
});
