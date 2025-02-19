import React from "react";
import { Button, EModalWidth, ModalCore } from "@plane/ui";

interface Props {
  handleStartCycle: () => void;
  isOpen: boolean;
  handleClose: () => void;
  loading: boolean;
}

export const StartCycleModal: React.FC<Props> = (props) => {
  const { isOpen, handleClose, handleStartCycle, loading } = props;
  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.MD}>
      <div className="p-4">
        <h3 className="text-lg font-medium">Sure you want to start this cycle?</h3>
        {/* <p className="text-sm text-custom-text-300 mt-1"></p> */}
        <div className="mt-2 pt-2 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!!loading} onClick={handleStartCycle}>
            {loading ? "Starting..." : "Start Cycle"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
};
