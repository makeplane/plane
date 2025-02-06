import { observer } from "mobx-react";
import { Loader as Spinner, TriangleAlert } from "lucide-react";
// plane imports
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { useTeamspaces } from "@/plane-web/hooks/store";
import { useTeamspaceAnalytics } from "@/plane-web/hooks/store/teamspaces/use-teamspace-analytics";
// common classNames
const ICON_CLASSNAME = "size-2.5 rounded-full";
const TITLE_CLASSNAME = "font-light text-custom-text-200";
const ITEM_CONTAINER_CLASSNAME = "py-1";
const VALUE_CLASSNAME = "font-semibold text-custom-text-300";

type TWorkloadDetailItemProps = {
  title: string;
  icon?: React.ReactNode;
  value?: React.ReactNode;
  containerClassName?: string;
  titleClassName?: string;
  valueClassName?: string;
  isLoading?: boolean;
};

const WorkloadDetailItem = (props: TWorkloadDetailItemProps) => {
  const { title, icon, value, containerClassName, titleClassName, valueClassName, isLoading } = props;

  return (
    <div className={cn("flex items-center gap-2 text-sm", containerClassName)}>
      <span className={cn("grow flex gap-2 items-center", titleClassName)}>
        {icon}
        <span>{title}</span>
      </span>
      {isLoading ? (
        <Loader className="w-10 h-3.5 flex-shrink-0">
          <Loader.Item width="100%" height="100%" />
        </Loader>
      ) : (
        <span className={cn("flex-shrink-0 flex items-center", valueClassName)}>{value}</span>
      )}
    </div>
  );
};

type TTeamspaceProgressSummaryProps = {
  teamspaceId: string;
};

export const TeamspaceProgressSummary: React.FC<TTeamspaceProgressSummaryProps> = observer((props) => {
  const { teamspaceId } = props;
  // store hooks
  const { getTeamspaceEntitiesLoaderById } = useTeamspaces();
  const { getTeamspaceProgressSummaryLoader, getTeamspaceProgressSummary } = useTeamspaceAnalytics();
  // derived values
  const teamspaceEntitiesLoader = getTeamspaceEntitiesLoaderById(teamspaceId);
  const teamspaceProgressSummaryLoader = getTeamspaceProgressSummaryLoader(teamspaceId);
  const teamspaceProgressSummary = getTeamspaceProgressSummary(teamspaceId);
  const isLoading = teamspaceEntitiesLoader === "init-loader" || teamspaceProgressSummaryLoader === "init-loader";
  const isUpdating = teamspaceProgressSummaryLoader === "mutation";

  return (
    <div className="w-full h-full">
      <div className="flex items-center gap-1.5">
        <h4 className="text-sm text-custom-text-300 font-medium">Summary of teamspace&apos;s work items</h4>
        {isUpdating && <Spinner size={12} className="animate-spin flex-shrink-0" />}
      </div>
      <div className="flex flex-col gap-2.5">
        {teamspaceProgressSummary ? (
          <div className="flex items-center gap-1.5 py-2.5 border-b border-custom-border-100 text-sm font-medium text-[#FF9500]">
            <TriangleAlert size={16} strokeWidth={2} />
            <span>{teamspaceProgressSummary.no_due_date_issues} work items are not assigned due date</span>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 border-b border-custom-border-100 px-2 pb-2">
          <WorkloadDetailItem title="States on chart" value="Work items" containerClassName="text-custom-text-300" />
          <WorkloadDetailItem
            title="Pending"
            icon={<span className={cn(ICON_CLASSNAME, "bg-custom-background-80/80")} />}
            value={
              <>
                <div className={"flex-shrink-0 absolute -top-0.5 -right-0.5 size-1.5 bg-red-500 rounded-full"} />
                {teamspaceProgressSummary?.pending_issues}
              </>
            }
            titleClassName={TITLE_CLASSNAME}
            containerClassName={ITEM_CONTAINER_CLASSNAME}
            valueClassName={cn(VALUE_CLASSNAME, "relative bg-custom-background-80/80 px-0.5 rounded")}
            isLoading={isLoading}
          />
          <WorkloadDetailItem
            title="Completed"
            icon={<span className={cn(ICON_CLASSNAME, "bg-[#004EFF]")} />}
            value={teamspaceProgressSummary?.completed_issues}
            titleClassName={TITLE_CLASSNAME}
            containerClassName={ITEM_CONTAINER_CLASSNAME}
            valueClassName={cn(VALUE_CLASSNAME)}
            isLoading={isLoading}
          />
        </div>
        <div className="flex flex-col gap-2 lg:border-b border-custom-border-100 px-2 pb-2">
          <WorkloadDetailItem title="Other states" containerClassName="text-custom-text-300" />
          <WorkloadDetailItem
            title="Backlog"
            value={teamspaceProgressSummary?.backlog_issues}
            titleClassName={TITLE_CLASSNAME}
            containerClassName={ITEM_CONTAINER_CLASSNAME}
            valueClassName={cn(VALUE_CLASSNAME)}
            isLoading={isLoading}
          />
          <WorkloadDetailItem
            title="Cancelled"
            value={teamspaceProgressSummary?.cancelled_issues}
            titleClassName={TITLE_CLASSNAME}
            containerClassName={ITEM_CONTAINER_CLASSNAME}
            valueClassName={cn(VALUE_CLASSNAME)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
});
