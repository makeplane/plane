import * as React from "react";

// icons
import { AlertCircle, Ban, SignalHigh, SignalLow, SignalMedium } from "lucide-react";

// types
import { IPriorityIcon } from "./type";

export const PriorityIcon: React.FC<IPriorityIcon> = ({ priority, className = "", transparentBg = false }) => {
  if (!className || className === "") className = "h-4 w-4";

  // Convert to lowercase for string comparison
  const lowercasePriority = priority?.toLowerCase();

  //get priority icon
  const getPriorityIcon = (): React.ReactNode => {
    switch (lowercasePriority) {
      case "urgent":
        return <AlertCircle className={`text-red-500 ${transparentBg ? "" : "p-0.5"} ${className}`} />;
      case "high":
        return <SignalHigh className={`text-orange-500 ${transparentBg ? "" : "pl-1"} ${className}`} />;
      case "medium":
        return <SignalMedium className={`text-yellow-500 ${transparentBg ? "" : "ml-1.5"} ${className}`} />;
      case "low":
        return <SignalLow className={`text-green-500 ${transparentBg ? "" : "ml-2"} ${className}`} />;
      default:
        return <Ban className={`text-custom-text-200 ${transparentBg ? "" : "p-0.5"} ${className}`} />;
    }
  };

  return (
    <>
      {transparentBg ? (
        getPriorityIcon()
      ) : (
        <div
          className={`grid h-5 w-5 place-items-center items-center rounded border ${
            lowercasePriority === "urgent" ? "border-red-500/20 bg-red-500/20" : "border-custom-border-200"
          }`}
        >
          {getPriorityIcon()}
        </div>
      )}
    </>
  );
};
