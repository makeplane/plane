/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// helpers
import { cn } from "./utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

function Loader({ children, className = "" }: Props) {
  return (
    <div className={cn("animate-pulse", className)} role="status">
      {children}
    </div>
  );
}

type ItemProps = {
  height?: string;
  width?: string;
  className?: string;
};

function Item({ height = "auto", width = "auto", className = "" }: ItemProps) {
  return <div className={cn("rounded-md bg-layer-1", className)} style={{ height: height, width: width }} />;
}

Loader.Item = Item;

Loader.displayName = "plane-ui-loader";

export { Loader };
