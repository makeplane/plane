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

import React, { useState } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { ChevronRightIcon } from "@plane/propel/icons";
// plane imports
import { cn } from "@plane/utils";

type TProps = {
  children: React.ReactNode;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconVariant?: "outline" | "filled";
};

export function AutomationDetailsMainContentSectionWrapper(props: TProps) {
  const { children, title, icon: Icon, iconVariant = "outline" } = props;
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible render={<section />} defaultOpen className="flex-grow w-full" open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex items-center gap-4 flex-shrink-0 w-full hover:rounded-sm text-tertiary hover:text-secondary hover:bg-layer-transparent-hover py-1.5 px-1"
        )}
        aria-label="Toggle section"
      >
        <h3 className="flex-shrink-0 text-13 font-medium uppercase">{title}</h3>
        <div className="flex-grow h-px bg-layer-3" />
        <div className="flex-shrink-0 size-4 rounded-sm grid place-items-center outline-none border-none">
          <ChevronRightIcon
            className={cn("size-3.5 transition-transform", {
              "rotate-90": isOpen,
            })}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-6 space-y-6">
        {Icon ? (
          <div className="flex items-start gap-4">
            <span className="flex-shrink-0 size-8 rounded-full bg-accent-primary text-on-color grid place-items-center">
              <Icon
                className={cn("size-4", {
                  "fill-white": iconVariant === "filled",
                })}
              />
            </span>
            {children}
          </div>
        ) : (
          children
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
