"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil } from "lucide-react";
// ui
import { setPromiseToast, ToggleSwitch, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { UpdateIssueTypeModal } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";

type Props = {
  issueTypeId: string;
};

export const IssueTypeQuickActions: React.FC<Props> = observer((props) => {
  const { issueTypeId } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateUpdateModalOpen, setIsCreateUpdateModalOpen] = useState<boolean>(false);
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const issueTypeDetail = issueType?.asJSON;
  const isIssueTypeEnabled = issueType?.is_active;

  const handleEnableDisable = async () => {
    if (!issueTypeId) return;
    setIsLoading(true);
    const updateIssueTypePromise = issueType?.updateType({
      is_active: !isIssueTypeEnabled,
    });
    if (!updateIssueTypePromise) return;
    setPromiseToast(updateIssueTypePromise, {
      loading: `${isIssueTypeEnabled ? "Disabling" : "Enabling"} ${issueTypeDetail?.name} issue type`,
      success: {
        title: "Success!",
        message: () =>
          `${issueTypeDetail?.name} issue type ${isIssueTypeEnabled ? "disabled" : "enabled"} successfully.`,
      },
      error: {
        title: "Error!",
        message: () =>
          `${issueTypeDetail?.name} issue type could not be ${isIssueTypeEnabled ? "disabled" : "enabled"}. Please try again.`,
      },
    });
    await updateIssueTypePromise.finally(() => {
      setIsLoading(false);
    });
  };

  if (!issueTypeDetail) return null;

  return (
    <>
      <UpdateIssueTypeModal
        data={issueTypeDetail}
        isModalOpen={isCreateUpdateModalOpen}
        handleModalClose={() => setIsCreateUpdateModalOpen(false)}
      />
      <div className={cn("flex items-center justify-center gap-3")}>
        {issueType?.is_active && (
          <Tooltip className="w-full shadow" tooltipContent="Edit" position="bottom">
            <button
              className={cn(
                "p-1 border-[0.5px] border-custom-border-300 rounded bg-custom-background-100 hover:bg-custom-background-90 hidden group-hover/issue-type:block",
                {
                  "bg-custom-background-80 cursor-not-allowed": isLoading,
                }
              )}
              onClick={(e) => {
                e.preventDefault();
                setIsCreateUpdateModalOpen(true);
              }}
              disabled={isLoading}
            >
              <Pencil size={14} className="text-custom-text-300" />
            </button>
          </Tooltip>
        )}
        <ToggleSwitch value={!!isIssueTypeEnabled} onChange={handleEnableDisable} disabled={isLoading} />
      </div>
    </>
  );
});
