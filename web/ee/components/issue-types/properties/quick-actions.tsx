import { useState } from "react";
import { observer } from "mobx-react";
import { Check, Pencil, Trash2, X } from "lucide-react";
// ui
import { Spinner, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { DeleteConfirmationModal } from "@/plane-web/components/issue-types";
// plane web types
import { TOperationMode } from "@/plane-web/types";

type TIssuePropertyQuickActions = {
  currentOperationMode: TOperationMode | null;
  isSubmitting: boolean;
  onCreateUpdate: () => Promise<void>;
  onDiscard: () => void;
  onDisable: () => Promise<void>;
  onDelete: () => Promise<void>;
  onIssuePropertyOperationMode: (mode: TOperationMode) => void;
};

export const IssuePropertyQuickActions = observer((props: TIssuePropertyQuickActions) => {
  const {
    currentOperationMode,
    isSubmitting,
    onCreateUpdate,
    onDiscard,
    onDisable,
    onDelete,
    onIssuePropertyOperationMode,
  } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDisable={onDisable}
        onDelete={onDelete}
      />
      <div
        className={cn("items-center justify-end gap-1.5", {
          "hidden group-hover:flex": !currentOperationMode,
          flex: currentOperationMode,
        })}
      >
        {currentOperationMode ? (
          <>
            <Tooltip className="w-full shadow" tooltipContent="Confirm" position="bottom">
              <button
                className={cn(
                  "p-1 border-[0.5px] border-custom-border-300 rounded bg-custom-background-100 hover:bg-custom-background-90"
                )}
                onClick={onCreateUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner width="16px" height="16px" /> : <Check size={16} className="text-green-600" />}
              </button>
            </Tooltip>
            <Tooltip className="w-full shadow" tooltipContent="Discard" position="bottom">
              <button
                className={cn(
                  "p-1 border-[0.5px] border-custom-border-300 rounded bg-custom-background-100 hover:bg-custom-background-90",
                  {
                    "bg-custom-background-80": isSubmitting,
                  }
                )}
                onClick={onDiscard}
                disabled={isSubmitting}
              >
                <X size={16} className="text-red-500" />
              </button>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip className="w-full shadow" tooltipContent="Edit" position="bottom">
              <button
                className="p-1 border-[0.5px] border-custom-border-300 rounded bg-custom-background-100 hover:bg-custom-background-90"
                onClick={() => onIssuePropertyOperationMode("update")}
              >
                <Pencil size={16} className="text-custom-text-300" />
              </button>
            </Tooltip>
            <Tooltip className="w-full shadow" tooltipContent="Delete" position="bottom">
              <button
                className="p-1 border-[0.5px] border-custom-border-300 rounded bg-custom-background-100 hover:bg-custom-background-90"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </>
  );
});
