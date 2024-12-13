"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
// components
import useSWR from "swr";
import { useProjectAttachments } from "@/plane-web/hooks/store/projects/use-project-attachments";
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
  const { fetchAttachments } = useProjectAttachments();
  // api calls
  useSWR(
    projectId && workspaceSlug ? `PROJECT_ATTACHMENTS_${projectId}` : null,
    projectId && workspaceSlug ? () => fetchAttachments(workspaceSlug, projectId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  return (
    <div className="relative py-3 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <ProjectAttachmentsList projectId={projectId} disabled={disabled} attachmentHelpers={attachmentHelpers} />
      </div>
    </div>
  );
});
