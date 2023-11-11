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

  // Convert to lowercase for string comparison
  const lowercasePriority = priority?.toLowerCase();

  return (
    <>
      {lowercasePriority === "urgent" ? (
        <AlertCircle className={`text-red-500 ${className}`} />
      ) : lowercasePriority === "high" ? (
        <SignalHigh className={`text-orange-500 ${className}`} />
      ) : lowercasePriority === "medium" ? (
        <SignalMedium className={`text-yellow-500 ${className}`} />
      ) : lowercasePriority === "low" ? (
        <SignalLow className={`text-green-500 ${className}`} />
      ) : (
        <Ban className={`text-custom-text-200 ${className}`} />
      )}
    </>
  );
};
