// plane package imports
import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@plane/utils";
// plane web components

type Props = {
  percentage: number;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  trendIconVisible?: boolean;
  variant?: "simple" | "outlined" | "tinted";
};

const sizeConfig = {
  xs: {
    text: "text-11",
    icon: "w-3 h-3",
  },
  sm: {
    text: "text-13",
    icon: "w-4 h-4",
  },
  md: {
    text: "text-14",
    icon: "w-5 h-5",
  },
  lg: {
    text: "text-16",
    icon: "w-6 h-6",
  },
} as const;

const variants: Record<NonNullable<Props["variant"]>, Record<"ontrack" | "offtrack" | "atrisk", string>> = {
  simple: {
    ontrack: "text-success-primary",
    offtrack: "text-yellow-500",
    atrisk: "text-danger-primary",
  },
  outlined: {
    ontrack: "text-success-primary border border-success-strong",
    offtrack: "text-yellow-500 border border-yellow-500",
    atrisk: "text-danger-primary border border-danger-strong",
  },
  tinted: {
    ontrack: "text-success-primary bg-success-subtle",
    offtrack: "text-yellow-500 bg-yellow-500/10",
    atrisk: "text-danger-primary bg-danger-subtle",
  },
} as const;

function TrendPiece(props: Props) {
  const { percentage, className, trendIconVisible = true, size = "sm", variant = "simple" } = props;
  const isOnTrack = percentage >= 66;
  const isOffTrack = percentage >= 33 && percentage < 66;
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-md",
        variants[variant][isOnTrack ? "ontrack" : isOffTrack ? "offtrack" : "atrisk"],
        config.text,
        className
      )}
    >
      {trendIconVisible &&
        (isOnTrack ? (
          <TrendingUp className={config.icon} />
        ) : isOffTrack ? (
          <TrendingDown className={config.icon} />
        ) : (
          <TrendingDown className={config.icon} />
        ))}
      {Math.round(Math.abs(percentage))}%
    </div>
  );
}

export default TrendPiece;
