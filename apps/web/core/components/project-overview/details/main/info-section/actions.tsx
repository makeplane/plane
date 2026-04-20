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

import { Paperclip } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { LinkIcon } from "@plane/propel/icons";
// hooks
import { useProject } from "@/hooks/store/use-project";
// local imports
import { ProjectAttachmentActionButton } from "../collaspible-section/attachment/quick-action-button";

type TProps = {
  toggleLinkModalOpen: (open: boolean) => void;
  workspaceSlug: string;
  projectId: string;
};
export const Actions = observer(function Actions(props: TProps) {
  const { toggleLinkModalOpen, workspaceSlug, projectId } = props;
  // store hooks
  const { permissions: projectPermissions } = useProject();
  // auth
  const canEdit = projectPermissions.getCanEdit(workspaceSlug, projectId);

  return (
    <div className="text-14 font-medium flex gap-4 text-secondary my-auto">
      {canEdit && (
        <Button
          variant="ghost"
          size="lg"
          onClick={() => toggleLinkModalOpen(true)}
          prependIcon={<LinkIcon className="shrink-0 size-3.5" />}
        >
          Add link
        </Button>
      )}
      {canEdit && (
        <ProjectAttachmentActionButton
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          customButton={
            <Button variant="ghost" size="lg" prependIcon={<Paperclip className="shrink-0 size-3.5" />}>
              Attach
            </Button>
          }
        />
      )}
    </div>
  );
});
