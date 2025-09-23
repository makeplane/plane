import { PriorityIcon } from "@plane/propel/icons";
import { cn } from "@plane/propel/utils";
import { TIssuePriorities } from "@plane/types";

export const DisplayPriority = (props: { priority: TIssuePriorities; className?: string }) => {
  const { priority, className } = props;
  return (
    <div className={cn("flex items-center gap-1 text-sm text-custom-text-300", className)}>
      <PriorityIcon priority={priority as TIssuePriorities} containerClassName={`size-4`} withContainer />
      <div className="capitalize truncate">{priority}</div>
    </div>
  );
};
