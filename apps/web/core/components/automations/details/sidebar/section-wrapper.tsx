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
  actionButtons?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerActions?: React.ReactNode | ((open: boolean) => React.ReactNode);
  title: string;
};

export function AutomationDetailsSidebarSectionWrapper(props: TProps) {
  const { actionButtons, children, defaultOpen = true, headerActions, title } = props;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      render={<section />}
      defaultOpen={defaultOpen}
      className="flex-grow w-full"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className="px-3">
        <CollapsibleTrigger
          className={cn(
            "group/section-wrapper flex items-center gap-2 py-1.5 px-1 flex-shrink-0 w-full hover:rounded-sm hover:text-primary hover:bg-layer-transparent-hover"
          )}
          aria-label="Toggle section"
        >
          <h3 className="flex-shrink-0 text-9 font-semibold uppercase text-tertiary">{title}</h3>
          <div className="flex-grow h-px" />
          {typeof headerActions === "function" ? headerActions(isOpen) : headerActions}
          <div className="flex-shrink-0 size-4 rounded-sm grid place-items-center outline-none border-none">
            <ChevronRightIcon className={cn("size-3.5 transition-transform", { "rotate-90": isOpen })} />
          </div>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-2 space-y-3">
        <div className="space-y-3 px-4">{children}</div>
        {actionButtons}
      </CollapsibleContent>
    </Collapsible>
  );
}
