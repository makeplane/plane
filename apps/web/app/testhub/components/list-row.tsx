/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@plane/utils";

type TesthubListRowProps = {
  children: ReactNode;
  className?: string;
  selected?: boolean;
  to?: string;
  onClick?: () => void;
};

export function TesthubListRow({ children, className, selected, to, onClick }: TesthubListRowProps) {
  const classes = cn(
    "group flex min-h-12 w-full items-center justify-between gap-3 border-b border-subtle px-3 py-2 text-left text-13",
    selected ? "bg-layer-1-selected" : "bg-layer-transparent hover:bg-layer-transparent-hover",
    className
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}
