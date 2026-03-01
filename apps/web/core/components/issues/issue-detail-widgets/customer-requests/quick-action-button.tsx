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
import React from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "@plane/propel/icons";
import { CustomerRequestSearch } from "@/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
};

export const CustomerRequestActionButton = observer(function CustomerRequestActionButton(props: TProps) {
  const { disabled, workItemId } = props;

  const { createUpdateRequestModalId, toggleCreateUpdateRequestModal } = useCustomers();

  const handleOpenRequestForm = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!createUpdateRequestModalId) toggleCreateUpdateRequestModal(workItemId);
  };

  return (
    <div className="flex gap-2 items-center">
      <CustomerRequestSearch isWorkItemLevel />
      {/* Add new request to customer */}
      {!disabled && (
        <div onClick={handleOpenRequestForm}>
          <PlusIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
});
