import * as React from "react";
import { AlertCircle, Ban, SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import { cn } from "../../helpers";

type TIssuePriorities = "urgent" | "high" | "medium" | "low" | "none";

interface IPriorityIcon {
  className?: string;
  containerClassName?: string;
  priority: TIssuePriorities;
  size?: number;
  withContainer?: boolean;
}

export const PriorityIcon: React.FC<IPriorityIcon> = (props) => {
  const { priority, className = "", containerClassName = "", size = 14, withContainer = false } = props;

  const priorityClasses = {
    urgent: "bg-red-500 text-red-500 border-red-500",
    high: "bg-orange-500/20 text-orange-500 border-orange-500",
    medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
    low: "bg-custom-primary-100/20 text-custom-primary-100 border-custom-primary-100",
    none: "bg-custom-background-80 text-custom-text-200 border-custom-border-300",
  };

  // get priority icon
  const icons = {
    urgent: AlertCircle,
    high: SignalHigh,
    medium: SignalMedium,
    low: SignalLow,
    none: Ban,
  };
  const Icon = icons[priority];

  if (!Icon) return null;

  return (
    <>
      {withContainer ? (
        <div
          className={cn(
            "grid place-items-center border rounded p-0.5 flex-shrink-0",
            priorityClasses[priority],
            containerClassName
          )}
        >
          <Icon
            size={size}
            viewBox="0 0 23.5 24"
            className={cn(
              {
                "text-white": priority === "urgent",
                // centre align the icons
                "translate-x-[0.0625rem]": priority === "high",
                "translate-x-0.5": priority === "medium",
                "translate-x-1": priority === "low",
              },
              className
            )}
          />
        </div>
      ) : (
        <Icon
          size={size}
          className={cn(
            {
              "text-red-500": priority === "urgent",
              "text-orange-500": priority === "high",
              "text-yellow-500": priority === "medium",
              "text-custom-primary-100": priority === "low",
              "text-custom-text-200": priority === "none",
            },
            className
          )}
        />
      )}
    </>
  );
};
