import * as React from "react";

// icons
import {
  AlertCircle,
  Ban,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from "lucide-react";

// types
import { IPriorityIcon } from "./type";

export const PriorityIcon: React.FC<IPriorityIcon> = ({
  priority,
  className = "",
}) => {
  if (!className || className === "") className = "h-3.5 w-3.5";

  return (
    <>
      {priority === "urgent" ? (
        <AlertCircle className={`${className}`} />
      ) : priority === "high" ? (
        <SignalHigh className={`${className}`} />
      ) : priority === "medium" ? (
        <SignalMedium className={`${className}`} />
      ) : priority === "low" ? (
        <SignalLow className={`${className}`} />
      ) : (
        <Ban className={`${className}`} />
      )}
    </>
  );
};
