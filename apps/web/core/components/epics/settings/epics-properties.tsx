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
import { ChevronRightIcon } from "@plane/propel/icons";
import type { TLoader, IIssueType } from "@plane/types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// helpers
import { cn } from "@plane/utils";
// plane web components
import { IssuePropertiesRoot } from "@/components/work-item-types/properties/root";

type EpicPropertiesProps = {
  epicId: string;
  propertiesLoader: TLoader;
  containerClassName?: string;
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  getClassName?: (isOpen: boolean) => string;
};

export const EpicPropertiesRoot = observer(function EpicPropertiesRoot(props: EpicPropertiesProps) {
  // props
  const { epicId, propertiesLoader, containerClassName, getWorkItemTypeById, getClassName } = props;
  // hooks
  const { t } = useTranslation();
  // states
  const [isOpen, setIsOpen] = useState(true);
  // derived values
  const epicDetail = getWorkItemTypeById(epicId);

  if (!epicDetail) return null;

  return (
    <div className={cn("py-2", containerClassName)}>
      <div
        className={cn(
          "group/issue-type hover:bg-layer-1/60 rounded-md",
          {
            "bg-layer-1/60": isOpen,
          },
          getClassName?.(isOpen)
        )}
      >
        <Collapsible key={epicId} open={isOpen} defaultOpen onOpenChange={setIsOpen} className={cn("p-2")}>
          <CollapsibleTrigger className={cn("flex w-full py-2 gap-2 items-center justify-between")}>
            <div className={cn("flex items-center w-full px-2 gap-2 cursor-pointer")}>
              <div className={cn("flex w-full gap-2 items-center truncate")}>
                <div className="flex-shrink-0">
                  <ChevronRightIcon
                    className={cn("flex-shrink-0 size-4 transition-all", {
                      "rotate-90 text-primary": isOpen,
                      "text-tertiary": !isOpen,
                    })}
                  />
                </div>
                <div className="flex flex-col items-start justify-start whitespace-normal">
                  <div className="flex gap-4 text-left items-center">
                    <div className="text-13 text-primary font-medium line-clamp-1">
                      {t("project_settings.epics.properties.title")}
                    </div>
                    {!epicDetail?.is_active && (
                      <div className="py-0.5 px-3 text-11 rounded-sm font-medium text-tertiary bg-layer-1/70">
                        {t("project_settings.epics.disabled")}
                      </div>
                    )}
                  </div>
                  <div className="text-13 text-tertiary text-left line-clamp-1">
                    {t("project_settings.epics.properties.description")}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-2">
              <IssuePropertiesRoot
                issueTypeId={epicId}
                propertiesLoader={propertiesLoader}
                getWorkItemTypeById={getWorkItemTypeById}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
});
