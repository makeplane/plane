"use client";
import React from "react";
import { AlertCircle } from "lucide-react";
// ui
import { Button, TransferIcon } from "@plane/ui";

type Props = {
  handleClick: () => void;
  canTransferIssues?: boolean;
  disabled?: boolean;
};

export const TransferIssues: React.FC<Props> = (props) => {
  const { handleClick, canTransferIssues = false, disabled = false } = props;
  return (
    <div className="-mt-2 mb-4 flex items-center justify-between px-4 pt-6">
      <div className="flex items-center gap-2 text-sm text-custom-text-200">
        <AlertCircle className="h-3.5 w-3.5 text-custom-text-200" />
        <span>Completed cycles are not editable.</span>
      </div>

      {canTransferIssues && (
        <div>
          <Button
            variant="primary"
            prependIcon={<TransferIcon color="white" />}
            onClick={handleClick}
            disabled={disabled}
          >
            Transfer Issues
          </Button>
        </div>
      )}
    </div>
  );
};
