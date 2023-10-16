// types
import { AlertCircle, Ban, SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import { TIssuePriorities } from "types";

type Props = {
  priority: TIssuePriorities | null;
  className?: string;
};

export const PriorityIcon: React.FC<Props> = ({ priority, className = "" }) => {
  if (!className || className === "") className = "text-xs flex items-center";

  return (
    <>
      {priority === "urgent" ? (
        <AlertCircle className={`h-3.5 w-3.5 ${className}`} />
      ) : priority === "high" ? (
        <SignalHigh className={`h-3.5 w-3.5 ${className}`} />
      ) : priority === "medium" ? (
        <SignalMedium className={`h-3.5 w-3.5 ${className}`} />
      ) : priority === "low" ? (
        <SignalLow className={`h-3.5 w-3.5 ${className}`} />
      ) : (
        <Ban className={`h-3.5 w-3.5 ${className}`} />
      )}
    </>
  );
};
