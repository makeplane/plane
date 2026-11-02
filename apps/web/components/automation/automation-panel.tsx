/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
// plane imports
import { cn } from "@plane/utils";

type PanelProps = {
  isOpen: boolean;
  children: ReactNode;
};

/** The options panel attached under an automation's toggle row; it slides open while enabled. */
export function AutomationPanel({ isOpen, children }: PanelProps) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
      inert={!isOpen}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex flex-col gap-3 rounded-b-lg border border-t-0 border-subtle bg-layer-1 p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

type RowProps = {
  label: string;
  children: ReactNode;
};

/** One labelled option inside an automation panel. */
export function AutomationPanelRow({ label, children }: RowProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="line-clamp-2 min-w-0 flex-1 text-body-xs-medium">{label}</div>
      <div className="w-full min-w-0 sm:w-72 sm:shrink-0">{children}</div>
    </div>
  );
}
