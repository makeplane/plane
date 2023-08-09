// next imports
import Link from "next/link";
import { useRouter } from "next/router";
// components
import { GanttChartRoot } from "components/gantt-chart";
// ui
import { Icon, Tooltip } from "components/ui";
// hooks
import useGanttChartIssues from "hooks/gantt-chart/issue-view";
import issuesService from "services/issues.service";
import useUser from "hooks/use-user";

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
          style={{ backgroundColor: data?.state_detail?.color || "rgb(var(--color-primary-100))" }}
        />
        <Tooltip tooltipContent={data?.name} className={`z-[999999]`}>
          <div className="text-custom-text-100 text-[15px] whitespace-nowrap py-1 px-2.5 overflow-hidden w-full">
            {data?.name}
          </div>
        </Tooltip>
        {data.infoToggle && (
          <Tooltip tooltipContent="No due-date set, rendered according to last updated date.">
            <div className="flex-shrink-0 mx-2 w-[18px] h-[18px] overflow-hidden flex justify-center items-center text-custom-text-200">
              <Icon iconName="info" />
            </div>
          </Tooltip>
        )}
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

    console.log("payload", payload);

    await issuesService
      .patchIssue(workspaceSlug.toString(), projectId.toString(), block.id, payload, user)
      .then(() => mutateGanttIssues());
  };

  const blockFormat = (blocks: any) =>
    blocks && blocks.length > 0
      ? blocks
          .filter((b: any) => b.start_date && b.target_date)
          .map((block: any) => {
            const startDate = new Date(block.start_date);
            const targetDate = new Date(block.target_date);

            return {
              start_date: new Date(startDate),
              target_date: new Date(targetDate),
              infoToggle: true,
              data: block,
            };
          })
      : [];

  return (
    <div className="w-full h-full">
      <GanttChartRoot
        border={false}
        title="Issues"
        loaderTitle="Issues"
        blocks={ganttIssues ? blockFormat(ganttIssues) : null}
        blockUpdateHandler={handleUpdateDates}
        sidebarBlockRender={(data: any) => <GanttSidebarBlockView data={data} />}
        blockRender={(data: any) => <GanttBlockView data={data} />}
      />
    </div>
  );
};
