"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane types
// plane ui
import { Button, EModalWidth, ModalCore } from "@plane/ui";
import { WidgetList } from "./widget-list";

export type TProps = {
  workspaceSlug: string;
  isModalOpen: boolean;
  handleOnClose?: () => void;
};

export const ManageWidgetsModal: FC<TProps> = observer((props) => {
  // props
  const { workspaceSlug, isModalOpen, handleOnClose } = props;

  return (
    <ModalCore isOpen={isModalOpen} handleClose={handleOnClose} width={EModalWidth.MD}>
      <div className="p-4">
        <div className="font-medium text-xl">Manage widgets</div>
        <WidgetList workspaceSlug={workspaceSlug} />
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
          <Button variant="neutral-primary" size="md" onClick={handleOnClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit">
            Save changes
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
