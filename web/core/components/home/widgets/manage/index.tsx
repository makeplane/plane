"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane types
// plane ui
import { EModalWidth, ModalCore } from "@plane/ui";
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
      </div>
    </ModalCore>
  );
});
