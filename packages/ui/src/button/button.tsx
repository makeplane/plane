import * as React from "react";

import {
  getIconStyling,
  getButtonStyling,
  TButtonVariant,
  TButtonSizes,
} from "./helper";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TButtonVariant;
  size?: TButtonSizes;
  className?: string;
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
      size = "md",
      className = "",
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
        className={`${buttonStyle} ${className}`}
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
