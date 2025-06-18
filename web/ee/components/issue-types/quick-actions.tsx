"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IIssueType } from "@plane/types";
import { CustomMenu, setPromiseToast, TContextMenuItem, ToggleSwitch, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  issueTypeId: string;
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  onEditIssueTypeIdChange: (issueTypeId: string) => void;
  onDeleteIssueTypeIdChange: (issueTypeId: string) => void;
  onEnableDisableIssueType: (issueTypeId: string) => Promise<void>;
};

export const IssueTypeQuickActions: React.FC<Props> = observer((props) => {
  const {
    issueTypeId,
    getWorkItemTypeById,
    onEditIssueTypeIdChange,
    onDeleteIssueTypeIdChange,
    onEnableDisableIssueType,
  } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const issueType = getWorkItemTypeById(issueTypeId);
  // derived values
  const issueTypeDetail = issueType?.asJSON;
  const isIssueTypeEnabled = issueType?.is_active;

  const MENU_ITEMS: (TContextMenuItem & { tooltipContent?: string })[] = [
    {
      key: "edit",
      action: () => onEditIssueTypeIdChange(issueTypeId),
      title: t("common.actions.edit"),
      icon: Pencil,
      disabled: issueTypeDetail?.issue_exists,
    },
    {
      key: "delete",
      action: () => onDeleteIssueTypeIdChange(issueTypeId),
      title: t("common.actions.delete"),
      disabled: issueTypeDetail?.issue_exists,
      tooltipContent: issueTypeDetail?.issue_exists
        ? t("work_item_types.settings.cant_delete_linked_message")
        : undefined,
      icon: Trash2,
    },
  ];

  const handleEnableDisable = async () => {
    if (!issueTypeId || !issueTypeDetail) return;
    setIsLoading(true);
    const updateIssueTypePromise = onEnableDisableIssueType(issueTypeId);

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
        {!issueTypeDetail?.is_default && (
          <Tooltip
            className="shadow"
            tooltipContent={t("work_item_types.enable_disable.tooltip", {
              action: isIssueTypeEnabled ? t("common.actions.disable") : t("common.actions.enable"),
            })}
            position="bottom"
          >
            <div className="ml-2 grid place-items-center">
              <ToggleSwitch value={!!isIssueTypeEnabled} onChange={handleEnableDisable} disabled={isLoading} />
            </div>
          </Tooltip>
        )}
        <CustomMenu
          placement="bottom-end"
          menuItemsClassName="z-20"
          buttonClassName="!p-0.5 text-2xl"
          closeOnSelect
          ellipsis
          className="ml-2"
          chevronClassName="h-4 w-4"
        >
          {MENU_ITEMS.map((item) => (
            <Tooltip key={item.key} tooltipContent={item.tooltipContent} position="right" disabled={!item.tooltipContent}>
              <span>
                <CustomMenu.MenuItem
                  key={item.key}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.action();
                  }}
                  className={cn("flex items-center gap-2")}
                  disabled={item.disabled}
                >
                  {item.icon && <item.icon className={cn("h-3 w-3")} />}
                  <div>
                    <h5>{item.title}</h5>
                  </div>
                </CustomMenu.MenuItem>
              </span>
            </Tooltip>
          ))}
        </CustomMenu>
      </div>
    </>
  );
});
