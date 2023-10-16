import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useProjectDetails from "hooks/use-project-details";
// components
import { GanttChartRoot, renderIssueBlocksStructure } from "components/gantt-chart";
import { IssueGanttBlock, IssueGanttSidebarBlock, IssuePeekOverview } from "components/issues";
// types
import { IIssueUnGroupedStructure } from "store/issue";

export const ProjectViewGanttLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { projectDetails } = useProjectDetails();

  const { projectViewIssues: projectViewIssuesStore, issueFilter: issueFilterStore } = useMobxStore();

  const appliedDisplayFilters = issueFilterStore.userDisplayFilters;

  const issues = projectViewIssuesStore.getIssues;

  const isAllowed = projectDetails?.member_role === 20 || projectDetails?.member_role === 15;

  return (
    <>
      <IssuePeekOverview
        projectId={projectId?.toString() ?? ""}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        readOnly={!isAllowed}
      />
      <div className="w-full h-full">
        <GanttChartRoot
          border={false}
          title="Issues"
          loaderTitle="Issues"
          blocks={issues ? renderIssueBlocksStructure(issues as IIssueUnGroupedStructure) : null}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          blockUpdateHandler={(block, payload) => {
            // TODO: update mutation logic
            // updateGanttIssue(block, payload, mutateGanttIssues, user, workspaceSlug?.toString())
          }}
          BlockRender={IssueGanttBlock}
          SidebarBlockRender={IssueGanttSidebarBlock}
          enableBlockLeftResize={isAllowed}
          enableBlockRightResize={isAllowed}
          enableBlockMove={isAllowed}
          enableReorder={appliedDisplayFilters.order_by === "sort_order" && isAllowed}
        />
      </div>
    </>
  );
});
