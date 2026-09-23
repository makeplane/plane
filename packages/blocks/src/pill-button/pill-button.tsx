/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { PillButtonSize } from "./helper";
import { getPillButtonClassName, getPillButtonIconClassName } from "./helper";
import type { IconElement } from "../types";
import { cn } from "@plane/utils";

export type PillButtonContentProps = {
  size?: PillButtonSize;
  prependIcon?: IconElement;
  appendIcon?: IconElement;
  children?: React.ReactNode;
};

const PillButtonContent = (props: PillButtonContentProps) => {
  const { size = "sm", prependIcon = null, appendIcon = null, children } = props;
  const iconClassName = getPillButtonIconClassName(size);
  return (
    <>
      {prependIcon && React.cloneElement(prependIcon, { className: cn(iconClassName) })}
      {children}
      {appendIcon && React.cloneElement(appendIcon, { className: cn(iconClassName) })}
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
    type = "button",
    disabled = false,
    prependIcon,
    appendIcon,
    children,
    ...rest
  } = props;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(getPillButtonClassName(size, isActive), className)}
      {...rest}
    >
      <PillButtonContent size={size} prependIcon={prependIcon} appendIcon={appendIcon}>
        {children}
      </PillButtonContent>
    </button>
  );
});

PillButton.displayName = "PillButton";

export { PillButton, PillButtonContent };
