/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useId } from "react";
import type { ReactNode } from "react";
import { DropdownOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";

export type EntityDetailWidgetSectionProps = {
  title: string;
  /** Shown after the title when greater than zero. */
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  /** Sits after the toggle and stays visible while collapsed (e.g. a progress chip). */
  titleAccessory?: ReactNode;
  /** Header actions on the right; rendered only while the section is open. */
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * One collapsible widget (sub-items, relations, links, attachments) in an entity's detail view.
 * Sections stack with a divider between them; the body sits flush with the header (no inset).
 * Only the title + caret is the toggle, so the accessory and actions can host their own controls.
 */
export function EntityDetailWidgetSection(props: EntityDetailWidgetSectionProps) {
  const { title, count, isOpen, onToggle, titleAccessory, actions, children } = props;
  const contentId = useId();

  return (
    <section className="flex w-full flex-col gap-4 border-b border-subtle py-4 first:pt-0 last:border-0">
      <div className="flex min-h-6 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={isOpen ? contentId : undefined}
          >
            <span className="text-body-xs-medium text-primary">{title}</span>
            {count !== undefined && count > 0 && <span className="text-body-xs-medium text-tertiary">{count}</span>}
            <DropdownOutline
              aria-hidden
              className={cn("size-4 shrink-0 text-tertiary transition-transform duration-200", {
                "-rotate-90": !isOpen,
              })}
            />
          </button>
          {titleAccessory}
        </div>
        {isOpen && actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {isOpen && <div id={contentId}>{children}</div>}
    </section>
  );
}
