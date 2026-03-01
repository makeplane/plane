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
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { DropdownIcon } from "@plane/propel/icons";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { cn } from "@plane/utils";

type TChildProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type TTemplateCollapsibleWrapper = {
  actionElement?: React.ReactNode | ((props: TChildProps) => React.ReactNode);
  borderPosition?: "top" | "bottom";
  borderVariant?: "strong" | "light" | "none";
  children: React.ReactNode | ((props: TChildProps) => React.ReactNode);
  defaultOpen?: boolean;
  isOptional?: boolean;
  showBorder?: boolean;
  title: string;
};

export const TemplateCollapsibleWrapper = observer(function TemplateCollapsibleWrapper(
  props: TTemplateCollapsibleWrapper
) {
  const {
    title,
    children,
    actionElement,
    defaultOpen = false,
    isOptional = true,
    showBorder = true,
    borderPosition = "bottom",
    borderVariant = "strong",
  } = props;
  // state
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // plane hooks
  const { t } = useTranslation();

  const handleEventPropagation = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("w-full py-3", {
        "border-subtle": borderVariant === "strong",
        "border-subtle-1": borderVariant === "light",
        "border-b": borderPosition === "bottom",
        "border-t": borderPosition === "top",
        "border-none": !showBorder || borderVariant === "none",
      })}
    >
      <CollapsibleTrigger className="w-full">
        <div className="flex w-full items-center gap-3 py-3">
          <DropdownIcon
            className={cn("size-2 text-tertiary hover:text-secondary duration-300", {
              "-rotate-90": !isOpen,
            })}
          />
          <div className="flex w-full items-center justify-between gap-4">
            <div className="text-body-sm-medium text-primary flex items-center gap-2">
              <div
                className={cn(
                  "flex flex-grow items-center w-full",
                  isOpen ? "text-primary" : "text-tertiary hover:text-secondary"
                )}
              >
                {title}
              </div>
              {isOptional && (
                <div className="flex items-center gap-1.5 text-body-xs-regular italic text-placeholder">
                  <svg viewBox="0 0 2 2" className="h-1 w-1 fill-current">
                    <circle cx={1} cy={1} r={1} />
                  </svg>
                  {t("common.optional")}
                </div>
              )}
            </div>
            <div className="flex-shrink-0" onClick={handleEventPropagation}>
              {typeof actionElement === "function" ? actionElement({ isOpen, setIsOpen }) : actionElement}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {typeof children === "function" ? children({ isOpen, setIsOpen }) : children}
      </CollapsibleContent>
    </Collapsible>
  );
});
