"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { AlertTriangle } from "lucide-react";
import { Button, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn  } from "@plane/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
};

export const DiscardModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, onDiscard } = props;

  return (
    <ModalCore isOpen={isOpen} handleClose={() => onClose()} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="p-4 divide-y divide-custom-border-100">
        <div className="flex gap-2 items-center mb-4">
          <span
            className={cn(
              "flex-shrink-0 grid place-items-center rounded-full size-12 sm:size-10 bg-red-500/20 text-red-100"
            )}
          >
            <AlertTriangle className="size-5 text-red-600" aria-hidden="true" />
          </span>
          <h3 className="font-medium">Discard changes?</h3>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="neutral-primary" onClick={() => onClose()} id="discard-modal-button">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onDiscard();
              onClose();
            }}
            id="discard-modal-button"
          >
            Discard
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
