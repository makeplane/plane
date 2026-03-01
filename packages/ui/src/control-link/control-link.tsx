/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

export type TControlLink = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
  target?: string;
  disabled?: boolean;
  className?: string;
  draggable?: boolean;
  selectable?: boolean;
};

export const ControlLink = React.forwardRef(function ControlLink(
  props: TControlLink,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {
    href,
    onClick,
    children,
    target = "_blank",
    disabled = false,
    className,
    draggable = false,
    selectable,
    ...rest
  } = props;
  const LEFT_CLICK_EVENT_CODE = 0;

  const handleOnClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (window.getSelection()?.toString()) {
      return;
    }

    const clickCondition = (event.metaKey || event.ctrlKey) && event.button === LEFT_CLICK_EVENT_CODE;
    if (!clickCondition) {
      event.preventDefault();
      onClick(event);
    }
  };
  const handleMouseDown = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.getSelection()?.toString()) {
      event.stopPropagation();
    }
  };

  // if disabled but still has a ref or a className then it has to be rendered without a href
  if (disabled && (ref || className))
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} className={className} href={href ?? "#"}>
        {children}
      </a>
    );

  // else if just disabled return without the parent wrapper
  if (disabled) return <>{children}</>;

  //
  if (selectable) {
    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} className={className} {...rest}>
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={target}
      onClick={handleOnClick}
      onMouseDown={handleMouseDown}
      {...rest}
      ref={ref}
      className={className}
      draggable={draggable}
    >
      {children}
    </a>
  );
});

ControlLink.displayName = "ControlLink";
