import { useRouter } from "next/router";

// hooks
import useGanttChartViewIssues from "hooks/gantt-chart/view-issues-view";
import useUser from "hooks/use-user";
import { updateGanttIssue } from "components/gantt-chart/hooks/block-update";
import useProjectDetails from "hooks/use-project-details";
// components
import { GanttChartRoot, renderIssueBlocksStructure } from "components/gantt-chart";
import { IssueGanttBlock, IssueGanttSidebarBlock, IssuePeekOverview } from "components/issues";
// types
import { IIssue } from "types";

type Props = { disableUserActions: boolean };

export const ViewIssuesGanttChartView: React.FC<Props> = ({ disableUserActions }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const { user } = useUser();
  const { projectDetails } = useProjectDetails();

  const { ganttIssues, mutateGanttIssues } = useGanttChartViewIssues(
    workspaceSlug as string,
    projectId as string,
    viewId as string
  );

  const isAllowed = projectDetails?.member_role === 20 || projectDetails?.member_role === 15;

  return (
    <>
      <IssuePeekOverview
        handleMutation={() => mutateGanttIssues()}
        projectId={projectId?.toString() ?? ""}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        readOnly={disableUserActions}
      />
      <div className="w-full h-full">
        <GanttChartRoot
          border={false}
          title="Issues"
          loaderTitle="Issues"
          blocks={ganttIssues ? renderIssueBlocksStructure(ganttIssues as IIssue[]) : null}
          blockUpdateHandler={(block, payload) =>
            updateGanttIssue(block, payload, mutateGanttIssues, user, workspaceSlug?.toString())
          }
          SidebarBlockRender={IssueGanttSidebarBlock}
          BlockRender={IssueGanttBlock}
          enableBlockLeftResize={isAllowed}
          enableBlockRightResize={isAllowed}
          enableBlockMove={isAllowed}
          enableReorder={isAllowed}
        />
      </div>
    </>
  );
};
