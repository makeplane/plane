import { useState } from "react";
import { observer } from "mobx-react";
import { Check, Pencil, Trash2, X } from "lucide-react";
// ui
import { AlertModalCore, Spinner, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web types
import { TOperationMode } from "@/plane-web/types";

type TIssuePropertyQuickActions = {
  currentOperationMode: TOperationMode | null;
  isSubmitting: boolean;
  handleCreateUpdate: () => Promise<void>;
  handleDiscard: () => void;
  handleDelete: () => Promise<void>;
  handleIssuePropertyOperationMode: (mode: TOperationMode) => void;
};

export const IssuePropertyQuickActions = observer((props: TIssuePropertyQuickActions) => {
  const {
    currentOperationMode,
    isSubmitting,
    handleCreateUpdate,
    handleDiscard,
    handleDelete,
    handleIssuePropertyOperationMode,
  } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleDeleteIssueProperty = async () => {
    setIsDeleteLoading(true);
    await handleDelete().finally(() => {
      setIsDeleteLoading(false);
    });
  };

  return (
    <>
      <AlertModalCore
        isOpen={isDeleteModalOpen}
        handleClose={() => setIsDeleteModalOpen(false)}
        handleSubmit={handleDeleteIssueProperty}
        isSubmitting={isDeleteLoading}
        title="Delete this property"
        content={
          <>
            <p>Deletion of properties may lead to loss of existing data or weird behavior.</p>
            <p>Do you want to disable the property instead?</p>
          </>
        }
      />
      <div
        className={cn("items-center justify-center gap-1.5", {
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
                onClick={handleCreateUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner width="12px" height="12px" /> : <Check size={12} className="text-green-600" />}
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
                onClick={handleDiscard}
                disabled={isSubmitting}
              >
                <X size={12} className="text-red-500" />
              </button>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip className="w-full shadow" tooltipContent="Edit" position="bottom">
              <button
                className="p-1 border-[0.5px] border-custom-border-300 rounded bg-custom-background-100 hover:bg-custom-background-90"
                onClick={() => handleIssuePropertyOperationMode("update")}
              >
                <Pencil size={12} className="text-custom-text-300" />
              </button>
            </Tooltip>
            <Tooltip className="w-full shadow" tooltipContent="Delete" position="bottom">
              <button
                className="p-1 border-[0.5px] border-custom-border-300 rounded bg-custom-background-100 hover:bg-custom-background-90"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 size={12} className="text-red-500" />
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </>
  );
});
