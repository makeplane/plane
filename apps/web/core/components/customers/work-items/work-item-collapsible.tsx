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

import type { FC } from "react";
import React, { useState } from "react";
import { observer } from "mobx-react";
import { PlusIcon, DropdownIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { cn } from "@plane/utils";
import { CustomerWorkItem } from "@/components/customers";

type TProps = {
  workspaceSlug: string;
  openWorkItemModal: () => void;
  workItemIds: string[];
  customerId: string;
  requestId: string;
  isEditable?: boolean;
};

export const RequestWorkItemsListCollapsible = observer(function RequestWorkItemsListCollapsible(props: TProps) {
  const { workItemIds, workspaceSlug, openWorkItemModal, customerId, requestId, isEditable } = props;
  // i18n
  const { t } = useTranslation();
  // states
  const [isOpen, setOpen] = useState<boolean>(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <DropdownIcon
            className={cn("size-2 text-secondary hover:text-secondary duration-300", {
              "-rotate-90": !isOpen,
            })}
          />
          <div className="text-12 text-tertiary font-medium">
            {t("customers.linked_work_items.label")}{" "}
            <span className="text-placeholder text-12">{workItemIds.length}</span>
          </div>
        </div>
        {isEditable && (
          <div
            className="text-primary"
            onClick={(e) => {
              e.stopPropagation();
              openWorkItemModal();
            }}
          >
            <PlusIcon className="size-4" />
          </div>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {workItemIds?.map((id) => (
          <CustomerWorkItem
            key={id}
            workspaceSlug={workspaceSlug}
            workItemId={id}
            customerId={customerId}
            requestId={requestId}
            isEditable={isEditable}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
});
