import * as React from "react";

import { getIconStyling, getButtonStyling } from "./helper";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  appendIcon?: any;
  prependIcon?: any;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const {
      variant = "primary",
      size = "sm",
      type = "button",
      loading = false,
      disabled = false,
      prependIcon = null,
      appendIcon = null,
      children,
      ...rest
    } = props;

    const buttonStyle = getButtonStyling(variant, size, disabled || loading);
    const buttonIconStyle = getIconStyling(size);

    return (
      <button
        ref={ref}
        type={type}
        className={`${buttonStyle}`}
        disabled={disabled || loading}
        {...rest}
      >
        {prependIcon && (
          <div className={buttonIconStyle}>
            {React.cloneElement(prependIcon, { "stroke-width": 2 })}
          </div>
        )}
        {children}
        {appendIcon && (
          <div className={buttonIconStyle}>
            {React.cloneElement(appendIcon, { "stroke-width": 2 })}
          </div>
        )}
      </button>
    );
  }
);

Button.displayName = "plane-ui-button";

export { Button };
