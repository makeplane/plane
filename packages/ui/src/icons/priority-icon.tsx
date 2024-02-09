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
    urgent: "bg-danger-solid text-danger-text-medium border-danger-90",
    high: "bg-orange-30 text-orange-80 border-orange-80",
    medium: "bg-warning-20 text-warning-80 border-warning-80",
    low: "bg-primary-30 text-primary-90 border-primary-90",
    none: "bg-neutral-40 text-neutral-text-medium border-neutral-border-strong",
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
              "text-danger-text-medium": priority === "urgent",
              "text-orange-500": priority === "high",
              "text-warning-text-subtle": priority === "medium",
              "text-primary-text-subtle": priority === "low",
              "text-neutral-text-medium": priority === "none",
            },
            className
          )}
        />
      )}
    </>
  );
};
