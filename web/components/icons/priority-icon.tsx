// types
import { TIssuePriorities } from "@plane/types";

type Props = {
  priority: TIssuePriorities | null;
  className?: string;
};

export const PriorityIcon: React.FC<Props> = ({ priority, className = "" }) => {
  if (!className || className === "") className = "text-xs flex items-center";

  return (
    <span className={`material-symbols-rounded ${className}`}>
      {priority === "urgent"
        ? "error"
        : priority === "high"
        ? "signal_cellular_alt"
        : priority === "medium"
        ? "signal_cellular_alt_2_bar"
        : priority === "low"
        ? "signal_cellular_alt_1_bar"
        : "block"}
    </span>
  );
};
