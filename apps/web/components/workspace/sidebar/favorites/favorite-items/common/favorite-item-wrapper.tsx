/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { ListItem } from "@makeplane/propel/components/list";
// helpers
import { cn } from "@plane/utils";

type Props = {
  children: React.ReactNode;
  elementRef: React.RefObject<HTMLDivElement | null>;
  isMenuActive?: boolean;
};

export function FavoriteItemWrapper(props: Props) {
  const { children, elementRef, isMenuActive = false } = props;
  return (
    <ListItem
      density="comfortable"
      render={
        <div
          ref={elementRef}
          className={cn("group/project-item", {
            "bg-surface-2": isMenuActive,
          })}
        />
      }
    >
      {children}
    </ListItem>
  );
}
