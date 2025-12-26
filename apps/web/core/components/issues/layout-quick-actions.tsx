import { observer } from "mobx-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
import { useLayoutMenuItems } from "@/components/common/quick-actions-helper";
import { Ellipsis, MoreHorizontal } from "lucide-react";
import { IconButton } from "@plane/propel/icon-button";

type Props = {
  workspaceSlug: string;
  projectId: string;
  storeType: "PROJECT" | "EPIC";
};

export const LayoutQuickActions = observer(function LayoutQuickActions(props: Props) {
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

  const menuResult = useLayoutMenuItems({
    workspaceSlug,
    projectId,
    storeType,
    handleCopyLink,
    handleOpenInNewTab,
  });

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
        className="flex-shrink-0 flex items-center justify-center size-[26px] rounded"
        customButton={<IconButton size="lg" variant="tertiary" icon={Ellipsis} />}
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={item.action}
              className={cn("flex items-center gap-2", {
                "text-placeholder": item.disabled,
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
