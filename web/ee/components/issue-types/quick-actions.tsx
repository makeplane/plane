"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil } from "lucide-react";
// ui
import { setPromiseToast, ToggleSwitch, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";

type Props = {
  issueTypeId: string;
  onEditIssueTypeIdChange: (issueTypeId: string) => void;
};

export const IssueTypeQuickActions: React.FC<Props> = observer((props) => {
  const { issueTypeId, onEditIssueTypeIdChange } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
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
      <div className={cn("flex items-center justify-center gap-1 px-2")}>
        <div className="w-12">
          <ToggleSwitch value={!!isIssueTypeEnabled} onChange={handleEnableDisable} disabled={isLoading} />
        </div>
        <div className="w-6">
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
                onEditIssueTypeIdChange(issueTypeId);
              }}
              disabled={isLoading}
            >
              <Pencil size={14} className="text-custom-text-300" />
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );
});
