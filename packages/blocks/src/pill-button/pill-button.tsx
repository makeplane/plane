/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { Icon } from "@makeplane/propel/components/icon";
import { Pill, PillLabel } from "@makeplane/propel/elements/pill";
import type { PillButtonSize } from "./helper";
import { PROPEL_PILL_SIZE } from "./helper";
import type { IconElement } from "../types/icon";
import { cn } from "@plane/utils";

export type PillButtonContentProps = {
  size?: PillButtonSize;
  prependIcon?: IconElement;
  appendIcon?: IconElement;
  children?: React.ReactNode;
};

const PillButtonContent = (props: PillButtonContentProps) => {
  const { size = "sm", prependIcon = null, appendIcon = null, children } = props;
  return (
    <>
      {prependIcon && <Icon icon={prependIcon} size={PROPEL_PILL_SIZE[size]} />}
      {children}
      {appendIcon && <Icon icon={appendIcon} size={PROPEL_PILL_SIZE[size]} />}
    </>
  );
};

PillButtonContent.displayName = "PillButtonContent";

export type PillButtonProps = Omit<React.ComponentPropsWithRef<"button">, "size"> & {
  size?: PillButtonSize;
  isActive?: boolean;
  prependIcon?: IconElement;
  appendIcon?: IconElement;
};

const PillButton = React.forwardRef(function PillButton(
  props: PillButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {
    size = "sm",
    isActive = false,
    className,
    style,
    type = "button",
    disabled = false,
    prependIcon,
    appendIcon,
    children,
    ...rest
  } = props;

  return (
    <Pill
      ref={ref}
      size={PROPEL_PILL_SIZE[size]}
      variant="outline"
      type={type}
      disabled={disabled}
      data-popup-open={isActive ? "" : undefined}
      render={(buttonProps) => (
        <button
          {...buttonProps}
          className={cn(buttonProps.className, className)}
          style={{ ...buttonProps.style, ...style }}
        />
      )}
      {...rest}
    >
      <PillButtonContent size={size} prependIcon={prependIcon} appendIcon={appendIcon}>
        {typeof children === "string" || typeof children === "number" ? <PillLabel>{children}</PillLabel> : children}
      </PillButtonContent>
    </Pill>
  );
});

PillButton.displayName = "PillButton";

export { PillButton, PillButtonContent };
