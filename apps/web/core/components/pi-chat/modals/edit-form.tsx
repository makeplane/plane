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

import type { FormEvent } from "react";
import { useState } from "react";
// types
import { ETabIndices } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ui
import { Input } from "@plane/ui";
import { getTabIndex } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";

type Props = {
  chatId: string;
  title: string;
  workspaceId: string | undefined;
  handleModalClose: () => void;
};

export function EditForm(props: Props) {
  const { chatId, title, handleModalClose, workspaceId } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { renameChat } = usePiChat();
  // state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_PAGE, isMobile);

  const handleEditFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await renameChat(chatId, newTitle, workspaceId);
      setIsSubmitting(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Chat renamed successfully.",
      });
    } catch {
      setIsSubmitting(false);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong please try again later.",
      });
    }
    handleModalClose();
  };

  const isTitleLengthMoreThan255Character = title ? title.length > 255 : false;

  return (
    <form onSubmit={handleEditFormSubmit}>
      <div className="space-y-5 p-5">
        <h3 className="text-14 font-semibold text-tertiary">Rename chat</h3>
        <div className="flex items-start gap-2 h-9 w-full">
          <div className="space-y-1 flew-grow w-full">
            <Input
              id="name"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title"
              className="w-full resize-none text-14 font-medium text-secondary"
              tabIndex={getIndex("title")}
              required
              autoFocus
            />
            {isTitleLengthMoreThan255Character && (
              <span className="text-11 text-danger-primary">
                Max length of the name should be less than 255 characters
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle-1">
        <Button variant="secondary" onClick={handleModalClose} tabIndex={getIndex("cancel")}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          loading={isSubmitting}
          disabled={isTitleLengthMoreThan255Character}
          tabIndex={getIndex("submit")}
        >
          {isSubmitting ? "Saving" : "Save"}
        </Button>
      </div>
    </form>
  );
}
