import * as React from "react";
import { AlertCircle, Ban, SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import { cn } from "../utils";

export type TIssuePriorities = "urgent" | "high" | "medium" | "low" | "none";

interface IPriorityIcon {
  className?: string;
  containerClassName?: string;
  priority: TIssuePriorities | undefined | null;
  size?: number;
  withContainer?: boolean;
}

export function PriorityIcon(props: IPriorityIcon) {
  const { priority, className = "", containerClassName = "", size = 14, withContainer = false } = props;

  const priorityClasses = {
    urgent: "bg-layer-2 text-priority-urgent border-priority-urgent",
    high: "bg-layer-2 text-priority-high border-priority-high",
    medium: "bg-layer-2 text-priority-medium border-priority-medium",
    low: "bg-layer-2 text-priority-low border-priority-low",
    none: "bg-layer-2 text-priority-none border-priority-none",
  };

  // get priority icon
  const icons = {
    urgent: AlertCircle,
    high: SignalHigh,
    medium: SignalMedium,
    low: SignalLow,
    none: Ban,
  };
  const Icon = icons[priority ?? "none"];

  if (!Icon) return null;

  return (
    <>
      {withContainer ? (
        <div
          className={cn(
            "flex items-center justify-center border rounded-sm p-0.5 flex-shrink-0",
            priorityClasses[priority ?? "none"],
            containerClassName
          )}
        >
          <Icon
            size={size}
            className={cn(
              {
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
            "flex-shrink-0",
            {
              "text-priority-urgent": priority === "urgent",
              "text-priority-high": priority === "high",
              "text-priority-medium": priority === "medium",
              "text-priority-low": priority === "low",
              "text-priority-none": priority === "none",
            },
            className
          )}
        />
      )}
    </>
  );
}
