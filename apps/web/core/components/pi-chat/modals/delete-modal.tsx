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
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";

interface IChatDelete {
  chatId: string;
  workspaceSlug: string;
  chatTitle?: string;
  isOpen: boolean;
  handleClose: () => void;
  onDelete: () => void;
}

export const ChatDeleteModal = observer(function ChatDeleteModal(props: IChatDelete) {
  const { chatId, workspaceSlug, isOpen, chatTitle, handleClose, onDelete } = props;

  // states
  const [loader, setLoader] = useState(false);
  // hooks
  const { deleteChat } = usePiChat();

  const formSubmit = async () => {
    setLoader(true);
    try {
      await deleteChat(chatId, workspaceSlug);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Chat deleted successfully.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Warning!",
        message: "Something went wrong please try again later.",
      });
    }
    onDelete();
    setLoader(false);
    handleClose();
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={formSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title="Delete chat"
      content={
        <>
          Are you sure you want to delete the chat
          <span className="break-words font-medium text-primary">{chatTitle}</span>? All of the data related to the chat
          will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
