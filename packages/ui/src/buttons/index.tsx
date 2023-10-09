import * as React from "react";
import clsx from "clsx";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  outline?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      children,
      className = "",
      type = "button",
      disabled = false,
      loading = false,
      size = "sm",
      outline = false,
      variant = "primary",
      ...rest
    } = props;

    const buttonStyleClasses = {
      primary: {
        variantStyle:
          "text-white bg-custom-primary hover:border-opacity-90 hover:bg-opacity-90",
        variantOutlineStyle:
          "text-custom-primary hover:bg-custom-primary hover:text-white",
        variantBorderStyles: "border-custom-primary",
      },
      secondary: {
        variantStyle:
          "bg-custom-background-100 hover:border-opacity-70 hover:bg-opacity-70",
        variantOutlineStyle: "hover:bg-custom-background-80",
        variantBorderStyles: "border-custom-border-200",
      },
      danger: {
        variantStyle:
          "text-white bg-red-500 hover:border-opacity-90 hover:bg-opacity-90",
        variantOutlineStyle: " text-red-500 hover:bg-red-500 hover:text-white",
        variantBorderStyles: "border-red-500",
      },
    };

    return (
      <button
        type={type}
        ref={ref}
        className={`${className} border font-medium duration-300 ${
          size === "sm"
            ? "rounded px-3 py-2 text-xs"
            : size === "md"
            ? "rounded-md px-3.5 py-2 text-sm"
            : "rounded-lg px-4 py-2 text-base"
        } ${disabled ? "cursor-not-allowed opacity-70" : ""} ${
          outline
            ? clsx({
                [buttonStyleClasses.primary.variantOutlineStyle]:
                  variant === "primary",
                [buttonStyleClasses.secondary.variantOutlineStyle]:
                  variant === "secondary",
                [buttonStyleClasses.danger.variantOutlineStyle]:
                  variant === "danger",
              })
            : clsx({
                [buttonStyleClasses.primary.variantStyle]:
                  variant === "primary",
                [buttonStyleClasses.secondary.variantStyle]:
                  variant === "secondary",
                [buttonStyleClasses.danger.variantStyle]: variant === "danger",
              })
        }  ${loading ? "cursor-wait" : ""} ${clsx({
          [buttonStyleClasses.primary.variantBorderStyles]:
            variant === "primary",
          [buttonStyleClasses.secondary.variantBorderStyles]:
            variant === "secondary",
          [buttonStyleClasses.danger.variantBorderStyles]: variant === "danger",
        })}`}
        disabled={disabled || loading}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "plane-ui-button";

export { Button };
