"use client";

import { observer } from "mobx-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
import { useLayoutMenuItems } from "@/plane-web/components/common/quick-actions-helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  storeType: "PROJECT" | "EPIC";
};

export const LayoutQuickActions: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, storeType } = props;

  const layoutLink = `${workspaceSlug}/projects/${projectId}/${storeType === "EPIC" ? "epics" : "issues"}`;

  const handleCopyLink = () =>
    copyUrlToClipboard(layoutLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied",
        message: `${storeType === "EPIC" ? "Epics" : "Work items"} link copied to clipboard.`,
      });
    });

  const handleOpenInNewTab = () => window.open(`/${layoutLink}`, "_blank");

  // Use unified menu hook from plane-web (resolves to CE or EE)
  const menuResult = useLayoutMenuItems({
    workspaceSlug,
    projectId,
    storeType,
    handleCopyLink,
    handleOpenInNewTab,
  });

  // Handle both CE (array) and EE (object) return types
  const MENU_ITEMS: TContextMenuItem[] = Array.isArray(menuResult) ? menuResult : menuResult.items;
  const additionalModals = Array.isArray(menuResult) ? null : menuResult.modals;

  return (
    <>
      {additionalModals}
      <CustomMenu
        ellipsis
        placement="bottom-end"
        closeOnSelect
        maxHeight="lg"
        className="flex-shrink-0 flex items-center justify-center size-[26px] bg-custom-background-80/70 rounded"
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={item.action}
              className={cn("flex items-center gap-2", {
                "text-custom-text-400": item.disabled,
              })}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className="h-3 w-3" />}
              <span>{item.title}</span>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
