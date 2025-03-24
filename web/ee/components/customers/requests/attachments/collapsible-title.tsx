"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// plane ui
import { DropdownIcon } from "@plane/ui";
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

export const RequestAttachmentCollapsibleTitle: FC<Props> = observer((props) => {
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
          className={cn("size-2 text-custom-text-200 hover:text-custom-text-200 duration-300", {
            "-rotate-90": !isOpen,
          })}
        />
        <div className="text-sm text-custom-text-300 font-medium">
          {t("common.attachments")} <span className="text-custom-text-400 text-sm">{requestAttachmentsCount}</span>
        </div>
      </div>
      {!disabled && (
        <AddAttachmentButton
          requestId={requestId}
          workspaceSlug={workspaceSlug}
          customerId={customerId}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </AddAttachmentButton>
      )}
    </>
  );
});
