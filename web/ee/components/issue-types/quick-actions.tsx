"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IIssueType } from "@plane/types";
import { setPromiseToast, ToggleSwitch, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  issueTypeId: string;
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  onEditIssueTypeIdChange: (issueTypeId: string) => void;
};

export const IssueTypeQuickActions: React.FC<Props> = observer((props) => {
  const { issueTypeId, getWorkItemTypeById, onEditIssueTypeIdChange } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const issueType = getWorkItemTypeById(issueTypeId);
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
      loading: t("work_item_types.enable_disable.toast.loading", {
        action: isIssueTypeEnabled ? t("common.disabling") : t("common.enabling"),
        name: issueTypeDetail?.name,
      }),
      success: {
        title: t("work_item_types.enable_disable.toast.success.title"),
        message: () =>
          t("work_item_types.enable_disable.toast.success.message", {
            name: issueTypeDetail?.name,
            action: isIssueTypeEnabled ? t("common.disabled") : t("common.enabled"),
          }),
      },
      error: {
        title: t("work_item_types.enable_disable.toast.error.title"),
        message: () =>
          t("work_item_types.enable_disable.toast.error.message", {
            name: issueTypeDetail?.name,
            action: isIssueTypeEnabled ? t("common.disabled") : t("common.enabled"),
          }),
      },
    });
    await updateIssueTypePromise.finally(() => {
      setIsLoading(false);
    });
  };

  if (!issueTypeDetail) return null;

  return (
    <>
      <div className={cn("flex items-center justify-center px-2")}>
        <div className="w-6">
          <Tooltip className="w-full shadow" tooltipContent={t("common.actions.edit")} position="bottom">
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
              <Pencil size={16} className="text-custom-text-300" />
            </button>
          </Tooltip>
        </div>
        {!issueTypeDetail?.is_default && (
          <Tooltip
            className="shadow"
            tooltipContent={t("work_item_types.enable_disable.tooltip", {
              action: isIssueTypeEnabled ? t("common.actions.disable") : t("common.actions.enable"),
            })}
            position="bottom"
          >
            <div className="w-12">
              <ToggleSwitch value={!!isIssueTypeEnabled} onChange={handleEnableDisable} disabled={isLoading} />
            </div>
          </Tooltip>
        )}
      </div>
    </>
  );
});
