"use client";

import React, { FC, useState } from "react";
import { observer } from "mobx-react";
// Plane
import { Collapsible } from "@plane/ui";
import { InitiativeAttachmentsCollapsibleTitle } from "./attachments-collapsible-title";
import { InitiativeAttachmentRoot } from "./root";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const AttachmentsCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // store hooks
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={() => setIsOpen((prevState) => !prevState)}
      title={
        <InitiativeAttachmentsCollapsibleTitle
          isOpen={isOpen}
          workspaceSlug={workspaceSlug}
          initiativeId={initiativeId}
          disabled={disabled}
        />
      }
      buttonClassName="w-full"
    >
      <InitiativeAttachmentRoot workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={disabled} />
    </Collapsible>
  );
});
