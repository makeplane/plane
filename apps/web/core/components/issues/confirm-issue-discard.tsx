"use client";

import React, { useState } from "react";
// ui
import { Button, Dialog, EModalWidth } from "@plane/ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onDiscard: () => void;
  onConfirm: () => Promise<void>;
};

export const ConfirmIssueDiscard: React.FC<Props> = (props) => {
  const { isOpen, handleClose, onDiscard, onConfirm } = props;

  const [isLoading, setIsLoading] = useState(false);

  const onClose = () => {
    handleClose();
    setIsLoading(false);
  };

  const handleDeletion = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Panel width={EModalWidth.XXL}>
        <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <Dialog.Title className="text-lg font-medium leading-6 text-custom-text-100">
                Save this draft?
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-custom-text-200">
                  You can save this work item to Drafts so you can come back to it later.{" "}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-2 p-4 sm:px-6">
          <div>
            <Button variant="neutral-primary" size="sm" onClick={onDiscard}>
              Discard
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleDeletion} loading={isLoading}>
              {isLoading ? "Saving" : "Save to Drafts"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};
