import * as React from "react";
import { cn } from "../utils";

export enum EPillVariant {
  DEFAULT = "default",
  PRIMARY = "primary",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
  INFO = "info",
}

export enum EPillSize {
  SM = "sm",
  MD = "md",
  LG = "lg",
  XS = "xs",
}

export type TPillVariant =
  | EPillVariant.DEFAULT
  | EPillVariant.PRIMARY
  | EPillVariant.SUCCESS
  | EPillVariant.WARNING
  | EPillVariant.ERROR
  | EPillVariant.INFO;
export type TPillSize = EPillSize.SM | EPillSize.MD | EPillSize.LG | EPillSize.XS;

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TPillVariant;
  size?: TPillSize;
  className?: string;
  children: React.ReactNode;
}

const pillVariants = {
  [EPillVariant.DEFAULT]: "bg-custom-background-90 text-custom-text-200 border border-custom-border-200",
  [EPillVariant.PRIMARY]: "bg-custom-primary-100/10 text-custom-primary-100 border border-custom-primary-100/20",
  [EPillVariant.SUCCESS]: "bg-green-50 text-green-700 border border-green-200",
  [EPillVariant.WARNING]: "bg-amber-50 text-amber-700 border border-amber-200",
  [EPillVariant.ERROR]: "bg-red-50 text-red-700 border border-red-200",
  [EPillVariant.INFO]: "bg-blue-50 text-blue-700 border border-blue-200",
};

const pillSizes = {
  [EPillSize.XS]: "px-1.5 py-0.5 text-xs",
  [EPillSize.SM]: "px-2 py-0.5 text-xs",
  [EPillSize.MD]: "px-2.5 py-1 text-sm",
  [EPillSize.LG]: "px-3 py-1.5 text-base",
};

const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ variant = EPillVariant.DEFAULT, size = EPillSize.MD, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap",
        // Variant styles
        pillVariants[variant],
        // Size styles
        pillSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
);

Pill.displayName = "Pill";

export { Pill };
