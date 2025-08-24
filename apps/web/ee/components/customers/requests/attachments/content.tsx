"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { RequestAttachmentsList } from "@/plane-web/components/customers";

type Props = {
  workspaceSlug: string;
  requestId: string;
  customerId: string;
  disabled: boolean;
};

export const RequestAttachmentsCollapsibleContent: FC<Props> = observer((props) => {
  const { workspaceSlug, requestId, disabled, customerId } = props;
  return (
    <RequestAttachmentsList
      workspaceSlug={workspaceSlug}
      requestId={requestId}
      disabled={disabled}
      customerId={customerId}
      isCollapsible
    />
  );
});
