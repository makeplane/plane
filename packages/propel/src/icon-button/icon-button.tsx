import * as React from "react";
import { cn } from "../utils";
import type { IconButtonProps } from "./helper";
import { iconButtonVariants } from "./helper";

const IconButton = React.forwardRef(function IconButton(
  props: IconButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {
    variant = "primary",
    size = "base",
    className = "",
    type = "button",
    loading = false,
    disabled = false,
    icon: Icon,
    iconClassName = "",
    ...rest
  } = props;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...rest}
    >
      <Icon
        className={cn(
          {
            "size-3.5": size === "sm",
            "size-4": size === "base" || size === "lg",
            "size-5": size === "xl",
          },
          iconClassName
        )}
      />
    </button>
  );
});

IconButton.displayName = "plane-ui-icon-button";

export { IconButton };
