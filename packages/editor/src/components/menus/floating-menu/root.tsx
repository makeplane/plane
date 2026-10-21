/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FloatingOverlay, FloatingPortal } from "@floating-ui/react";
import type { UseInteractionsReturn, UseFloatingReturn } from "@floating-ui/react";
import { useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { MenuItem } from "@makeplane/propel/elements/menu";
import type { MenuItemVariant } from "@makeplane/propel/elements/menu";

type Props = {
  children: React.ReactNode;
  classNames?: {
    buttonContainer?: string;
    button?: string;
  };
  getFloatingProps: UseInteractionsReturn["getFloatingProps"];
  getReferenceProps: UseInteractionsReturn["getReferenceProps"];
  menuButton: React.ReactNode;
  renderButton?: (props: ComponentPropsWithRef<"button">) => ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  options: UseFloatingReturn;
};

export function FloatingMenuRoot(props: Props) {
  const { children, classNames, getFloatingProps, getReferenceProps, menuButton, onClick, options, renderButton } =
    props;
  // derived values
  const { refs, floatingStyles, context } = options;
  const buttonProps: ComponentPropsWithRef<"button"> = {
    ref: refs.setReference,
    ...getReferenceProps(),
    type: "button",
    className: classNames?.button,
    onClick: (e) => {
      context.onOpenChange(!context.open);
      onClick?.(e);
    },
    children: menuButton,
  };

  return (
    <>
      <div className={classNames?.buttonContainer}>
        {renderButton ? renderButton(buttonProps) : <button {...buttonProps} />}
      </div>
      {context.open && (
        <FloatingPortal>
          {/* Backdrop */}
          <FloatingOverlay
            style={{
              zIndex: 99,
            }}
            lockScroll
          />
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              ...floatingStyles,
              zIndex: 100,
            }}
          >
            {children}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

/** Public row chrome with the existing native button and sequential keyboard behavior. */
export function FloatingMenuItem({
  children,
  variant = "neutral",
  ...props
}: ComponentPropsWithRef<"button"> & { variant?: MenuItemVariant }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <MenuItem
      layout="single"
      variant={variant}
      data-highlighted={isHovered || isFocused ? "" : undefined}
      render={
        <button
          {...props}
          style={{ textAlign: "start", ...props.style }}
          onPointerEnter={(e) => {
            setIsHovered(true);
            props.onPointerEnter?.(e);
          }}
          onPointerLeave={(e) => {
            setIsHovered(false);
            props.onPointerLeave?.(e);
          }}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        />
      }
    >
      {children}
    </MenuItem>
  );
}
