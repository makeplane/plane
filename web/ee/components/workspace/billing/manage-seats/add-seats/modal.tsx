"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { TAddWorkspaceSeatsModal } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// local imports
import { AddSeatsForm } from "./form";

type TAddSeatsModalProps = {
  data: TAddWorkspaceSeatsModal;
  onClose: () => void;
};

export const AddSeatsModal: React.FC<TAddSeatsModalProps> = observer((props) => {
  const { data, onClose } = props;
  const { isOpen } = data;

  if (!isOpen) return null;
  return (
    <ModalCore
      isOpen={isOpen}
      position={EModalPosition.TOP}
      width={EModalWidth.XXL}
      className="transition-all duration-300 ease-in-out"
    >
      <AddSeatsForm onClose={onClose} />
    </ModalCore>
  );
});
