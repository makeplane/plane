import React from "react";
import { ChevronLeft } from "lucide-react";
// plane imports
import { Button } from "@plane/ui";
import { cn } from "@plane/utils";

type TModalFooterProps = {
  onPreviousStep?: () => void;
  onClose: () => void;
  onNext: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loading: boolean;
  loadingText: string;
  nextButtonText: string;
};

export const ModalFooter: React.FC<TModalFooterProps> = (props) => {
  const { onPreviousStep, onClose, onNext, loading, loadingText, nextButtonText } = props;

  return (
    <div
      className={cn("p-5 flex items-center justify-end gap-2 border-t border-custom-border-200", {
        "justify-between": onPreviousStep,
      })}
    >
      {onPreviousStep && (
        <Button variant="link-neutral" size="sm" className="flex gap-1" onClick={onPreviousStep}>
          <ChevronLeft className="size-3.5" />
          Go back
        </Button>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button variant="neutral-primary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onNext} loading={loading}>
          {loading ? loadingText : nextButtonText}
        </Button>
      </div>
    </div>
  );
};
