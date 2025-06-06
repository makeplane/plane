// plane package imports
import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@plane/utils";
// plane web components

type Props = {
  percentage: number;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
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

const TrendPiece = (props: Props) => {
  const { percentage, className, size = "sm" } = props;
  const isPositive = percentage > 0;
  const config = sizeConfig[size];

  return (
    <div
      className={cn("flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500", config.text, className)}
    >
      {isPositive ? <TrendingUp className={config.icon} /> : <TrendingDown className={config.icon} />}
      {Math.round(Math.abs(percentage))}%
    </div>
  );
};

export default TrendPiece;
