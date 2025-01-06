import { observer } from "mobx-react";
import { TriangleAlert } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
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
};

const WorkloadDetailItem = (props: TWorkloadDetailItemProps) => {
  const { title, icon, value, containerClassName, titleClassName, valueClassName } = props;

  return (
    <div className={cn("flex items-center gap-2 text-sm", containerClassName)}>
      <span className={cn("grow flex gap-2 items-center", titleClassName)}>
        {icon}
        <span>{title}</span>
      </span>
      <span className={cn("flex-shrink-0 flex items-center", valueClassName)}>{value}</span>
    </div>
  );
};

type TTeamWorkloadDetailProps = {
  teamId: string;
};

export const TeamWorkloadDetail: React.FC<TTeamWorkloadDetailProps> = observer((props) => {
  const { teamId } = props;

  return (
    <div className="w-full h-full">
      <h4 className="text-sm text-custom-text-300 font-medium">Summary of team&apos;s issues</h4>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 py-2.5 border-b border-custom-border-100 text-[#FF9500]">
          <TriangleAlert size={16} />
          <span>12 issues are not assigned due date</span>
        </div>
        <div className="flex flex-col gap-2 border-b border-custom-border-100 px-2 pb-2">
          <WorkloadDetailItem title="States on chart" value="Issues" containerClassName="text-custom-text-300" />
          <WorkloadDetailItem
            title="Overdue"
            icon={<span className={cn(ICON_CLASSNAME, "bg-[#FFCCCC]")} />}
            value="12"
            titleClassName={TITLE_CLASSNAME}
            containerClassName={ITEM_CONTAINER_CLASSNAME}
            valueClassName={cn(VALUE_CLASSNAME, "bg-red-500 text-white px-0.5 rounded")}
          />
          <WorkloadDetailItem
            title="Pending"
            icon={<span className={cn(ICON_CLASSNAME, "bg-custom-background-80/80")} />}
            value={
              <>
                <div className={"flex-shrink-0 absolute -top-0.5 -right-0.5 size-1.5 bg-red-500 rounded-full"} />
                120
              </>
            }
            titleClassName={TITLE_CLASSNAME}
            containerClassName={ITEM_CONTAINER_CLASSNAME}
            valueClassName={cn(VALUE_CLASSNAME, "relative bg-custom-background-80/80 px-0.5 rounded")}
          />
          <WorkloadDetailItem
            title="Completed"
            icon={<span className={cn(ICON_CLASSNAME, "bg-[#004EFF]")} />}
            value="140"
            titleClassName={TITLE_CLASSNAME}
            containerClassName={ITEM_CONTAINER_CLASSNAME}
            valueClassName={cn(VALUE_CLASSNAME)}
          />
        </div>
        <div className="flex flex-col gap-2 lg:border-b border-custom-border-100 px-2 pb-2">
          <WorkloadDetailItem title="Other states" containerClassName="text-custom-text-300" />
          <WorkloadDetailItem
            title="Backlog"
            value="14"
            titleClassName={TITLE_CLASSNAME}
            containerClassName={ITEM_CONTAINER_CLASSNAME}
            valueClassName={cn(VALUE_CLASSNAME)}
          />
          <WorkloadDetailItem
            title="Cancelled"
            value="3"
            titleClassName={TITLE_CLASSNAME}
            containerClassName={ITEM_CONTAINER_CLASSNAME}
            valueClassName={cn(VALUE_CLASSNAME)}
          />
        </div>
      </div>
    </div>
  );
});
