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

const variants: Record<NonNullable<Props["variant"]>, Record<"positive" | "negative", string>> = {
  simple: {
    positive: "text-green-500",
    negative: "text-red-500",
  },
  outlined: {
    positive: "text-green-500 border border-green-500",
    negative: "text-red-500 border border-red-500",
  },
  tinted: {
    positive: "text-green-500 bg-green-500/10",
    negative: "text-red-500 bg-red-500/10",
  },
} as const;

const TrendPiece = (props: Props) => {
  const { percentage, className, trendIconVisible = true, size = "sm", variant = "simple" } = props;
  const isPositive = percentage > 0;
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-md",
        variants[variant][isPositive ? "positive" : "negative"],
        config.text,
        className
      )}
    >
      {trendIconVisible &&
        (isPositive ? <TrendingUp className={config.icon} /> : <TrendingDown className={config.icon} />)}
      {Math.round(Math.abs(percentage))}%
    </div>
  );
};

export default TrendPiece;