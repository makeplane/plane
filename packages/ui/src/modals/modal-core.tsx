import React from "react";
// ui
import { Dialog } from "../dialog";
// helpers
import { cn } from "../utils";
// constants
import { EModalPosition, EModalWidth } from "./constants";

type Props = {
  children: React.ReactNode;
  handleClose?: () => void;
  isOpen: boolean;
  position?: EModalPosition;
  width?: EModalWidth;
  className?: string;
};
export const ModalCore: React.FC<Props> = (props) => {
  const { children, handleClose, isOpen, width = EModalWidth.XXL, className = "" } = props;

  return (
    <Dialog open={isOpen} onOpenChange={() => handleClose && handleClose()}>
      <Dialog.Panel className={cn(width, className)}>{children}</Dialog.Panel>
    </Dialog>
  );
};
