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
import { useTranslation } from "@plane/i18n";
// plane ui
import { DropdownIcon, PlusIcon } from "@plane/propel/icons";
// plane web hooks
import { cn } from "@plane/utils";
import { useCustomers } from "@/plane-web/hooks/store";
// helpers
import { AddAttachmentButton } from "./add-attachment-btn";

type Props = {
  workspaceSlug: string;
  requestId: string;
  customerId: string;
  isOpen: boolean;
  disabled?: boolean;
};

export const RequestAttachmentCollapsibleTitle = observer(function RequestAttachmentCollapsibleTitle(props: Props) {
  const { workspaceSlug, requestId, isOpen, customerId, disabled = true } = props;
  // store hooks
  const { getRequestById } = useCustomers();

  // derived values
  const request = getRequestById(requestId);
  const requestAttachmentsCount = request?.attachment_count || 0;

  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownIcon
          className={cn("size-2 text-secondary hover:text-secondary duration-300", {
            "-rotate-90": !isOpen,
          })}
        />
        <div className="text-12 text-tertiary font-medium">
          {t("common.attachments")} <span className="text-placeholder text-12">{requestAttachmentsCount}</span>
        </div>
      </div>
      {!disabled && (
        <AddAttachmentButton
          requestId={requestId}
          workspaceSlug={workspaceSlug}
          customerId={customerId}
          disabled={disabled}
        >
          <PlusIcon className="h-4 w-4" />
        </AddAttachmentButton>
      )}
    </>
  );
});
