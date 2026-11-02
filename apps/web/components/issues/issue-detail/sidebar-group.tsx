/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useId, useState } from "react";
import type { ReactNode } from "react";
// plane imports
import { DropdownOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";

type Props = {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

/** Collapsible group of sidebar properties with a small caret header. */
export function IssueDetailSidebarGroup(props: Props) {
  const { label, children, defaultOpen = true } = props;
  // states
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // derived values
  const contentId = useId();

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        className="flex w-full items-center gap-1 py-1 text-caption-md-semibold text-primary"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={isOpen ? contentId : undefined}
      >
        <span>{label}</span>
        <span className="flex size-4 items-center justify-center">
          <DropdownOutline
            className={cn("size-3 text-primary transition-transform duration-200", {
              "-rotate-90": !isOpen,
            })}
          />
        </span>
      </button>
      {isOpen && (
        <div id={contentId} className="flex flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
