"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { InitiativeAttachmentsList } from "./attachments-list";
import { useAttachmentOperations } from "./use-attachments";

export type TInitiativeAttachmentRoot = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeAttachmentRoot: FC<TInitiativeAttachmentRoot> = observer((props) => {
  // props
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // hooks
  const attachmentHelpers = useAttachmentOperations(workspaceSlug, initiativeId);

  return (
    <div className="relative py-3 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <InitiativeAttachmentsList
          initiativeId={initiativeId}
          disabled={disabled}
          attachmentHelpers={attachmentHelpers}
        />
      </div>
    </div>
  );
});
