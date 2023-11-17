import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useProjectDetails from "hooks/use-project-details";
// components
import { IssueGanttBlock } from "components/issues";
import {
  GanttChartRoot,
  IBlockUpdateData,
  renderIssueBlocksStructure,
  ProjectViewGanttSidebar,
} from "components/gantt-chart";
// types
import { IIssueUnGroupedStructure } from "store/issue";
import { IIssue } from "types";

export const ProjectViewGanttLayout: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, viewId } = router.query;

  const { projectDetails } = useProjectDetails();

  const { projectViewIssues: projectViewIssuesStore, issueFilter: issueFilterStore } = useMobxStore();

  const appliedDisplayFilters = issueFilterStore.userDisplayFilters;

  const issues = projectViewIssuesStore.getIssues;

  const updateIssue = (block: any, payload: IBlockUpdateData) => {
    if (!workspaceSlug || !viewId) return;

    projectViewIssuesStore.updateGanttIssueStructure(workspaceSlug.toString(), viewId.toString(), block, payload);
  };

  const isAllowed = projectDetails?.member_role === 20 || projectDetails?.member_role === 15;

  return (
    <>
      <div className="w-full h-full">
        <GanttChartRoot
          border={false}
          title="Issues"
          loaderTitle="Issues"
          blocks={issues ? renderIssueBlocksStructure(issues as IIssueUnGroupedStructure) : null}
          blockUpdateHandler={updateIssue}
          blockToRender={(data: IIssue) => <IssueGanttBlock data={data} handleIssue={updateIssue} />}
          sidebarToRender={(props) => <ProjectViewGanttSidebar {...props} />}
          enableBlockLeftResize={isAllowed}
          enableBlockRightResize={isAllowed}
          enableBlockMove={isAllowed}
          enableReorder={appliedDisplayFilters.order_by === "sort_order" && isAllowed}
        />
      </div>
    </>
  );
});
