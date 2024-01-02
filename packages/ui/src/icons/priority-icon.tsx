import * as React from "react";
import { AlertCircle, Ban, SignalHigh, SignalLow, SignalMedium } from "lucide-react";

type TIssuePriorities = "urgent" | "high" | "medium" | "low" | "none";

interface IPriorityIcon {
  className?: string;
  priority: TIssuePriorities;
  size?: number;
}

export const PriorityIcon: React.FC<IPriorityIcon> = (props) => {
  const { priority, className = "", size = 14 } = props;

  // Convert to lowercase for string comparison
  const lowercasePriority = priority?.toLowerCase();

  //get priority icon
  const getPriorityIcon = (): React.ReactNode => {
    switch (lowercasePriority) {
      case "urgent":
        return <AlertCircle size={size} className={`text-red-500 ${className}`} />;
      case "high":
        return <SignalHigh size={size} strokeWidth={3} className={`text-orange-500 ${className}`} />;
      case "medium":
        return <SignalMedium size={size} strokeWidth={3} className={`text-yellow-500 ${className}`} />;
      case "low":
        return <SignalLow size={size} strokeWidth={3} className={`text-custom-primary-100 ${className}`} />;
      default:
        return <Ban size={size} className={`text-custom-text-200 ${className}`} />;
    }
  };

  return <>{getPriorityIcon()}</>;
};
