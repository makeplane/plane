/**
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { cn } from "@plane/utils";

type Props = {
  className?: string;
  children: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  title: React.ReactNode;
};

/**
 * One settings card that carries its own heading, so a section does not need a separate
 * title box stacked on top of the box holding its controls.
 *
 * Rows are usually SettingsBoxedControlItem with `className="rounded-none border-0"`; the
 * separators between them belong to this component.
 */
export function SettingsBoxedSection(props: Props) {
  const { className, children, description, footer, title } = props;

  return (
    <div className={cn("w-full rounded-lg border border-subtle bg-layer-2", className)}>
      <div className="flex flex-col gap-1.5 border-b border-subtle px-4 py-3">
        <h3 className="text-body-md-medium text-primary">{title}</h3>
        {description && <p className="text-caption-md-regular text-tertiary">{description}</p>}
      </div>
      <div className="divide-y divide-subtle">{children}</div>
      {footer && <div className="border-t border-subtle px-4 py-3">{footer}</div>}
    </div>
  );
}
