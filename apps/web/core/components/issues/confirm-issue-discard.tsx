import { useState } from "react";
// ui
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onDiscard: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmIssueDiscard(props: Props) {
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
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          <div className="mt-3 text-center sm:mt-0 sm:text-left">
            <h3 className="text-16 font-medium leading-6 text-primary">Save this draft?</h3>
            <div className="mt-2">
              <p className="text-13 text-secondary">
                You can save this work item to Drafts so you can come back to it later.{" "}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between gap-2 p-4 sm:px-6">
        <div>
          <Button variant="secondary" onClick={onDiscard}>
            Discard
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDeletion} loading={isLoading}>
            {isLoading ? "Saving" : "Save to Drafts"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
