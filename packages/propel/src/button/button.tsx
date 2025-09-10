import * as React from "react";
import { cn } from "../utils";

export enum EButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  OUTLINE = "outline",
  GHOST = "ghost",
  DESTRUCTIVE = "destructive",
}

export enum EButtonSize {
  SM = "sm",
  MD = "md",
  LG = "lg",
}

export type TButtonVariant =
  | EButtonVariant.PRIMARY
  | EButtonVariant.SECONDARY
  | EButtonVariant.OUTLINE
  | EButtonVariant.GHOST
  | EButtonVariant.DESTRUCTIVE;
export type TButtonSize = EButtonSize.SM | EButtonSize.MD | EButtonSize.LG;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TButtonVariant;
  size?: TButtonSize;
  className?: string;
  children: React.ReactNode;
}

const buttonVariants = {
  [EButtonVariant.PRIMARY]: "bg-custom-primary-100 text-white hover:bg-custom-primary-200 focus:bg-custom-primary-200",
  [EButtonVariant.SECONDARY]:
    "bg-custom-background-100 text-custom-text-200 border border-custom-border-200 hover:bg-custom-background-90 focus:bg-custom-background-90",
  [EButtonVariant.OUTLINE]:
    "border border-custom-primary-100 text-custom-primary-100 bg-transparent hover:bg-custom-primary-100/10 focus:bg-custom-primary-100/20",
  [EButtonVariant.GHOST]: "text-custom-text-200 hover:bg-custom-background-90 focus:bg-custom-background-90",
  [EButtonVariant.DESTRUCTIVE]: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600",
};

const buttonSizes = {
  [EButtonSize.SM]: "px-3 py-1.5 text-xs font-medium",
  [EButtonSize.MD]: "px-4 py-2 text-sm font-medium",
  [EButtonSize.LG]: "px-6 py-2.5 text-base font-medium",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = EButtonVariant.PRIMARY, size = EButtonSize.MD, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center gap-2 rounded-md transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-custom-primary-100/20 focus:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        // Variant styles
        buttonVariants[variant],
        // Size styles
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = "Button";

export { Button };
