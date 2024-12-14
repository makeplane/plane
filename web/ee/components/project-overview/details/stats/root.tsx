import useSWR from "swr";
import { cn } from "@plane/editor";
import { Loader } from "@plane/ui";
import projectService from "@/plane-web/services/project/project.service";
import { TProject } from "@/plane-web/types";
import { NoStats } from "./no-data";

type TStatBlockProp = {
  title: string;
  stat: number;
  color: string;
  percentage: number;
};
type TStatsTodayProps = {
  workspaceSlug: string;
  project: TProject;
};

const StatBlock = (props: TStatBlockProp) => {
  const { title, stat, color, percentage } = props;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex">
        <div className={`${color} w-[10px] h-[10px] flex mr-2 my-auto rounded-sm`} />
        <div className="font-medium text-sm">{title}</div>
      </div>
      <div className="flex gap-3">
        <div className="text-md font-bold">{stat}</div>
        <div className="text-sm font-medium text-custom-text-350 my-auto">{percentage}%</div>
      </div>
    </div>
  );
};

export const StatsToday = (props: TStatsTodayProps) => {
  const { workspaceSlug, project } = props;

  const { data: analytics, isLoading } = useSWR(
    project && workspaceSlug ? `PROJECT_ANALYTICS_${project?.id}` : null,
    project && workspaceSlug ? () => projectService.fetchProjectAnalytics(workspaceSlug, project?.id) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const stats = [
    {
      title: "Overdue",
      stat: analytics?.overdue_issues,
      color: "#FF3333",
    },
    {
      title: "Backlog",
      stat: analytics?.backlog_issues,
      color: "#EBEDF2",
    },
    {
      title: "Unstarted",
      stat: analytics?.unstarted_issues,
      color: "#6E6E6E",
    },
    {
      title: "Started",
      stat: analytics?.started_issues,
      color: "#FF9500",
    },
    {
      title: "Completed",
      stat: analytics?.completed_issues,
      color: "#26D950",
    },
  ];

  return isLoading ? (
    <Loader className="flex flex-col gap-4 py-4">
      <Loader.Item height="125px" width="100%" />
    </Loader>
  ) : (
    <>
      {(!analytics || project.total_issues === 0) && <NoStats workspaceSlug={workspaceSlug} projectId={project?.id} />}
      {analytics && project.total_issues > 0 && (
        <div className="text-custom-text-300 mt-4 mx-2">
          {/* Progress bar */}
          <div className="flex w-full h-[14px] rounded gap-[2px]">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className={cn(`h-full rounded`)}
                style={{
                  width: `${stat.stat ? Math.round(stat.stat / project.total_issues) * 100 : 0}%`,
                  backgroundColor: `${stat.color}`,
                  opacity: 0.4,
                }}
              />
            ))}
          </div>

          {/* Numbers */}
          <div className="flex mt-6 w-[90%] justify-between px-4">
            <StatBlock
              title="Overdue"
              stat={analytics?.overdue_issues}
              color={"bg-[#FF3333]"}
              percentage={Math.round(analytics?.overdue_issues / project.total_issues) * 100 || 0}
            />

            <div className="relative border-l-2 pl-10 flex  ">
              <div className="absolute -left-2 top-[18px] font-medium text-custom-text-350 rotate-[270deg] text-[10px] tracking-widest">
                STATUS
              </div>
              <StatBlock
                title="Backlog"
                stat={analytics?.backlog_issues}
                color={"bg-[#EBEDF2]"}
                percentage={Math.round(analytics?.backlog_issues / project.total_issues) * 100 || 0}
              />
            </div>
            <StatBlock
              title="Unstarted"
              stat={analytics?.unstarted_issues}
              color={"bg-[#6E6E6E]"}
              percentage={Math.round(analytics?.unstarted_issues / project.total_issues) * 100 || 0}
            />
            <StatBlock
              title="Started"
              stat={analytics?.started_issues}
              color={"bg-[#FF9500]"}
              percentage={Math.round(analytics?.started_issues / project.total_issues) * 100 || 0}
            />
            <StatBlock
              title="Completed"
              stat={analytics?.completed_issues}
              color={"bg-[#26D950]"}
              percentage={Math.round(analytics?.completed_issues / project.total_issues) * 100 || 0}
            />
          </div>
        </div>
      )}
    </>
  );
};
