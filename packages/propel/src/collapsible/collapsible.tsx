/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import * as React from "react";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { clsx } from "clsx";

/* -------------------------------------------------------------------------- */
/*                                   Root                                     */
/* -------------------------------------------------------------------------- */

export type CollapsibleRootProps = BaseCollapsible.Root.Props;

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleRootProps>(function Collapsible(
  { className, ...props },
  ref
) {
  return <BaseCollapsible.Root ref={ref} className={clsx(className)} {...props} />;
});

/* -------------------------------------------------------------------------- */
/*                                  Trigger                                   */
/* -------------------------------------------------------------------------- */

export type CollapsibleTriggerProps = BaseCollapsible.Trigger.Props;

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  function CollapsibleTrigger({ className, ...props }, ref) {
    return (
      <BaseCollapsible.Trigger
        ref={ref}
        className={clsx(
          "flex items-center gap-2 rounded-sm text-sm font-medium",
          "hover:bg-gray-200 focus-visible:outline-2",
          "data-[panel-open]:font-semibold",
          className
        )}
        {...props}
      />
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                                   Panel                                    */
/* -------------------------------------------------------------------------- */

export type CollapsibleContentProps = BaseCollapsible.Panel.Props;

export const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(function CollapsibleContent(
  { className, ...props },
  ref
) {
  return (
    <BaseCollapsible.Panel
      ref={ref}
      className={clsx(
        "flex h-[var(--collapsible-panel-height)] flex-col overflow-hidden",
        "transition-all ease-out",
        "data-[starting-style]:h-0 data-[ending-style]:h-0",
        className
      )}
      {...props}
    />
  );
});
