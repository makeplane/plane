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

import { useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";
// plane imports
import { IconButton } from "@plane/propel/icon-button";
import { Menu } from "@plane/propel/menu";
// helpers
import { ChatDeleteModal } from "../modals/delete-modal";

type Props = {
  workspaceSlug: string;
  chatId: string;
  initPiChat: () => void;
};

export const AiSidecarQuickActions = observer(function AiSidecarQuickActions(props: Props) {
  const { workspaceSlug, chatId, initPiChat } = props;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const chatLink = `${workspaceSlug}/projects/ai-chat/${chatId}`;

  const handleOpenInNewTab = () => window.open(`/${chatLink}`, "_blank");

  return (
    <>
      <ChatDeleteModal
        chatId={chatId}
        workspaceSlug={workspaceSlug}
        isOpen={isDeleteModalOpen}
        handleClose={() => setIsDeleteModalOpen(false)}
        onDelete={() => {
          initPiChat();
        }}
      />
      <Menu
        customButton={<IconButton variant="tertiary" size="lg" icon={MoreHorizontal} className="bg-layer-1" />}
        optionsClassName="p-1"
      >
        <Menu.MenuItem onClick={handleOpenInNewTab} className="flex items-center gap-2">
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
          <span>Open in a new tab</span>
        </Menu.MenuItem>
        {chatId && (
          <Menu.MenuItem onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-2 text-danger">
            <Trash2 className="h-3 w-3 flex-shrink-0" />
            <span>Delete chat</span>
          </Menu.MenuItem>
        )}
      </Menu>
    </>
  );
});
