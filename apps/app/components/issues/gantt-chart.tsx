import Link from "next/link";
import { useRouter } from "next/router";

// services
import issuesService from "services/issues.service";
// hooks
import useUser from "hooks/use-user";
import useGanttChartIssues from "hooks/gantt-chart/issue-view";
// components
import { GanttChartRoot } from "components/gantt-chart";
// ui
import { Tooltip } from "components/ui";
// types
import { IIssue } from "types";

export const IssueGanttChartView = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUser();

  const { ganttIssues, mutateGanttIssues } = useGanttChartIssues(
    workspaceSlug as string,
    projectId as string
  );

  // rendering issues on gantt sidebar
  const GanttSidebarBlockView = ({ data }: any) => (
    <div className="relative flex w-full h-full items-center p-1 overflow-hidden gap-1">
      <div
        className="rounded-sm flex-shrink-0 w-[10px] h-[10px] flex justify-center items-center"
        style={{ backgroundColor: data?.state_detail?.color || "#rgb(var(--color-primary-100))" }}
      />
      <div className="text-custom-text-100 text-sm">{data?.name}</div>
    </div>
  );

  // rendering issues on gantt card
  const GanttBlockView = ({ data }: any) => (
    <Link href={`/${workspaceSlug}/projects/${data?.project}/issues/${data?.id}`}>
      <a className="relative flex items-center w-full h-full overflow-hidden shadow-sm font-normal transition-all duration-300">
        <div
          className="flex-shrink-0 w-1 h-full"
          style={{ backgroundColor: data?.state_detail?.color }}
        />
        <Tooltip tooltipContent={data?.name}>
          <div className="text-custom-text-100 text-[15px] whitespace-nowrap py-1 px-2.5 overflow-hidden w-full">
            {data?.name}
          </div>
        </Tooltip>
      </a>
    </Link>
  );

  // handle gantt issue start date and target date
  const handleUpdateDates = async (
    block: any,
    payload: {
      start_date?: string;
      target_date?: string;
    }
  ) => {
    if (!workspaceSlug || !projectId || !user) return;

    await issuesService
      .patchIssue(workspaceSlug.toString(), projectId.toString(), block.id, payload, user)
      .then(() => mutateGanttIssues());
  };

  const blockFormat = (blocks: IIssue[]) =>
    blocks && blocks.length > 0
      ? blocks
          .filter((b) => b.start_date && b.target_date)
          .map((block) => {
            const startDate = new Date(block.start_date ?? "");
            const targetDate = new Date(block.target_date ?? "");

            return {
              data: block,
              sort_order: block.sort_order,
              start_date: new Date(startDate),
              target_date: new Date(targetDate),
            };
          })
      : [];

  return (
    <div className="w-full h-full">
      <GanttChartRoot
        border={false}
        title="Issues"
        loaderTitle="Issues"
        blocks={ganttIssues ? blockFormat(ganttIssues as IIssue[]) : null}
        blockUpdateHandler={handleUpdateDates}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <GanttBlockView data={data} />}
      />
    </div>
  );
};
