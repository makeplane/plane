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
import { Button } from "@plane/propel/button";
import { LinkIcon } from "@plane/propel/icons";
import { ProjectAttachmentActionButton } from "../collaspible-section/attachment/quick-action-button";

type TProps = {
  toggleLinkModalOpen: (open: boolean) => void;
  workspaceSlug: string;
  projectId: string;
};
export function Actions(props: TProps) {
  const { toggleLinkModalOpen, workspaceSlug, projectId } = props;
  return (
    <div className="text-14 font-medium flex gap-4 text-secondary my-auto">
      <Button variant="ghost" size="lg" onClick={() => toggleLinkModalOpen(true)}>
        <LinkIcon className="flex-shrink-0 size-3.5" />
        <span className="text-body-xs-medium">Add link</span>
      </Button>
      <ProjectAttachmentActionButton
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        customButton={
          <Button variant="ghost" size="lg">
            <Paperclip className="flex-shrink-0 size-3.5" />
            <span className="text-body-xs-medium">Attach</span>
          </Button>
        }
      />
    </div>
  );
}
