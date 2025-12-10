import * as React from "react";
import { cn } from "../utils";
import type { IconButtonProps } from "./helper";
import { iconButtonVariants } from "./helper";

const IconButton = React.forwardRef(function Button(
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
      <Icon />
    </button>
  );
});

IconButton.displayName = "plane-ui-icon-button";

export { IconButton };
