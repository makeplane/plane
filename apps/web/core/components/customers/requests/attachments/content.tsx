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
import { RequestAttachmentsList } from "@/components/customers";

type Props = {
  workspaceSlug: string;
  requestId: string;
  customerId: string;
  disabled: boolean;
};

export const RequestAttachmentsCollapsibleContent = observer(function RequestAttachmentsCollapsibleContent(
  props: Props
) {
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
