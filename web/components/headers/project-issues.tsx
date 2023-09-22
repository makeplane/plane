import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { LayoutSelection } from "components/issue-layouts/layout-selection";
// types
import { TIssueLayouts } from "types";
import { IssueDropdown } from "components/issue-layouts/helpers/dropdown";
import { FilterSelection } from "components/issue-layouts/filters";
import { DisplayFiltersSelection } from "components/issue-layouts/display-filters";

export const ProjectIssuesHeader = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter } = useMobxStore();
  const { updateUserFilters } = issueFilter;

  const handleLayoutChange = (layout: TIssueLayouts) => {
    if (!workspaceSlug || !projectId) return;

    updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
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
        selectedLayout={issueFilter.userDisplayFilters.layout ?? "list"}
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
