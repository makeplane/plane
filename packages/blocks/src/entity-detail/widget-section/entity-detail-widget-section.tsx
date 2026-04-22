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

import { useId } from "react";
import type { ReactNode } from "react";
import { DropdownIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

export type EntityDetailWidgetSectionProps = {
  title: string;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  actionElement?: ReactNode;
  children: ReactNode;
};

export function EntityDetailWidgetSection(props: EntityDetailWidgetSectionProps) {
  const { title, count, isOpen, onToggle, actionElement, children } = props;
  const contentId = useId();

  return (
    <div className="flex flex-col gap-4 w-full py-4 first:pt-0 border-b border-subtle last:border-0">
      <button type="button" className="w-full" onClick={onToggle} aria-expanded={isOpen} aria-controls={contentId}>
        <div className="flex items-center justify-between gap-3 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-body-xs-medium text-primary">{title}</span>
            {count != null && count > 0 && <span className="text-body-xs-medium text-tertiary">{count}</span>}
            <DropdownIcon
              className={cn("size-4 text-tertiary transition-transform duration-200", { "-rotate-90": !isOpen })}
            />
          </div>
          {actionElement && isOpen && <div onClick={(e) => e.stopPropagation()}>{actionElement}</div>}
        </div>
      </button>
      {isOpen && <div id={contentId}>{children}</div>}
    </div>
  );
}
