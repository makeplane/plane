"use client";

import { FormEvent, useState } from "react";
// types
import { ETabIndices } from "@plane/constants";
// ui
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";
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

export const EditForm: React.FC<Props> = (props) => {
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
        <h3 className="text-base font-semibold text-custom-text-300">Rename chat</h3>
        <div className="flex items-start gap-2 h-9 w-full">
          <div className="space-y-1 flew-grow w-full">
            <Input
              id="name"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title"
              className="w-full resize-none text-base font-medium text-custom-text-200"
              tabIndex={getIndex("title")}
              required
              autoFocus
            />
            {isTitleLengthMoreThan255Character && (
              <span className="text-xs text-red-500">Max length of the name should be less than 255 characters</span>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleModalClose} tabIndex={getIndex("cancel")}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
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
};
