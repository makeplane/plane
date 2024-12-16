"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { ProjectAttachmentsList } from "./attachments-list";
import { useAttachmentOperations } from "./use-attachments";

export type TProjectAttachmentRoot = {
  workspaceSlug: string;
  projectId: string;
  disabled?: boolean;
};

export const ProjectAttachmentRoot: FC<TProjectAttachmentRoot> = observer((props) => {
  // props
  const { workspaceSlug, projectId, disabled = false } = props;
  // hooks
  const attachmentHelpers = useAttachmentOperations(workspaceSlug, projectId);

  return (
    <div className="relative py-3 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <ProjectAttachmentsList projectId={projectId} disabled={disabled} attachmentHelpers={attachmentHelpers} />
      </div>
    </div>
  );
});
