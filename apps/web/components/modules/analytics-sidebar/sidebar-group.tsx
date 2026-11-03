/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDownOutline } from "@makeplane/propel/icons";

type Props = {
  label: string;
  /** Header-end content (counts, actions); stays visible while the group is collapsed. */
  trailing?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

/**
 * A collapsible module sidebar group. The header and body sit flush with the sidebar's dividers, so
 * every group shares the same edges and the same header-to-body gap.
 */
export function ModuleSidebarGroup(props: Props) {
  const { label, trailing, open, defaultOpen, onOpenChange, children } = props;

  return (
    <Collapsible.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} className="flex flex-col">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <Collapsible.Trigger className="group flex min-w-0 items-center gap-1 rounded-sm text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-strong">
          <span className="truncate text-caption-md-semibold">{label}</span>
          <ChevronDownOutline
            aria-hidden="true"
            className="size-3.5 shrink-0 -rotate-90 text-secondary transition-transform duration-200 group-data-[panel-open]:rotate-0 motion-reduce:transition-none"
          />
        </Collapsible.Trigger>
        {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
      </div>
      <Collapsible.Panel className="pt-4 text-body-xs-regular text-secondary">{children}</Collapsible.Panel>
    </Collapsible.Root>
  );
}
