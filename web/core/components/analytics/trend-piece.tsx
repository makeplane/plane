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
    text: "text-xs",
    icon: "w-3 h-3",
  },
  sm: {
    text: "text-sm",
    icon: "w-4 h-4",
  },
  md: {
    text: "text-base",
    icon: "w-5 h-5",
  },
  lg: {
    text: "text-lg",
    icon: "w-6 h-6",
  },
} as const;

const variants: Record<NonNullable<Props["variant"]>, Record<"ontrack" | "offtrack" | "atrisk", string>> = {
  simple: {
    ontrack: "text-green-500",
    offtrack: "text-yellow-500",
    atrisk: "text-red-500",
  },
  outlined: {
    ontrack: "text-green-500 border border-green-500",
    offtrack: "text-yellow-500 border border-yellow-500",
    atrisk: "text-red-500 border border-red-500",
  },
  tinted: {
    ontrack: "text-green-500 bg-green-500/10",
    offtrack: "text-yellow-500 bg-yellow-500/10",
    atrisk: "text-red-500 bg-red-500/10",
  },
} as const;

const TrendPiece = (props: Props) => {
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
};

export default TrendPiece;
