import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FilterSelection, IssueDropdown, LayoutSelection } from "components/issue-layouts";
// types
import { TIssueLayouts } from "types";

export const ProjectIssuesHeader = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter: issueFilterStore } = useMobxStore();

  const handleLayoutChange = (layout: TIssueLayouts) => {
    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        layout,
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      <LayoutSelection
        layouts={["calendar", "gantt_chart", "kanban", "list", "spreadsheet"]}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={issueFilterStore.userDisplayFilters.layout ?? "list"}
      />
      <IssueDropdown title="Filters">
        <FilterSelection />
      </IssueDropdown>
      <IssueDropdown title="View">
        <DisplayFiltersSelection />
      </IssueDropdown>
    </div>
  );
});
