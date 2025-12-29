import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap transition-colors focus-visible:outline-none disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active disabled:bg-layer-disabled text-on-color disabled:text-on-color-disabled",
        "error-fill":
          "bg-danger-primary hover:bg-danger-primary-hover active:bg-danger-primary-active disabled:bg-layer-disabled text-on-color disabled:text-disabled",
        "error-outline":
          "bg-layer-2 hover:bg-danger-subtle active:bg-danger-subtle-hover disabled:bg-layer-2 text-danger-primary disabled:text-disabled border border-danger-strong disabled:border-subtle-1",
        secondary:
          "bg-layer-2 hover:bg-layer-2-hover active:bg-layer-2-active  disabled:bg-layer-transparent text-secondary disabled:text-disabled border border-strong disabled:border-subtle-1 shadow-raised-100",
        tertiary:
          "bg-layer-3 hover:bg-layer-3-hover active:bg-layer-3-active disabled:bg-layer-transparent text-secondary disabled:text-disabled",
        ghost:
          "bg-layer-transparent hover:bg-layer-transparent-hover active:bg-layer-transparent-active focus:bg-layer-transparent-active disabled:bg-layer-transparent text-secondary disabled:text-disabled",
        link: "px-0 underline text-link-primary hover:text-link-primary-hover active:text-link-primary-hover focus:text-link-primary-hover disabled:text-disabled",
      },
      size: {
        sm: "h-5 px-1.5 text-caption-md-medium rounded-sm",
        base: "h-6 px-2 text-body-xs-medium rounded-md",
        lg: "h-7 px-2 text-body-xs-medium rounded-md",
        xl: "h-8 px-2 text-body-sm-medium rounded-md",
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

export type TButtonVariant = NonNullable<ButtonProps["variant"]>;
export type TButtonSize = NonNullable<ButtonProps["size"]>;

const buttonIconStyling: Record<TButtonSize, string> = {
  sm: "size-3.5",
  base: "size-3.5",
  lg: "size-4",
  xl: "size-4 ",
};

export function getIconStyling(size: TButtonSize): string {
  return buttonIconStyling[size];
}

export function getButtonStyling(variant: TButtonVariant, size: TButtonSize): string {
  return buttonVariants({ variant, size });
}
