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

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { observer } from "mobx-react";
import { useState } from "react";
// store
import type { TCustomerRequestPermissions } from "@/store/customers/permissions/root";
// local imports
import { RequestAttachmentCollapsibleTitle } from "./collapsible-title";
import { RequestAttachmentsCollapsibleContent } from "./content";

type TProps = {
  workspaceSlug: string;
  requestId: string;
  customerId: string;
  permissions: TCustomerRequestPermissions;
};

export const RequestAttachmentsCollapsible = observer(function RequestAttachmentsCollapsible(props: TProps) {
  const { workspaceSlug, requestId, customerId, permissions } = props;
  // states
  const [isOpen, setOpen] = useState<boolean>(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex justify-between items-center w-full">
        <RequestAttachmentCollapsibleTitle
          workspaceSlug={workspaceSlug}
          requestId={requestId}
          customerId={customerId}
          isOpen={isOpen}
          disabled={!permissions.canAddAttachment}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <RequestAttachmentsCollapsibleContent
          workspaceSlug={workspaceSlug}
          requestId={requestId}
          customerId={customerId}
          permissions={{
            canAddAttachment: permissions.canAddAttachment,
            canDeleteAttachment: permissions.canDeleteAttachment,
          }}
        />
      </CollapsibleContent>
    </Collapsible>
  );
});
