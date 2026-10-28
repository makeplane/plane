/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Field } from "@base-ui/react/field";
import { FieldDescription } from "@makeplane/propel/components/field";
import { FieldLabel } from "@makeplane/propel/elements/field";

// plane imports
import { cn } from "@plane/utils";
// local imports
import { SettingsDocsLink } from "./docs-link";

type Props = {
  className?: string;
  control?: React.ReactNode;
  description?: React.ReactNode;
  /** Help-center page shown as a "Docs" link after the description. */
  docHref?: string;
  /** Leading glyph, shown in a tile beside the title. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** Shown beside the title, e.g. a badge or an info tooltip, outside the heading itself. */
  titleAccessory?: React.ReactNode;
  /** Attached panel under the row, separated by a border, e.g. the settings a toggle unlocks. */
  footer?: React.ReactNode;
};

export function SettingsBoxedControlItem(props: Props) {
  const { className, control, description, docHref, icon, title, titleAccessory, footer } = props;

  const heading = (
    <Field.Label
      nativeLabel={false}
      render={
        <FieldLabel
          size="xl"
          inset={false}
          render={({ children, ...headingProps }) => <h4 {...headingProps}>{children}</h4>}
        />
      }
    >
      {title}
    </Field.Label>
  );

  return (
    <div className={cn("w-full rounded-lg border border-subtle bg-layer-2", className)}>
      <Field.Root className="flex w-full flex-col items-start gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex min-w-0 items-center gap-3">
          {icon && <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-layer-1 p-1.5">{icon}</div>}
          <div className="flex min-w-0 flex-col gap-1.5">
            {titleAccessory ? (
              <div className="flex items-center gap-2">
                {heading}
                {titleAccessory}
              </div>
            ) : (
              heading
            )}
            {(description || docHref) && (
              <FieldDescription size="md">
                {description}
                {docHref && <SettingsDocsLink href={docHref} />}
              </FieldDescription>
            )}
          </div>
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </Field.Root>
      {footer && <div className="rounded-b-lg border-t border-subtle bg-surface-2 px-4 py-3">{footer}</div>}
    </div>
  );
}
