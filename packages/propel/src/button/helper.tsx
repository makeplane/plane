import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export type TButtonVariant =
  | "primary"
  | "accent-primary"
  | "outline-primary"
  | "neutral-primary"
  | "link-primary"
  | "danger"
  | "accent-danger"
  | "outline-danger"
  | "link-danger"
  | "tertiary-danger"
  | "link-neutral";

export interface IButtonStyling {
  [key: string]: {
    default: string;
    hover: string;
    pressed: string;
    disabled: string;
  };
}

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-md transition-colors focus-visible:outline-none disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active focus:bg-accent-primary-active disabled:bg-layer-disabled text-on-color disabled:text-disabled",
        "error-fill":
          "bg-danger-primary hover:bg-danger-primary-hover active:bg-danger-primary-active focus:bg-danger-primary-active disabled:bg-layer-disabled text-on-color disabled:text-disabled",
        "error-outline":
          "bg-layer-2 hover:bg-danger-subtle active:bg-danger-subtle-hover focus:bg-danger-subtle-hover disabled:bg-layer-2 text-danger disabled:text-disabled border border-danger-strong disabled:border-subtle-1",
        secondary:
          "bg-layer-2 hover:bg-layer-2-hover active:bg-layer-2-active focus:bg-layer-2-active disabled:bg-layer-transparent text-secondary disabled:text-disabled border border-strong disabled:border-subtle-1",
        tertiary:
          "bg-layer-1 hover:bg-layer-1-hover active:bg-layer-1-active focus:bg-layer-1-active disabled:bg-layer-transparent text-secondary disabled:text-disabled",
        ghost:
          "bg-layer-transparent hover:bg-layer-transparent-hover active:bg-layer-transparent-active focus:bg-layer-transparent-active disabled:bg-layer-transparent text-secondary disabled:text-disabled",
        link: "px-0 underline text-link-primary hover:text-link-primary-hover active:text-link-primary-hover focus:text-link-primary-hover disabled:text-disabled",
      },
      size: {
        sm: "h-5 px-1.5 text-caption-md-medium",
        base: "h-6 px-2 text-body-xs-medium",
        lg: "h-7 px-2 text-body-sm-medium",
        xl: "h-8 px-2 text-body-sm-medium",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "base",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    appendIcon?: React.ReactElement;
    loading?: boolean;
    prependIcon?: React.ReactElement;
  };

const buttonIconStyling: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "size-3.5",
  base: "size-3.5",
  lg: "size-4",
  xl: "size-4 ",
};

export function getIconStyling(size: NonNullable<ButtonProps["size"]>): string {
  return buttonIconStyling[size];
}

export function getButtonStyling(
  variant: NonNullable<ButtonProps["variant"]>,
  size: NonNullable<ButtonProps["size"]>
): string {
  return buttonVariants({ variant, size });
}
