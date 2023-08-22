import { useRouter } from "next/router";
import Link from "next/link";

// hooks
import useIssuesView from "hooks/use-issues-view";
import useUser from "hooks/use-user";
import useGanttChartIssues from "hooks/gantt-chart/issue-view";
import { updateGanttIssue } from "components/gantt-chart/hooks/block-update";
// components
import {
  GanttChartRoot,
  IssueGanttBlock,
  renderIssueBlocksStructure,
} from "components/gantt-chart";
// icons
import { getStateGroupIcon } from "components/icons";
// helpers
import { findTotalDaysInRange } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

export const IssueGanttChartView = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { orderBy } = useIssuesView();

  const { user } = useUser();

  const { ganttIssues, mutateGanttIssues } = useGanttChartIssues(
    workspaceSlug as string,
    projectId as string
  );

  // rendering issues on gantt sidebar
  const GanttSidebarBlockView = ({ issue }: { issue: IIssue }) => {
    const duration = findTotalDaysInRange(issue?.start_date ?? "", issue?.target_date ?? "", true);

    return (
      <Link href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}>
        <a className="relative w-full flex items-center gap-2 h-full">
          {getStateGroupIcon(issue?.state_detail?.group, "14", "14", issue?.state_detail?.color)}
          <div className="text-xs text-custom-text-300 flex-shrink-0">
            {issue?.project_detail?.identifier} {issue?.sequence_id}
          </div>
          <div className="flex items-center justify-between gap-2 w-full flex-grow truncate">
            <h6 className="text-sm font-medium flex-grow truncate">{issue?.name}</h6>
            <span className="flex-shrink-0 text-sm text-custom-text-200">
              {duration} day{duration > 1 ? "s" : ""}
            </span>
          </div>
        </a>
      </Link>
    );
  };

  return (
    <div className="w-full h-full">
      <GanttChartRoot
        border={false}
        title="Issues"
        loaderTitle="Issues"
        blocks={ganttIssues ? renderIssueBlocksStructure(ganttIssues as IIssue[]) : null}
        blockUpdateHandler={(block, payload) =>
          updateGanttIssue(block, payload, mutateGanttIssues, user, workspaceSlug?.toString())
        }
        blockRender={(data: any) => <IssueGanttBlock issue={data as IIssue} />}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView issue={data as IIssue} />}
        enableReorder={orderBy === "sort_order"}
      />
    </div>
  );
};
