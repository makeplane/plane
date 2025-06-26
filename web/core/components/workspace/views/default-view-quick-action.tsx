"use client";

import { observer } from "mobx-react";
import { ExternalLink, LinkIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// ui
import { TStaticViewTypes } from "@plane/types";
import { CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
// helpers
type Props = {
  workspaceSlug: string;
  view: {
    key: TStaticViewTypes;
    i18n_label: string;
  };
};

export const DefaultWorkspaceViewQuickActions: React.FC<Props> = observer((props) => {
  const { workspaceSlug, view } = props;

  const { t } = useTranslation();

  const viewLink = `${workspaceSlug}/workspace-views/${view.key}`;
  const handleCopyText = () =>
    copyUrlToClipboard(viewLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "View link copied to clipboard.",
      });
    });
  const handleOpenInNewTab = () => window.open(`/${viewLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: t("open_in_new_tab"),
      icon: ExternalLink,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
    },
  ];

  return (
    <>
      <CustomMenu
        ellipsis
        placement="bottom-end"
        closeOnSelect
        buttonClassName="flex-shrink-0 flex items-center justify-center size-[26px] bg-custom-background-80/70 rounded"
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-custom-text-400": item.disabled,
                },
                item.className
              )}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <div>
                <h5>{t(item.title || "")}</h5>
                {item.description && (
                  <p
                    className={cn("text-custom-text-300 whitespace-pre-line", {
                      "text-custom-text-400": item.disabled,
                    })}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
