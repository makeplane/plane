/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";

type TSidebarPropertyListItemProps = {
  icon: React.FC<{ className?: string }>;
  label: string;
  children: ReactNode;
  appendElement?: ReactNode;
  childrenClassName?: string;
};

export function SidebarPropertyListItem(props: TSidebarPropertyListItemProps) {
  const { icon: Icon, label, children, appendElement, childrenClassName } = props;

  return (
    <div className="flex items-start gap-2">
      <div className="flex min-h-8 w-30 shrink-0 items-center text-body-xs-regular text-tertiary">
        {/* Top-aligned so the icon stays beside the first line when a long label wraps. */}
        <div className="flex h-full w-full items-start gap-1.5">
          <span className="shrink-0 py-0.5">
            <Icon className="size-4 shrink-0" />
          </span>
          <Tooltip label={label}>
            <span className="line-clamp-2 min-w-0 whitespace-normal">{label}</span>
          </Tooltip>
          {appendElement}
        </div>
      </div>
      <div className={cn("flex min-h-8 min-w-0 grow flex-wrap items-center gap-1", childrenClassName)}>{children}</div>
    </div>
  );
}
