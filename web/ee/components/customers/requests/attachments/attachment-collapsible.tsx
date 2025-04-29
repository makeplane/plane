import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { Collapsible } from "@plane/ui";
import { RequestAttachmentsCollapsibleContent } from "@/plane-web/components/customers";
import { RequestAttachmentCollapsibleTitle } from "./collapsible-title";

type TProps = {
  workspaceSlug: string;
  requestId: string;
  customerId: string;
  isEditable?: boolean;
};

export const RequestAttachmentsCollapsible: FC<TProps> = observer((props) => {
  const { workspaceSlug, requestId, customerId, isEditable } = props;
  // states
  const [isOpen, setOpen] = useState<boolean>(false);

  return (
    <Collapsible
      title={
        <RequestAttachmentCollapsibleTitle
          workspaceSlug={workspaceSlug}
          requestId={requestId}
          customerId={customerId}
          isOpen={isOpen}
          disabled={!isEditable}
        />
      }
      buttonClassName="flex justify-between items-center w-full"
      isOpen={isOpen}
      onToggle={() => setOpen(!isOpen)}
    >
      <RequestAttachmentsCollapsibleContent
        workspaceSlug={workspaceSlug}
        requestId={requestId}
        customerId={customerId}
        disabled={!isEditable}
      />
    </Collapsible>
  );
});
