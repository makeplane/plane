/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { cn } from "@plane/utils";
import { getCardStyle } from "./helper";
import type { CardDirection, CardSpacing, CardVariant } from "./helper";

export type CardProps = React.ComponentPropsWithRef<"div"> & {
  variant?: CardVariant;
  spacing?: CardSpacing;
  direction?: CardDirection;
};

const Card = React.forwardRef(function Card(props: CardProps, ref: React.ForwardedRef<HTMLDivElement>) {
  const { variant = "with-shadow", direction = "column", className = "", spacing = "lg", children, ...rest } = props;

  const style = getCardStyle(variant, spacing, direction);
  return (
    <div ref={ref} className={cn(style, className)} {...rest}>
      {children}
    </div>
  );
});

Card.displayName = "Card";

export { Card };
export type { CardVariant, CardSpacing, CardDirection };
